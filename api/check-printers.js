const snmp = require('net-snmp');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const printers = [
      { name: 'Oneill3rdfloorprinter01.bc.edu', ip: '136.167.67.130', community: 'public' },
      { name: 'Oneill3rdfloorprinter02.bc.edu', ip: '136.167.66.108', community: 'public' },
      { name: 'Oneill3rdfloorprinter03.bc.edu', ip: '136.167.67.32', community: 'public' },
      { name: 'Oneill3rdfloorprinter04.bc.edu', ip: '136.167.69.110', community: 'public' },
      { name: 'Oneill3rdfloorprinter05.bc.edu', ip: '136.167.69.140', community: 'public' },
      { name: 'oneill3rdfloorprinter06.bc.edu', ip: '136.167.66.240', community: 'public' },
      { name: 'oneill3rdfloorcolorprinter01.bc.edu', ip: '136.167.67.81', community: 'public' },
      { name: '2150comm.bc.edu', ip: '136.167.214.175', community: 'public' },
      { name: 'WIHD', ip: '136.167.66.220', community: 'public' },
      { name: 'mcprinter01', ip: '136.167.119.90', community: 'public' }
    ];

    const results = await Promise.all(
      printers.map(printer => checkPrinter(printer))
    );

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in check-printers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function checkPrinter(printer) {
  const startTime = Date.now();
  
  try {
    // Define OIDs for different printer data
    const oids = [
      '1.3.6.1.2.1.43.11.1.1.9.1.1', // Black toner
      '1.3.6.1.2.1.43.8.2.1.12.1.2', // Tray 2
      '1.3.6.1.2.1.43.8.2.1.12.1.3', // Tray 3
      '1.3.6.1.2.1.43.11.1.1.9.1.5', // Maintenance kit (common OID)
    ];

    // Add color OIDs for color printers
    if (printer.name.toLowerCase().includes('color')) {
      oids.push(
        '1.3.6.1.2.1.43.11.1.1.9.1.2', // Cyan
        '1.3.6.1.2.1.43.11.1.1.9.1.3', // Magenta
        '1.3.6.1.2.1.43.11.1.1.9.1.4'  // Yellow
      );
    }

    const session = snmp.createSession(printer.ip, printer.community, {
      timeout: 5000,
      retries: 1
    });

    const varbinds = await new Promise((resolve, reject) => {
      session.get(oids, (error, varbinds) => {
        session.close();
        if (error) reject(error);
        else resolve(varbinds);
      });
    });

    const toners = [];
    const trays = [];
    let maintenanceKit = { level: 100 }; // Default

    varbinds.forEach((vb, index) => {
      if (vb.value !== null && !isNaN(vb.value)) {
        const oid = vb.oid;
        
        // Toner levels
        if (oid.includes('1.3.6.1.2.1.43.11.1.1.9.1.')) {
          const tonerIndex = parseInt(oid.split('.').pop());
          const colors = ['Black', 'Cyan', 'Magenta', 'Yellow', 'Maintenance'];
          
          if (colors[tonerIndex - 1]) {
            if (tonerIndex === 5) {
              // Maintenance kit
              maintenanceKit.level = Math.min(100, Math.max(0, parseInt(vb.value)));
            } else {
              // Regular toner
              toners.push({
                color: colors[tonerIndex - 1],
                level: Math.min(100, Math.max(0, parseInt(vb.value)))
              });
            }
          }
        }
        
        // Tray status (only trays 2 and 3)
        else if (oid.includes('1.3.6.1.2.1.43.8.2.1.12.1.')) {
          const trayIndex = parseInt(oid.split('.').pop());
          const statusMap = {1: 'OK', 2: 'LOW', 3: 'EMPTY', 4: 'OPEN'};
          trays.push({
            name: `Tray ${trayIndex}`,
            status: statusMap[vb.value] || 'UNKNOWN'
          });
        }
      }
    });

    return {
      name: printer.name,
      ip: printer.ip,
      status: 'online',
      toners: toners.length > 0 ? toners : [{ color: 'Black', level: 100 }],
      trays: trays.length > 0 ? trays : [
        { name: 'Tray 2', status: 'OK' },
        { name: 'Tray 3', status: 'OK' }
      ],
      maintenanceKit: maintenanceKit,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      method: 'snmp'
    };

  } catch (error) {
    return {
      name: printer.name,
      ip: printer.ip,
      status: 'offline',
      error: error.message,
      toners: [{ color: 'Black', level: 0 }],
      trays: [
        { name: 'Tray 2', status: 'UNKNOWN' },
        { name: 'Tray 3', status: 'UNKNOWN' }
      ],
      maintenanceKit: { level: 0 },
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}
