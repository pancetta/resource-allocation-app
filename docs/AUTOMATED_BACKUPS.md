# Automated Backup and External Storage Guide

## Overview

The Resource Allocation App now supports automated, scheduled backups to protect your data from browser crashes, cache clearing, and other data loss scenarios. This guide explains how to configure and use these features.

## The Problem with Browser-Only Storage

Previously, the app relied entirely on browser storage (IndexedDB + localStorage):
- **IndexedDB**: Stores your current data (people, projects, allocations)
- **localStorage**: Stores up to 10 automatic backup snapshots

**Both are volatile** and can be lost when:
- Browser cache is cleared
- Browser is reinstalled
- Computer crashes or fails
- Browser data is corrupted

## New Solutions

### 1. Scheduled Automated Backups

Configure the app to automatically create backups at regular intervals without any manual intervention.

**How to Enable:**
1. Go to the **Data** tab
2. Find the **Automated Backup Scheduling** section
3. Check **"Enable Scheduled Backups"**
4. Configure your preferences:
   - **Backup Interval**: How often to backup (15 min to 8 hours)
   - **Storage Type**: Where to save backups
   - **Keep Versions**: How many backup versions to retain
   - **Notifications**: Get alerts when backups complete
5. Click **"Save Settings"**

### 2. Storage Options

#### Where Is Data Stored?

Understanding where your data is stored is crucial for data safety:

**Primary Application Data (IndexedDB)**
- **Location**: Browser's internal storage (not accessible as files)
- **Access**: Via browser Developer Tools → Application → IndexedDB
- **Persistence**: Cleared when you clear browser data/cache
- **Survives**: Browser restarts, computer restarts
- **Lost when**: Clear browsing data, browser reinstall, disk failure

**Automatic Browser Backups (localStorage)**
- **Location**: Browser's internal storage (not accessible as files)
- **Access**: Via browser Developer Tools → Application → Local Storage
- **Persistence**: Cleared when you clear browser data/cache
- **Survives**: Browser restarts, computer restarts
- **Lost when**: Clear browsing data, browser reinstall, disk failure

