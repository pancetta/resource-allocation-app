/**********************
 * Scheduled Backups View
 * Handles UI for automated backup scheduling
 **********************/

import {
    getBackupConfig,
    saveBackupConfig,
    getBackupHistory,
    performBackup,
    initScheduler,
    requestBackupDirectory,
    requestNotificationPermission,
    downloadPreparedBackup
} from '../helpers/autoBackupScheduler.js';
import { showToast } from '../ui/toast.js';

export async function init() {
    // Guard against running in non-DOM environments (like tests)
    /* c8 ignore next 3 */
    if (typeof document === 'undefined') {
        return;
    }
    
    // Load current configuration
    loadConfig();
    
    // Setup event listeners
    setupEventListeners();
    
    // Render backup history
    renderBackupHistory();
    
    // Initialize the scheduler if enabled
    initScheduler();
}

function loadConfig() {
    const config = getBackupConfig();
    
    const enableCheckbox = document.getElementById('enableScheduledBackups');
    const intervalSelect = document.getElementById('backupInterval');
    const storageTypeSelect = document.getElementById('backupStorageType');
    const keepVersionsInput = document.getElementById('keepVersions');
    const notifyCheckbox = document.getElementById('notifyOnBackup');
    const settingsDiv = document.getElementById('scheduledBackupSettings');
    
    if (!enableCheckbox) return;
    
    enableCheckbox.checked = config.enabled;
    if (intervalSelect) intervalSelect.value = config.intervalMinutes;
    if (storageTypeSelect) storageTypeSelect.value = config.storageType;
    if (keepVersionsInput) keepVersionsInput.value = config.keepVersions;
    if (notifyCheckbox) notifyCheckbox.checked = config.notifyOnBackup;
    
    // Show/hide settings based on enabled status
    if (settingsDiv) {
        settingsDiv.style.display = config.enabled ? 'block' : 'none';
    }
    
    // Update storage-specific UI
    updateStorageTypeUI(config.storageType);
    
    // Update status display
    updateStatusDisplay(config);
}

function updateStorageTypeUI(storageType) {
    const fileSystemSetup = document.getElementById('fileSystemSetup');
    const cloudStorageSetup = document.getElementById('cloudStorageSetup');
    
    if (!fileSystemSetup || !cloudStorageSetup) return;
    
    // Hide all setup sections
    fileSystemSetup.style.display = 'none';
    cloudStorageSetup.style.display = 'none';
    
    // Show relevant setup section
    if (storageType === 'filesystem') {
        fileSystemSetup.style.display = 'block';
    } else if (['github-gist', 'google-drive', 'dropbox'].includes(storageType)) {
        cloudStorageSetup.style.display = 'block';
    }
}

function updateStatusDisplay(config) {
    const schedulerStatus = document.getElementById('schedulerStatus');
    const lastScheduledBackup = document.getElementById('lastScheduledBackup');
    
    if (!schedulerStatus) return;
    
    if (config.enabled) {
        schedulerStatus.textContent = `✓ Scheduler running (every ${config.intervalMinutes} minutes to ${config.storageType})`;
        schedulerStatus.style.color = '#28a745';
    } else {
        schedulerStatus.textContent = '○ Scheduler not running';
        schedulerStatus.style.color = '#666';
    }
    
    if (lastScheduledBackup && config.lastBackupTime) {
        const lastBackupDate = new Date(config.lastBackupTime);
        lastScheduledBackup.textContent = `Last backup: ${lastBackupDate.toLocaleString()}`;
        lastScheduledBackup.style.color = '#28a745';
    } else if (lastScheduledBackup) {
        lastScheduledBackup.textContent = 'No backups yet';
        lastScheduledBackup.style.color = '#666';
    }
}

