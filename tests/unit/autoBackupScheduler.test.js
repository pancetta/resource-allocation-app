import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    getBackupConfig,
    saveBackupConfig,
    getBackupHistory,
    performBackup,
    setFileSystemHandle,
    requestNotificationPermission
} from '../../js/helpers/autoBackupScheduler.js';
import * as database from '../../js/data/database.js';

// Mock database module
vi.mock('../../js/data/database.js', () => ({
    exportAllData: vi.fn()
}));

describe('autoBackupScheduler', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('getBackupConfig', () => {
        it('should return default config when none exists', () => {
            const config = getBackupConfig();
            
            expect(config).toEqual({
                enabled: false,
                intervalMinutes: 30,
                storageType: 'download',
                keepVersions: 20,
                notifyOnBackup: false,
                lastBackupTime: null
            });
        });

        it('should return stored config when it exists', () => {
            const storedConfig = {
                enabled: true,
                intervalMinutes: 60,
                storageType: 'filesystem',
                keepVersions: 10,
                notifyOnBackup: true,
                lastBackupTime: Date.now()
            };
            
            localStorage.setItem('resource-planning-backup-config', JSON.stringify(storedConfig));
            
            const config = getBackupConfig();
            expect(config.enabled).toBe(true);
            expect(config.intervalMinutes).toBe(60);
            expect(config.storageType).toBe('filesystem');
        });

        it('should handle corrupted config data gracefully', () => {
            localStorage.setItem('resource-planning-backup-config', 'invalid-json');
            
            const config = getBackupConfig();
            expect(config.enabled).toBe(false); // Should return default
        });
    });

    describe('saveBackupConfig', () => {
        it('should save config to localStorage', () => {
            const config = {
                enabled: true,
                intervalMinutes: 15,
                storageType: 'download',
                keepVersions: 5,
                notifyOnBackup: false,
                lastBackupTime: null
            };
            
            saveBackupConfig(config);
            
            const stored = JSON.parse(localStorage.getItem('resource-planning-backup-config'));
            expect(stored.enabled).toBe(true);
            expect(stored.intervalMinutes).toBe(15);
        });

        it('should handle error when localStorage fails', () => {
            // Temporarily replace localStorage.setItem with a function that throws
            const originalSetItem = localStorage.setItem;
            let callCount = 0;
            
            localStorage.setItem = function(key, value) {
                callCount++;
                if (key === 'resource-planning-backup-config') {
                    throw new Error('Storage full');
                }
                return originalSetItem.call(this, key, value);
            };
            
            const config = { enabled: true, intervalMinutes: 30 };
            
            try {
                expect(() => saveBackupConfig(config)).toThrow();
            } finally {
                // Restore original
                localStorage.setItem = originalSetItem;
            }
        });
    });

    describe('getBackupHistory', () => {
        it('should return empty array when no history exists', () => {
            const history = getBackupHistory();
            expect(history).toEqual([]);
        });

        it('should return stored history', () => {
            const storedHistory = [
                { timestamp: Date.now(), success: true, message: 'Backup successful' },
                { timestamp: Date.now() - 1000, success: false, message: 'Backup failed' }
            ];
            
            localStorage.setItem('resource-planning-backup-history', JSON.stringify(storedHistory));
            
            const history = getBackupHistory();
            expect(history).toHaveLength(2);
            expect(history[0].success).toBe(true);
        });

        it('should handle corrupted history data gracefully', () => {
            localStorage.setItem('resource-planning-backup-history', 'invalid-json');
            
            const history = getBackupHistory();
            expect(history).toEqual([]);
        });
    });

    describe('performBackup', () => {
        it('should create backup with download storage type', async () => {
            database.exportAllData.mockResolvedValue({
                version: '3.0',
                exportDate: new Date().toISOString(),
                data: { people: [], projects: [], allocations: [] }
            });
            
            const config = {
                enabled: true,
                storageType: 'download',
                intervalMinutes: 30,
                keepVersions: 20,
                notifyOnBackup: false,
                lastBackupTime: null
            };
            saveBackupConfig(config);
            
            const result = await performBackup();
            
            expect(result.success).toBe(true);
            expect(result.requiresUserAction).toBe(true);
            expect(database.exportAllData).toHaveBeenCalled();
        });

        it('should update last backup time after successful backup', async () => {
            database.exportAllData.mockResolvedValue({
                version: '3.0',
                data: { people: [], projects: [], allocations: [] }
            });
            
            const beforeTime = Date.now();
            await performBackup();
            const afterTime = Date.now();
            
            const config = getBackupConfig();
            expect(config.lastBackupTime).toBeGreaterThanOrEqual(beforeTime);
            expect(config.lastBackupTime).toBeLessThanOrEqual(afterTime);
        });

        it('should add successful backup to history', async () => {
            database.exportAllData.mockResolvedValue({
                version: '3.0',
                data: { people: [], projects: [], allocations: [] }
            });
            
            await performBackup();
            
            const history = getBackupHistory();
            expect(history).toHaveLength(1);
            expect(history[0].success).toBe(true);
        });

        it('should add failed backup to history', async () => {
            database.exportAllData.mockRejectedValue(new Error('Export failed'));
            
            const result = await performBackup();
            
            expect(result.success).toBe(false);
            
            const history = getBackupHistory();
            expect(history).toHaveLength(1);
            expect(history[0].success).toBe(false);
        });

        it('should handle filesystem storage type error gracefully', async () => {
            database.exportAllData.mockResolvedValue({
                version: '3.0',
                data: { people: [], projects: [], allocations: [] }
            });
            
            const config = {
                enabled: true,
                storageType: 'filesystem',
                intervalMinutes: 30,
                keepVersions: 20,
                notifyOnBackup: false
            };
            saveBackupConfig(config);
            
            const result = await performBackup();
            
            // Should fail because File System Access API is not available in test environment
            expect(result.success).toBe(false);
            expect(result.message).toContain('File System Access API not supported');
        });
    });

    describe('setFileSystemHandle', () => {
        it('should set the file system handle', () => {
            const mockHandle = { name: 'backups' };
            
            // This should not throw
            expect(() => setFileSystemHandle(mockHandle)).not.toThrow();
        });
    });

    describe('requestNotificationPermission', () => {
        it('should return false if Notification API not available', async () => {
            // Save original Notification
            const originalNotification = global.Notification;
            delete global.Notification;
            
            const result = await requestNotificationPermission();
            expect(result).toBe(false);
            
            // Restore
            global.Notification = originalNotification;
        });

        it('should return true if permission already granted', async () => {
            global.Notification = {
                permission: 'granted'
            };
            
            const result = await requestNotificationPermission();
            expect(result).toBe(true);
        });

        it('should return false if permission is denied', async () => {
            global.Notification = {
                permission: 'denied'
            };
            
            const result = await requestNotificationPermission();
            expect(result).toBe(false);
        });
    });
});
