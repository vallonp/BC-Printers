class BCPrinterMonitor {
    constructor() {
        this.printers = [
            { name: 'Oneill3rdfloorprinter01.bc.edu', ip: '136.167.67.130' },
            { name: 'Oneill3rdfloorprinter02.bc.edu', ip: '136.167.66.108' },
            { name: 'Oneill3rdfloorprinter03.bc.edu', ip: '136.167.67.32' },
            { name: 'Oneill3rdfloorprinter04.bc.edu', ip: '136.167.69.110' },
            { name: 'Oneill3rdfloorprinter05.bc.edu', ip: '136.167.69.140' },
            { name: 'oneill3rdfloorprinter06.bc.edu', ip: '136.167.66.240' },
            { name: 'oneill3rdfloorcolorprinter01.bc.edu', ip: '136.167.67.81' },
            { name: '2150comm.bc.edu', ip: '136.167.214.175' },
            { name: 'WIHD', ip: '136.167.66.220' },
            { name: 'mcprinter01', ip: '136.167.119.90' }
        ];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAllPrinters();
        setInterval(() => this.checkAllPrinters(), 120000); // 2 minutes
    }

    bindEvents() {
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.checkAllPrinters();
        });
    }

    async checkAllPrinters() {
        const refreshBtn = document.getElementById('refreshBtn');
        const loading = document.getElementById('loading');
        
        refreshBtn.disabled = true;
        loading.style.display = 'flex';
        
        try {
            const response = await fetch('/api/check-printers');
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.updateDisplay(result.data);
                this.updateStats(result.data);
                
                const now = new Date();
                document.getElementById('lastUpdated').textContent = 
                    `Last updated: ${now.toLocaleTimeString()}`;
                document.getElementById('footerTimestamp').textContent = 
                    `Data current as of: ${now.toLocaleString()}`;
                    
            } else {
                throw new Error(result.error || 'Unknown error');
            }
            
        } catch (error) {
            console.error('Error fetching printer data:', error);
            this.showError('Unable to load printer data. Please try again.');
        } finally {
            refreshBtn.disabled = false;
            loading.style.display = 'none';
        }
    }

    updateDisplay(printers) {
        this.updateTonerOverview(printers);
        this.updateMaintenanceOverview(printers);
        this.updateDetailedView(printers);
    }

    updateTonerOverview(printers) {
        const container = document.getElementById('tonerOverview');
        container.innerHTML = '';
        
        printers.forEach(printer => {
            if (printer.status !== 'online') return;
            
            const isColorPrinter = printer.name.toLowerCase().includes('color');
            let tonerLevel = 0;
            let tonerType = 'Black';
            
            if (isColorPrinter) {
                // Calculate average of all color toners
                const total = printer.toners.reduce((sum, toner) => sum + toner.level, 0);
                tonerLevel = Math.round(total / printer.toners.length);
                tonerType = 'Color';
            } else {
                // Get black toner level
                const blackToner = printer.toners.find(t => t.color === 'Black');
                tonerLevel = blackToner ? blackToner.level : 0;
                tonerType = 'Black';
            }
            
            const levelClass = tonerLevel > 50 ? 'high' : tonerLevel > 20 ? 'medium' : 'low';
            
            container.innerHTML += `
                <div class="toner-card ${levelClass}">
                    <div class="toner-header">
                        <div class="printer-name">${printer.name}</div>
                        <div class="toner-percentage">${tonerLevel}%</div>
                    </div>
                    <div class="toner-bar">
                        <div class="toner-fill ${levelClass}" style="width: ${tonerLevel}%"></div>
                    </div>
                    <div class="toner-details">
                        <span>${tonerType} Toner</span>
                        <span>${this.getTonerStatusText(tonerLevel)}</span>
                    </div>
                </div>
            `;
        });
    }

    updateMaintenanceOverview(printers) {
        const container = document.getElementById('maintenanceOverview');
        container.innerHTML = '';
        
        printers.forEach(printer => {
            if (printer.status !== 'online') return;
            
            const maintenance = printer.maintenanceKit || { level: 100 };
            const levelClass = maintenance.level > 30 ? 'high' : maintenance.level > 10 ? 'low' : 'critical';
            const statusText = maintenance.level > 30 ? 'Good' : maintenance.level > 10 ? 'Low' : 'Replace Soon';
            
            container.innerHTML += `
                <div class="maintenance-card ${levelClass}">
                    <div class="toner-header">
                        <div class="printer-name">${printer.name}</div>
                        <div class="toner-percentage">${maintenance.level}%</div>
                    </div>
                    <div class="toner-bar">
                        <div class="toner-fill ${levelClass}" style="width: ${maintenance.level}%"></div>
                    </div>
                    <div class="toner-details">
                        <span>Maintenance Kit</span>
                        <span>${statusText}</span>
                    </div>
                </div>
            `;
        });
    }

    updateDetailedView(printers) {
        const container = document.getElementById('printersContainer');
        container.innerHTML = '';
        
        printers.forEach(printer => {
            const isColorPrinter = printer.name.toLowerCase().includes('color');
            const statusClass = this.getStatusClass(printer.status);
            const statusText = this.getStatusText(printer);
            
            container.innerHTML += `
                <div class="printer-detail-card ${printer.status}">
                    <div class="printer-card-header">
                        <div>
                            <div class="printer-title">${printer.name}</div>
                            <div class="printer-ip">${printer.ip}</div>
                        </div>
                        <div class="status-badge status-${statusClass}">${printer.status.toUpperCase()}</div>
                    </div>
                    
                    <div class="printer-card-body">
                        <!-- Status Section -->
                        <div class="status-section">
                            <div class="section-subtitle">🔄 Status</div>
                            <div class="status-badge status-${statusClass}">${statusText}</div>
                            ${printer.error ? `<div style="color: var(--bc-danger); margin-top: 0.5rem; font-size: 0.9rem;">${printer.error}</div>` : ''}
                        </div>
                        
                        <!-- Toner Section -->
                        <div class="toner-section">
                            <div class="section-subtitle">🎨 Toner</div>
                            ${isColorPrinter ? this.renderColorToner(printer) : this.renderBlackToner(printer)}
                        </div>
                        
                        <!-- Maintenance Section -->
                        <div class="toner-section">
                            <div class="section-subtitle">🔧 Maintenance Kit</div>
                            ${this.renderMaintenanceKit(printer)}
                        </div>
                        
                        <!-- Tray Section -->
                        <div class="tray-section">
                            <div class="section-subtitle">📦 Paper Trays</div>
                            ${this.renderTrays(printer)}
                        </div>
                    </div>
                </div>
            `;
        });
    }

    renderColorToner(printer) {
        const total = printer.toners.reduce((sum, toner) => sum + toner.level, 0);
        const average = Math.round(total / printer.toners.length);
        const levelClass = average > 50 ? 'high' : average > 20 ? 'medium' : 'low';
        
        return `
            <div style="margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span>Color Toner</span>
                    <span><strong>${average}%</strong></span>
                </div>
                <div class="toner-bar">
                    <div class="toner-fill ${levelClass}" style="width: ${average}%"></div>
                </div>
            </div>
        `;
    }

    renderBlackToner(printer) {
        const blackToner = printer.toners.find(t => t.color === 'Black');
        const level = blackToner ? blackToner.level : 0;
        const levelClass = level > 50 ? 'high' : level > 20 ? 'medium' : 'low';
        
        return `
            <div style="margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span>Black Toner</span>
                    <span><strong>${level}%</strong></span>
                </div>
                <div class="toner-bar">
                    <div class="toner-fill ${levelClass}" style="width: ${level}%"></div>
                </div>
            </div>
        `;
    }

    renderMaintenanceKit(printer) {
        const maintenance = printer.maintenanceKit || { level: 100 };
        const levelClass = maintenance.level > 30 ? 'high' : maintenance.level > 10 ? 'medium' : 'low';
        
        return `
            <div style="margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span>MAT Kit</span>
                    <span><strong>${maintenance.level}%</strong></span>
                </div>
                <div class="toner-bar">
                    <div class="toner-fill ${levelClass}" style="width: ${maintenance.level}%"></div>
                </div>
            </div>
        `;
    }

    renderTrays(printer) {
        if (!printer.trays || printer.trays.length === 0) {
            return '<div style="color: var(--bc-gray);">No tray information available</div>';
        }
        
        return printer.trays.map(tray => `
            <div class="tray-item">
                <span>${tray.name}</span>
                <span class="tray-status tray-${tray.status.toLowerCase()}">${tray.status}</span>
            </div>
        `).join('');
    }

    updateStats(printers) {
        const total = printers.length;
        const online = printers.filter(p => p.status === 'online').length;
        const offline = total - online;
        
        // Calculate printers needing attention (low toner or maintenance)
        const needsAttention = printers.filter(printer => {
            if (printer.status !== 'online') return false;
            
            const isColorPrinter = printer.name.toLowerCase().includes('color');
            let tonerLevel = 0;
            
            if (isColorPrinter) {
                const total = printer.toners.reduce((sum, toner) => sum + toner.level, 0);
                tonerLevel = Math.round(total / printer.toners.length);
            } else {
                const blackToner = printer.toners.find(t => t.color === 'Black');
                tonerLevel = blackToner ? blackToner.level : 0;
            }
            
            const maintenanceLevel = printer.maintenanceKit ? printer.maintenanceKit.level : 100;
            
            return tonerLevel < 20 || maintenanceLevel < 20;
        }).length;

        document.getElementById('totalPrinters').textContent = total;
        document.getElementById('onlinePrinters').textContent = online;
        document.getElementById('offlinePrinters').textContent = offline;
        document.getElementById('needsAttention').textContent = needsAttention;
    }

    getStatusClass(status) {
        const statusMap = {
            'online': 'ready',
            'offline': 'unknown',
            'sleep': 'sleep',
            'jammed': 'jam',
            'maintenance': 'maintenance'
        };
        return statusMap[status] || 'unknown';
    }

    getStatusText(printer) {
        if (printer.status !== 'online') return 'Offline';
        
        // Check for specific status conditions
        if (printer.trays) {
            const emptyTray = printer.trays.find(tray => tray.status === 'EMPTY');
            if (emptyTray) return `Empty: ${emptyTray.name}`;
            
            const lowTray = printer.trays.find(tray => tray.status === 'LOW');
            if (lowTray) return `Low Paper: ${lowTray.name}`;
        }
        
        return 'Ready';
    }

    getTonerStatusText(level) {
        if (level > 50) return 'Good';
        if (level > 20) return 'Low';
        return 'Very Low';
    }

    showError(message) {
        // Simple error notification
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bc-danger);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 1001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 5000);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new BCPrinterMonitor();
});
