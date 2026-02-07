/**********************
 * Automated Backup Scheduler
 * Handles scheduled backups to external storage options
 **********************/

import { exportAllData } from '../data/database.js';

// Backup configuration stored in localStorage
const BACKUP_CONFIG_KEY = 'resource-planning-backup-config';
const BACKUP_HISTORY_KEY = 'resource-planning-backup-history';
const MAX_HISTORY_ITEMS = 50;

// Default configuration
const DEFAULT_CONFIG = {
    enabled: false,
    intervalMinutes: 30, // Backup every 30 minutes
    storageType: 'download', // 'download', 'filesystem', 'github-gist', 'google-drive', 'dropbox'
    keepVersions: 20, // Keep last 20 versions
    notifyOnBackup: false,
    lastBackupTime: null
};

let schedulerInterval = null;
let fileSystemHandle = null;

// Module-scoped variables for prepared backup
let preparedBackupUrl = null;
let preparedBackupFilename = null;

/**
 * Get current backup configuration
 * @returns {Object} Backup configuration
 */
export function getBackupConfig() {
    try {
        const stored = localStorage.getItem(BACKUP_CONFIG_KEY);
        if (stored) {
            return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error('Failed to load backup config:', e);
    }
    return { ...DEFAULT_CONFIG };
}

/**
 * Save backup configuration
 * @param {Object} config - Backup configuration to save
 */
export function saveBackupConfig(config) {
    try {
        localStorage.setItem(BACKUP_CONFIG_KEY, JSON.stringify(config));
        // Restart scheduler with new config
        if (config.enabled) {
            startScheduler();
        } else {
            stopScheduler();
        }
    } catch (e) {
        console.error('Failed to save backup config:', e);
        throw new Error('Failed to save backup configuration');
    }
}

/**
 * Get backup history
 * @returns {Array} Array of backup history records
 */
export function getBackupHistory() {
    try {
        const stored = localStorage.getItem(BACKUP_HISTORY_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load backup history:', e);
    }
    return [];
}

/**
 * Add entry to backup history
 * @param {Object} entry - History entry
 */
function addToHistory(entry) {
    try {
        const history = getBackupHistory();
        history.unshift(entry);
        
        // Keep only MAX_HISTORY_ITEMS
        const trimmed = history.slice(0, MAX_HISTORY_ITEMS);
        
        localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (e) {
        console.error('Failed to save backup history:', e);
    }
}

/**
 * Perform a backup based on configured storage type
 * @returns {Promise<Object>} Result with success status and message
 */
export async function performBackup() {
    const config = getBackupConfig();
    const timestamp = new Date().toISOString();
    
    try {
        const data = await exportAllData();
        const filename = `resource-allocation-backup-${timestamp.split('T')[0]}-${timestamp.split('T')[1].split('.')[0].replace(/:/g, '-')}.json`;
        
        let result;
        switch (config.storageType) {
            case 'download':
                result = await backupToDownload(data, filename);
                break;
            case 'filesystem':
                result = await backupToFileSystem(data, filename);
                break;
            case 'github-gist':
                result = await backupToGitHubGist(data, filename);
                break;
            case 'google-drive':
                result = await backupToGoogleDrive(data, filename);
                break;
            case 'dropbox':
                result = await backupToDropbox(data, filename);
                break;
            default:
                throw new Error(`Unknown storage type: ${config.storageType}`);
        }
        
        // Update last backup time
        config.lastBackupTime = Date.now();
        saveBackupConfig(config);
        
        // Add to history
        addToHistory({
            timestamp: Date.now(),
            success: true,
            storageType: config.storageType,
            filename: filename,
            message: result.message
        });
        
        // Show notification if enabled
        if (config.notifyOnBackup && result.success) {
            showBackupNotification(result.message);
        }
        
        return result;
    } catch (e) {
        console.error('Backup failed:', e);
        
        // Add failure to history
        addToHistory({
            timestamp: Date.now(),
            success: false,
            storageType: config.storageType,
            message: e.message
        });
        
        return {
            success: false,
            message: `Backup failed: ${e.message}`
        };
    }
}

/**
 * Backup to browser downloads (automatic download)
 * @param {Object} data - Data to backup
 * @param {string} filename - Filename for backup
 * @returns {Promise<Object>} Result object
 */
async function backupToDownload(data, filename) {
    // Note: Automatic downloads may be blocked by browser if not user-initiated
    // This is best effort for scheduled backups
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // For automated backups, we can't force download without user interaction
    // Instead, we prepare the data and make it available
    try {
        // Store the prepared backup URL temporarily
        window.__autoBackupUrl = url;
        window.__autoBackupFilename = filename;
        
        return {
            success: true,
            message: `Backup prepared: ${filename}. Click notification to download.`,
            requiresUserAction: true
        };
    } catch (e) {
        URL.revokeObjectURL(url);
        throw e;
    }
}

/**
 * Backup to file system using File System Access API
 * @param {Object} data - Data to backup
 * @param {string} filename - Filename for backup
 * @returns {Promise<Object>} Result object
 */
async function backupToFileSystem(data, filename) {
    // Check if File System Access API is available
    if (!('showDirectoryPicker' in window)) {
        throw new Error('File System Access API not supported in this browser');
    }
    
    // If we don't have a handle, request one
    if (!fileSystemHandle) {
        // This requires user interaction, so it can't be fully automated
        // We'll need to store the handle after first user selection
        throw new Error('No directory selected. Please select a backup directory first.');
    }
    
    try {
        // Create file in the selected directory
        const fileHandle = await fileSystemHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        
        const jsonStr = JSON.stringify(data, null, 2);
        await writable.write(jsonStr);
        await writable.close();
        
        return {
            success: true,
            message: `Backup saved to file system: ${filename}`
        };
    } catch (e) {
        // Permission might have been revoked
        if (e.name === 'NotAllowedError') {
            fileSystemHandle = null;
            throw new Error('Permission to access directory was revoked. Please select directory again.');
        }
        throw e;
    }
}

/**
 * Set the file system directory handle for backups
 * @param {FileSystemDirectoryHandle} handle - Directory handle
 */
export function setFileSystemHandle(handle) {
    fileSystemHandle = handle;
}

/**
 * Request file system directory for backups
 * @returns {Promise<boolean>} True if directory was selected
 */
export async function requestBackupDirectory() {
    if (!('showDirectoryPicker' in window)) {
        throw new Error('File System Access API not supported in this browser');
    }
    
    try {
        const handle = await window.showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'downloads'
        });
        
        setFileSystemHandle(handle);
        return true;
    } catch (e) {
        if (e.name === 'AbortError') {
            return false; // User cancelled
        }
        throw e;
    }
}

/**
 * Backup to GitHub Gist
 * @param {Object} data - Data to backup
 * @param {string} filename - Filename for backup
 * @returns {Promise<Object>} Result object
 */
async function backupToGitHubGist(data, filename) {
    // This would require GitHub OAuth token
    // For now, throw an error indicating it needs setup
    throw new Error('GitHub Gist backup requires authentication. This feature is not yet implemented.');
}

/**
 * Backup to Google Drive
 * @param {Object} data - Data to backup
 * @param {string} filename - Filename for backup
 * @returns {Promise<Object>} Result object
 */
async function backupToGoogleDrive(data, filename) {
    // This would require Google Drive API OAuth
    // For now, throw an error indicating it needs setup
    throw new Error('Google Drive backup requires authentication. This feature is not yet implemented.');
}

/**
 * Backup to Dropbox
 * @param {Object} data - Data to backup
 * @param {string} filename - Filename for backup
 * @returns {Promise<Object>} Result object
 */
async function backupToDropbox(data, filename) {
    // This would require Dropbox API OAuth
    // For now, throw an error indicating it needs setup
    throw new Error('Dropbox backup requires authentication. This feature is not yet implemented.');
}

/**
 * Show backup notification
 * @param {string} message - Notification message
 */
function showBackupNotification(message) {
    // Use browser notification API if available and permitted
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Resource Allocation Backup', {
            body: message,
            icon: '/favicon.ico'
        });
    }
}

