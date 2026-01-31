/**********************
 * Data Management View
 * Handles data export, import, and backup/restore
 **********************/

import {
    exportAllData,
    importAllData,
    createBackup,
    getAllBackups,
    restoreBackup,
    deleteBackup,
    getAutoPreparedBackup
} from '../data/database.js';

export async function init() {
    // Guard against running in non-DOM environments (like tests)
    if (typeof document === 'undefined') {
        return;
    }
    
    // Export button
    const exportBtn = document.getElementById("exportDataBtn");
    if (exportBtn) {
        exportBtn.addEventListener("click", async () => {
            try {
                const data = await exportAllData();
                downloadJSON(data);
                alert("Data exported successfully!");
            } catch (e) {
                alert("Export failed: " + e.message);
            }
        });
    }

    // Download auto-prepared JSON backup
    const downloadAutoBtn = document.getElementById("downloadAutoBackupBtn");
    if (downloadAutoBtn) {
        downloadAutoBtn.addEventListener("click", () => {
            const autoBackup = getAutoPreparedBackup();
            if (!autoBackup) {
                alert("No automatic backup available yet. Please wait a moment and try again.");
                return;
            }
            
            try {
                downloadJSON(autoBackup.data);
                alert("Automatic backup downloaded successfully!");
            } catch (e) {
                alert("Download failed: " + e.message);
            }
        });
    }

    // Import button
    const importBtn = document.getElementById("importDataBtn");
    const importFileInput = document.getElementById("importFileInput");
    if (importBtn && importFileInput) {
        importBtn.addEventListener("click", () => {
            importFileInput.click();
        });

        // File input handler
        importFileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                if (!confirm("This will replace all existing data. Are you sure?")) {
                    e.target.value = "";
                    return;
                }

                await importAllData(data);
                alert("Data imported successfully! Refreshing...");
                location.reload();
            } catch (e) {
                alert("Import failed: " + e.message);
            } finally {
                e.target.value = "";
            }
        });
    }

    // Create manual backup button
    const createBackupBtn = document.getElementById("createBackupBtn");
    if (createBackupBtn) {
        createBackupBtn.addEventListener("click", async () => {
            try {
                await createBackup();
                alert("Backup created successfully!");
                await renderBackups();
            } catch (e) {
                alert("Backup failed: " + e.message);
            }
        });
    }

    // Initial backup list render
    await renderBackups();
    
    // Update auto-backup status
    updateAutoBackupStatus();
}

// Helper function to download JSON
function downloadJSON(data) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resource-allocation-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Update auto-backup status display
function updateAutoBackupStatus() {
    if (typeof document === 'undefined') {
        return;
    }
    
    const statusElement = document.getElementById("autoBackupStatus");
    const downloadBtn = document.getElementById("downloadAutoBackupBtn");
    
    if (!statusElement || !downloadBtn) {
        return; // Elements don't exist in this environment
    }
    
    const autoBackup = getAutoPreparedBackup();
    
    if (autoBackup) {
        const preparedDate = new Date(autoBackup.preparedAt);
        const timeAgo = getTimeAgo(preparedDate);
        statusElement.textContent = `Last prepared: ${timeAgo} (${preparedDate.toLocaleString()})`;
        statusElement.className = "auto-backup-status ready";
        downloadBtn.disabled = false;
    } else {
        statusElement.textContent = "No automatic backup prepared yet";
        statusElement.className = "auto-backup-status not-ready";
        downloadBtn.disabled = true;
    }
}

// Get human-readable time ago
function getTimeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
}

async function renderBackups() {
    if (typeof document === 'undefined') {
        return;
    }
    
    const tbody = document.querySelector("#backupsTable tbody");
    if (!tbody) {
        return; // Element doesn't exist in this environment
    }
    
    const backups = getAllBackups();
    tbody.innerHTML = "";

    if (backups.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">No backups found</td></tr>';
        return;
    }

    backups.forEach(backup => {
        const row = document.createElement("tr");
        
        const dateCell = document.createElement("td");
        dateCell.textContent = backup.date.toLocaleString();
        row.appendChild(dateCell);

        const exportDateCell = document.createElement("td");
        exportDateCell.textContent = new Date(backup.exportDate).toLocaleString();
        row.appendChild(exportDateCell);

        const actionsCell = document.createElement("td");
        
        const restoreBtn = document.createElement("button");
        restoreBtn.textContent = "Restore";
        restoreBtn.addEventListener("click", async () => {
            if (!confirm("This will replace all current data with this backup. Continue?")) {
                return;
            }
            try {
                await restoreBackup(backup.key);
                alert("Backup restored successfully! Refreshing...");
                location.reload();
            } catch (e) {
                alert("Restore failed: " + e.message);
            }
        });
        actionsCell.appendChild(restoreBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.style.marginLeft = "5px";
        deleteBtn.addEventListener("click", () => {
            if (confirm("Delete this backup?")) {
                deleteBackup(backup.key);
                renderBackups();
            }
        });
        actionsCell.appendChild(deleteBtn);

        row.appendChild(actionsCell);
        tbody.appendChild(row);
    });
    
    // Update auto-backup status whenever we render backups
    updateAutoBackupStatus();
}

// Auto-backup on data changes
let autoBackupTimer = null;

export function scheduleAutoBackup() {
    // Clear existing timer
    if (autoBackupTimer) {
        clearTimeout(autoBackupTimer);
    }
    
    // Schedule backup in 5 seconds (debounced)
    autoBackupTimer = setTimeout(async () => {
        try {
            await createBackup();
            console.log("Auto-backup created at", new Date().toLocaleString());
            
            // Update the auto-backup status display if on Data tab
            if (document.getElementById("autoBackupStatus")) {
                updateAutoBackupStatus();
                await renderBackups();
            }
        } catch (e) {
            console.error("Auto-backup failed:", e);
        }
    }, 5000);
}
