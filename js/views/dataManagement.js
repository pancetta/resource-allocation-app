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
    deleteBackup
} from '../data/database.js';

export async function init() {
    // Export button
    document.getElementById("exportDataBtn").addEventListener("click", async () => {
        try {
            const data = await exportAllData();
            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `resource-allocation-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            alert("Data exported successfully!");
        } catch (e) {
            alert("Export failed: " + e.message);
        }
    });

    // Import button
    document.getElementById("importDataBtn").addEventListener("click", () => {
        document.getElementById("importFileInput").click();
    });

    // File input handler
    document.getElementById("importFileInput").addEventListener("change", async (e) => {
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

    // Create manual backup button
    document.getElementById("createBackupBtn").addEventListener("click", async () => {
        try {
            await createBackup();
            alert("Backup created successfully!");
            await renderBackups();
        } catch (e) {
            alert("Backup failed: " + e.message);
        }
    });

    // Initial backup list render
    await renderBackups();
}

async function renderBackups() {
    const backups = getAllBackups();
    const tbody = document.querySelector("#backupsTable tbody");
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
        } catch (e) {
            console.error("Auto-backup failed:", e);
        }
    }, 5000);
}