/**
 * Request notification permission
 * @returns {Promise<boolean>} True if permission granted
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        return false;
    }
    
    if (Notification.permission === 'granted') {
        return true;
    }
    
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    
    return false;
}

/**
 * Start the backup scheduler
 */
export function startScheduler() {
    const config = getBackupConfig();
    
    if (!config.enabled) {
        return;
    }
    
    // Stop existing scheduler if running
    stopScheduler();
    
    // Start new scheduler
    const intervalMs = config.intervalMinutes * 60 * 1000;
    schedulerInterval = setInterval(async () => {
        console.log('Performing scheduled backup...');
        await performBackup();
    }, intervalMs);
    
    console.log(`Backup scheduler started (interval: ${config.intervalMinutes} minutes)`);
}

/**
 * Stop the backup scheduler
 */
export function stopScheduler() {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        console.log('Backup scheduler stopped');
    }
}

/**
 * Initialize the scheduler on page load
 */
export function initScheduler() {
    const config = getBackupConfig();
    if (config.enabled) {
        startScheduler();
    }
}

/**
 * Download the prepared auto-backup (for user-initiated action)
 */
export function downloadPreparedBackup() {
    if (window.__autoBackupUrl && window.__autoBackupFilename) {
        const a = document.createElement('a');
        a.href = window.__autoBackupUrl;
        a.download = window.__autoBackupFilename;
        a.click();
        
        // Clean up
        URL.revokeObjectURL(window.__autoBackupUrl);
        delete window.__autoBackupUrl;
        delete window.__autoBackupFilename;
        
        return true;
    }
    return false;
}
