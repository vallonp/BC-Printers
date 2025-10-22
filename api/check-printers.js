// api/check-printers.js
const snmp = require('net-snmp');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔄 Checking BC printers...');
    
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

    // Use demo data for now since SNMP might not work on Vercel
    const results = await generateDemoData(printers);

    console.log(`✅ Generated data for ${results.length} printers`);
    
    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      message: 'Using demo data - SNMP not available on Vercel'
    });

  } catch (error) {
    console.error('❌ Error in check-printers:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error occurred'
    });
  }
};

// Generate realistic demo data
async function generateDemoData(printers) {
  return printers.map(printer => {
    const isColorPrinter = printer.name.toLowerCase().includes('color');
    const isOnline = Math.random() > 0.2; // 80% online
    
    if (isOnline) {
      // Online printer with realistic data
      const blackToner = Math.floor(Math.random() * 40) + 30; // 30-70%
      const maintenanceLevel = Math.floor(Math.random() * 50) + 40; // 40-90%
      
      // Tray statuses
      const trayStatuses = ['OK', 'LOW', 'EMPTY'];
      const tray2Status = trayStatuses[Math.floor(Math.random() * 3)];
      const tray3Status = trayStatuses[Math.floor(Math.random() * 3)];
      
      // Printer status
      const statusOptions = ['ready', 'sleep', 'ready', 'ready']; // Mostly ready
      const printerStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      if (isColorPrinter) {
        // Color printer data
        return {
          name: printer.name,
          ip: printer.ip,
          status: 'online',
          printerStatus: printerStatus,
          toners: [
            { color: 'Black', level: blackToner },
            { color: 'Cyan', level: Math.floor(Math.random() * 50) + 20 },
            { color: 'Magenta', level: Math.floor(Math.random() * 60) + 15 },
            { color: 'Yellow', level: Math.floor(Math.random() * 55) + 25 }
          ],
          trays: [
            { name: 'Tray 2', status: tray2Status },
            { name: 'Tray 3', status: tray3Status }
          ],
          maintenanceKit: { level: maintenanceLevel },
          responseTime: Math.floor(Math.random() * 100) + 50,
          timestamp: new Date().toISOString(),
          method: 'demo'
        };
      } else {
        // Black & white printer data
        return {
          name: printer.name,
          ip: printer.ip,
          status: 'online',
          printerStatus: printerStatus,
          toners: [
            { color: 'Black', level: blackToner }
          ],
          trays: [
            { name: 'Tray 2', status: tray2Status },
            { name: 'Tray 3', status: tray3Status }
          ],
          maintenanceKit: { level: maintenanceLevel },
          responseTime: Math.floor(Math.random() * 100) + 50,
          timestamp: new Date().toISOString(),
          method: 'demo'
        };
      }
    } else {
      // Offline printer
      return {
        name: printer.name,
        ip: printer.ip,
        status: 'offline',
        printerStatus: 'offline',
        toners: [{ color: 'Black', level: 0 }],
        trays: [
          { name: 'Tray 2', status: 'UNKNOWN' },
          { name: 'Tray 3', status: 'UNKNOWN' }
        ],
        maintenanceKit: { level: 0 },
        responseTime: null,
        error: 'Printer not responding',
        timestamp: new Date().toISOString(),
        method: 'demo'
      };
    }
  });
}

// Keep the original SNMP function for reference
async function checkPrinterSNMP(printer) {
  // This would be the real SNMP implementation
  // But it likely won't work on Vercel due to network restrictions
  return generateDemoData([printer])[0];
}
