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
import { showImportPreview } from '../helpers/importPreview.js';
import { showDataPruningDialog } from '../helpers/dataPruning.js';
import {
    MILLISECONDS_PER_SECOND,
    SECONDS_PER_MINUTE,
    MINUTES_PER_HOUR,
    HOURS_PER_DAY,
    AUTO_BACKUP_DELAY_MS
} from '../config/constants.js';

export async function init() {
    // Guard against running in non-DOM environments (like tests)
    /* c8 ignore next 3 */
    if (typeof document === 'undefined') {
        return;
    }
    
    // Export button
    const exportBtn = document.getElementById("exportDataBtn");
    if (exportBtn) {
        exportBtn.addEventListener("click", async () => {
            try {
                const data = await exportAllData();
                const filename = downloadJSON(data);
                showDownloadSuccess(filename);
            } catch (e) {
                /* c8 ignore next 1 */
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
                const filename = downloadJSON(autoBackup.data);
                showDownloadSuccess(filename);
            } catch (e) {
                /* c8 ignore next 1 */
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
                
                // Show import preview dialog
                const confirmed = await showImportPreview(data);
                
                if (!confirmed) {
                    e.target.value = "";
                    return;
                }

                await importAllData(data);
                /* c8 ignore next 2 */
                alert("Data imported successfully! Refreshing...");
                location.reload();
            } catch (e) {
                alert("Import failed: " + e.message);
            } finally {
                e.target.value = "";
            }
        });
    }
    
    // Data pruning button
    const dataPruningBtn = document.getElementById("dataPruningBtn");
    if (dataPruningBtn) {
        dataPruningBtn.addEventListener("click", async () => {
            await showDataPruningDialog();
        });
    }

    // Create manual backup button
    const createBackupBtn = document.getElementById("createBackupBtn");
    if (createBackupBtn) {
        createBackupBtn.addEventListener("click", async () => {
            try {
                await createBackup();
                /* c8 ignore next 1 */
                alert("✅ Backup created successfully!\n\nThe backup is stored in your browser's localStorage. To save a permanent copy, use the 'Download Latest Auto-Backup' button above.");
                await renderBackups();
            } catch (e) {
                /* c8 ignore next 1 */
                alert("Backup failed: " + e.message);
            }
        });
    }

    // Initial backup list render
    await renderBackups();
    
    // Update auto-backup status
    updateAutoBackupStatus();
    
    // Set up beforeunload warning
    setupBeforeUnloadWarning();
}

// Helper function to download JSON
export function downloadJSON(data) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = `resource-allocation-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return filename;
}

// Show download success message with helpful info
export function showDownloadSuccess(filename) {
    const message = `✅ Download started successfully!\n\n` +
                   `File: ${filename}\n\n` +
                   `The file will be saved to your browser's default Downloads folder.\n\n` +
                   `💡 Tip: Check your browser's download bar (usually at the bottom) or Downloads folder to find the file.`;
    alert(message);
}

// Set up warning before closing window with unsaved changes
export function setupBeforeUnloadWarning() {
    /* c8 ignore next 3 */
    if (typeof window === 'undefined') {
        return;
    }
    
    // Threshold in minutes before showing backup warning
    const BACKUP_WARNING_THRESHOLD_MINUTES = 5;
    
    window.addEventListener('beforeunload', (e) => {
        const autoBackup = getAutoPreparedBackup();
        
        // Only show warning if there's data and auto-backup exists
        if (autoBackup) {
            const preparedDate = new Date(autoBackup.preparedAt);
            
            // Validate that the date is valid before calculation
            /* c8 ignore next 3 */
            if (isNaN(preparedDate.getTime())) {
                return; // Skip warning if date is invalid
            }
            
            const minutesAgo = Math.floor((Date.now() - preparedDate.getTime()) / 60000);
            
            // Show warning if backup is older than threshold
            /* c8 ignore next 8 */
            if (minutesAgo >= BACKUP_WARNING_THRESHOLD_MINUTES) {
                // Note: Modern browsers ignore custom messages and show their own generic dialog.
                // The message assignment and return value are still needed to trigger the dialog.
                const message = "You have unsaved changes! Consider downloading a backup before leaving.";
                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        }
    });
}

// Update auto-backup status display
export function updateAutoBackupStatus() {
    /* c8 ignore next 3 */
    if (typeof document === 'undefined') {
        return;
    }
    
    const statusElement = document.getElementById("autoBackupStatus");
    const downloadBtn = document.getElementById("downloadAutoBackupBtn");
    
    /* c8 ignore next 3 */
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
export function getTimeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / MILLISECONDS_PER_SECOND);
    
    if (seconds < SECONDS_PER_MINUTE) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    
    const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
    if (minutes < MINUTES_PER_HOUR) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / MINUTES_PER_HOUR);
    if (hours < HOURS_PER_DAY) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / HOURS_PER_DAY);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
}

async function renderBackups() {
    /* c8 ignore next 3 */
    if (typeof document === 'undefined') {
        return;
    }
    
    const tbody = document.querySelector("#backupsTable tbody");
    /* c8 ignore next 3 */
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
                /* c8 ignore next 2 */
                alert("Backup restored successfully! Refreshing...");
                location.reload();
            } catch (e) {
                /* c8 ignore next 1 */
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
            /* c8 ignore next 1 */
            console.error("Auto-backup failed:", e);
        }
    }, AUTO_BACKUP_DELAY_MS);
}