function setupEventListeners() {
    const enableCheckbox = document.getElementById('enableScheduledBackups');
    const settingsDiv = document.getElementById('scheduledBackupSettings');
    const saveSettingsBtn = document.getElementById('saveBackupSettingsBtn');
    const testBackupBtn = document.getElementById('testBackupNowBtn');
    const storageTypeSelect = document.getElementById('backupStorageType');
    const selectDirBtn = document.getElementById('selectBackupDirBtn');
    const notifyCheckbox = document.getElementById('notifyOnBackup');
    const requestNotificationBtn = document.getElementById('requestNotificationBtn');
    
    // Enable/disable settings
    if (enableCheckbox && settingsDiv) {
        enableCheckbox.addEventListener('change', () => {
            settingsDiv.style.display = enableCheckbox.checked ? 'block' : 'none';
        });
    }
    
    // Storage type changes
    if (storageTypeSelect) {
        storageTypeSelect.addEventListener('change', (e) => {
            updateStorageTypeUI(e.target.value);
        });
    }
    
    // Select backup directory (for file system storage)
    if (selectDirBtn) {
        selectDirBtn.addEventListener('click', async () => {
            try {
                const selected = await requestBackupDirectory();
                const statusSpan = document.getElementById('backupDirStatus');
                if (selected && statusSpan) {
                    statusSpan.textContent = '✓ Directory selected';
                    statusSpan.style.color = '#28a745';
                }
            } catch (e) {
                showToast(`Failed to select directory: ${e.message}`, 'error');
            }
        });
    }
    
    // Notification permission
    if (notifyCheckbox && requestNotificationBtn) {
        // Show request button if notifications not permitted
        if ('Notification' in window && Notification.permission !== 'granted') {
            requestNotificationBtn.style.display = 'inline-block';
        }
        
        notifyCheckbox.addEventListener('change', () => {
            if (notifyCheckbox.checked && 'Notification' in window && Notification.permission !== 'granted') {
                requestNotificationBtn.style.display = 'inline-block';
            }
        });
        
        requestNotificationBtn.addEventListener('click', async () => {
            const granted = await requestNotificationPermission();
            if (granted) {
                requestNotificationBtn.style.display = 'none';
                showToast('Notification permission granted!', 'success');
            } else {
                showToast('Notification permission was denied. You can change this in your browser settings.', 'warning');
            }
        });
    }
    
    // Save settings
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', async () => {
            try {
                const config = {
                    enabled: enableCheckbox?.checked || false,
                    intervalMinutes: parseInt(document.getElementById('backupInterval')?.value || 30),
                    storageType: document.getElementById('backupStorageType')?.value || 'download',
                    keepVersions: parseInt(document.getElementById('keepVersions')?.value || 20),
                    notifyOnBackup: document.getElementById('notifyOnBackup')?.checked || false,
                    lastBackupTime: getBackupConfig().lastBackupTime
                };
                
                saveBackupConfig(config);
                updateStatusDisplay(config);
                showToast('Backup settings saved successfully!', 'success');
            } catch (e) {
                showToast(`Failed to save settings: ${e.message}`, 'error');
            }
        });
    }
    
    // Test backup now
    if (testBackupBtn) {
        testBackupBtn.addEventListener('click', async () => {
            testBackupBtn.disabled = true;
            testBackupBtn.textContent = '⏳ Running backup...';
            
            try {
                const result = await performBackup();
                
                if (result.success) {
                    // If it requires user action (download type), trigger download
                    if (result.requiresUserAction) {
                        const downloaded = downloadPreparedBackup();
                        if (downloaded) {
                            showToast('Backup prepared and download started! Check your Downloads folder.', 'success', 5000);
                        } else {
                            showToast('Backup completed! ' + result.message, 'success', 4000);
                        }
                    } else {
                        showToast('Backup completed successfully! ' + result.message, 'success', 4000);
                    }
                    
                    // Update displays
                    loadConfig();
                    renderBackupHistory();
                } else {
                    showToast('Backup failed: ' + result.message, 'error', 5000);
                }
            } catch (e) {
                showToast(`Backup error: ${e.message}`, 'error');
            } finally {
                testBackupBtn.disabled = false;
                testBackupBtn.textContent = '🔧 Test Backup Now';
            }
        });
    }
}

function renderBackupHistory() {
    const tbody = document.querySelector('#backupHistoryTable tbody');
    if (!tbody) return;
    
    const history = getBackupHistory();
    tbody.innerHTML = '';
    
    if (history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #666;">No backup history yet</td></tr>';
        return;
    }
    
    history.forEach(entry => {
        const row = document.createElement('tr');
        
        const timeCell = document.createElement('td');
        const date = new Date(entry.timestamp);
        timeCell.textContent = date.toLocaleString();
        row.appendChild(timeCell);
        
        const typeCell = document.createElement('td');
        typeCell.textContent = entry.storageType || 'unknown';
        row.appendChild(typeCell);
        
        const statusCell = document.createElement('td');
        statusCell.textContent = entry.success ? '✓ Success' : '✗ Failed';
        statusCell.style.color = entry.success ? '#28a745' : '#dc3545';
        row.appendChild(statusCell);
        
        const messageCell = document.createElement('td');
        messageCell.textContent = entry.message || '';
        messageCell.style.fontSize = '0.85em';
        row.appendChild(messageCell);
        
        tbody.appendChild(row);
    });
}