**File System Backups (Chrome/Edge Only)**
- **Location**: User-selected directory on your file system (e.g., `C:\Users\You\Documents\Backups\`)
- **Access**: Direct file access via File Explorer/Finder
- **Persistence**: Permanent (not affected by browser)
- **Survives**: Browser crashes, reinstalls, cache clearing
- **Lost when**: Manual file deletion, disk failure

**Manual Downloads**
- **Location**: Browser's Downloads folder (e.g., `C:\Users\You\Downloads\`)
- **Access**: Direct file access
- **Persistence**: Permanent (not affected by browser)
- **Survives**: Everything except file deletion
- **Lost when**: Manual file deletion, disk failure

#### Download to Browser (Default)
- **How it works**: Prepares backup data, requires you to click to download
- **Browser Support**: ✅ All browsers (Chrome, Firefox 140+, Edge, Safari)
- **Pros**: Works in all browsers, no setup required
- **Cons**: Requires manual click to save each backup
- **Best for**: Testing, occasional backups, **Firefox users**

#### File System (Recommended for Chrome/Edge)
- **How it works**: Automatically saves to a folder you select
- **Browser Support**: ✅ Chrome 86+, Edge 86+, Opera 72+ | ❌ Firefox (all versions), Safari
- **Pros**: Fully automated, no clicks needed
- **Cons**: **Only works in Chrome/Edge browsers** (not Firefox)
- **Best for**: Regular automated backups
- **Setup**: Click "Select Backup Directory" and choose a folder
- **Firefox Users**: Use "Download to Browser" instead

#### Cloud Storage (Coming Soon)
Cloud storage integration (Google Drive, Dropbox, GitHub Gists) requires OAuth authentication and will be added in a future update.

### 3. Backup Versioning

The system automatically:
- Creates timestamped backup files
- Keeps configured number of versions (default: 20)
- Deletes old backups to save space
- Tracks backup history and success/failure

## How to Use

### First-Time Setup

1. **Enable Scheduled Backups**
   - Navigate to Data tab → Automated Backup Scheduling
   - Check "Enable Scheduled Backups"

2. **Choose Storage Type**
   - For fully automated backups: Select "File System" (Chrome/Edge only)
   - Click "Select Backup Directory" and choose where to save backups
   - For manual downloads: Keep "Download to Browser" (works in all browsers)

3. **Set Interval**
   - Recommended: 30 minutes for active work
   - Longer intervals (1-4 hours) for less frequent changes

4. **Enable Notifications** (Optional)
   - Check "Show browser notifications when backup completes"
   - Click "Enable Notifications" to grant permission
   - Get desktop alerts when backups complete

5. **Save Settings**
   - Click "Save Settings" to activate

### Testing Your Setup

1. Click **"Test Backup Now"** to verify your configuration
2. Check the **Backup History** table to confirm success
3. For file system backups, verify files appear in your selected folder

### Monitoring

**Backup Status:**
- Shows if scheduler is running
- Displays last backup time
- Shows configured interval and storage type

**Backup History:**
- Lists recent backup attempts
- Shows success/failure status
- Displays error messages for failed backups

## File System Access (Chrome/Edge)

The File System Access API allows truly automated backups with zero user interaction after initial setup.

**Requirements:**
- Chrome 86+ or Edge 86+
- User grants folder access permission once

**Benefits:**
- Completely automated - no clicks needed
- Backups saved outside browser storage
- Survives browser crashes and reinstalls
- Easy to copy/move backup files

**Limitations:**
- Chrome/Edge only (not Firefox, Safari)
- Requires initial folder selection
- Permission can be revoked by user

**Backup File Names:**
```
resource-allocation-backup-2024-02-07-14-30-45.json
resource-allocation-backup-2024-02-07-15-00-45.json
resource-allocation-backup-2024-02-07-15-30-45.json
```

## Best Practices

### Recommended Setup

1. **Primary Protection**: Enable File System backups (30-60 min interval)
2. **Secondary Protection**: Weekly manual exports to cloud storage
3. **Critical Changes**: Manual export before major updates
4. **Verification**: Periodically check backup folder has recent files

### Multi-Layer Backup Strategy

1. **Real-time**: IndexedDB + localStorage (browser storage)
2. **Automated**: Scheduled file system backups (every 30 min)
3. **Manual**: Weekly exports to Google Drive/Dropbox
4. **Critical**: Pre-change manual exports
5. **Long-term**: Monthly archives to external drive

### Retention Policy

- **Local file system**: Keep 20 recent versions (configurable)
- **Cloud storage**: Keep indefinitely or per your cloud provider limits
- **Manual exports**: Archive quarterly, keep 2 years minimum

## Troubleshooting

### "Permission to access directory was revoked"
- **Cause**: Browser revoked file system access
- **Fix**: Click "Select Backup Directory" again and choose folder

### "File System Access API not supported"
- **Cause**: Using Firefox, Safari, or older browser
- **Fix**: Switch to "Download to Browser" or use Chrome/Edge

### Backups not running automatically
- **Check**: "Enable Scheduled Backups" is checked
- **Check**: Settings were saved
- **Check**: Backup Status shows "Scheduler running"
- **Check**: Browser console for error messages

### Notification not showing
- **Check**: "Show browser notifications" is checked
- **Check**: Notification permission is granted
- **Check**: Browser/OS notification settings allow notifications

### Backup history shows failures
- **Review**: Error message in the Message column
- **Common causes**:
  - Lost file system permission (re-select directory)
  - Browser blocking automatic downloads
  - Network issues for cloud storage

## Security and Privacy

**All backups are stored as plain JSON files** containing:
- People data (names, FTE values)
- Project data (names, budgets)
- Allocation data

**Security considerations:**
- Backups are **not encrypted** by default
- File system backups are saved in **plain text**
- Protect backup folder with OS-level encryption if needed
- Be careful when sharing backup files

**No data is sent to external servers** (except when using cloud storage integrations, which require your explicit OAuth consent).

## Future Enhancements

Planned features (not yet implemented):
- **GitHub Gist integration**: Version-controlled backups
- **Google Drive integration**: Cloud backup with OAuth
- **Dropbox integration**: Cloud backup with OAuth  
- **Encryption**: Optional password-protected backups
- **Compression**: Smaller backup file sizes
- **Differential backups**: Only save changes, not full data
- **Backup restoration UI**: Restore from file system backups directly in app

## FAQ

**Q: Does this work in Firefox 140+ or other Firefox versions?**
A: **Partially.** Firefox does not support the File System Access API (as of all versions including 140+), so fully automated file system backups are **not available** in Firefox. However, Firefox users can still use:
- ✅ "Download to Browser" storage type (requires one click to save)
- ✅ Scheduled backup preparation (backups prepared on schedule)
- ✅ All existing manual export/import features
- ✅ Browser notification when backups are ready

**Recommendation for Firefox users**: Use "Download to Browser" with scheduled backups. The system will prepare backups automatically, and you'll get a notification to click and save. This is semi-automated (one click vs zero clicks in Chrome/Edge).

**Q: Which browsers support fully automated backups?**
A: Fully automated (zero-click) file system backups work in:
- ✅ Chrome 86+ (October 2020 and newer)
- ✅ Edge 86+ (October 2020 and newer)
- ✅ Opera 72+ (November 2020 and newer)
- ❌ Firefox (all versions) - use "Download to Browser" instead
- ❌ Safari (all versions) - use "Download to Browser" instead

**Q: Where exactly are backups stored on my computer?**
A: It depends on the storage type:
- **File System** (Chrome/Edge only): Any folder you select (e.g., `C:\Users\YourName\Documents\ResourceBackups\`)
- **Download to Browser**: Your browser's Downloads folder (e.g., `C:\Users\YourName\Downloads\` on Windows, `~/Downloads/` on Mac/Linux)
- **Browser storage** (IndexedDB/localStorage): Not accessible as files, only via browser Developer Tools

**Q: How much disk space will backups use?**
A: Each backup is typically 10-100 KB depending on data size. 20 versions = ~2 MB max.

**Q: Can I use this with file:// protocol?**
A: File System Access API requires HTTPS or localhost. Use `http-server` locally or host on HTTPS.

**Q: What happens if my computer crashes during backup?**
A: The in-progress backup may be incomplete, but previous backups are safe. Next scheduled backup will try again.

**Q: Can I manually trigger a backup?**
A: Yes, click "Test Backup Now" button anytime.

**Q: How do I restore from a file system backup?**
A: Use Data tab → Import Data button and select the backup JSON file.

**Q: Can I change the backup folder?**
A: Yes, click "Select Backup Directory" again to choose a different folder.

## Support

If you encounter issues:
1. Check browser console (F12) for error messages
2. Test with "Test Backup Now" to verify setup
3. Review Backup History for error details
4. Try different storage type if current isn't working
5. File an issue on GitHub with error details
