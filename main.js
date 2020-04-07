// Modules to control application life and create native browser window
const path = require('path');
const { app, Menu, ipcMain} = require('electron');
const { menubar } = require('menubar');

const _events = require('./constants/_event_constants');
const settingsService = require('./lib/services/settings-service');
const BackupService = require('./lib/services/backup-service');
const DriveService = require('./lib/providers/drive-service');

const backupService = new BackupService();
const driveService = new DriveService();
const mb = menubar({
    browserWindow: {
        transparent: true,
        // resizable: true,
        width: 360,
        height: 385,
        webPreferences: {
            nodeIntegration: true,
            // nodeIntegrationInWorker: true,
        },
    },
    icon: path.join(__dirname, 'assets/icons/icon_20x20.png'),
});

mb.on('ready', () => {
    const menu = Menu.buildFromTemplate([
        {
            label: 'Quit',
            click() { app.quit(); }
        }
    ]);

    mb.tray.setToolTip('Backup database to Google Drive');
    mb.tray.setContextMenu(menu);
});
mb.on('after-create-window', () => {
    backupService.start(mb.window.webContents);
    mb.window.webContents.openDevTools({ mode: 'detach' });
});

// Quit when all windows are closed.
mb.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on(_events.FETCH_SETTINGS, (event) => {
    event.sender.send(_events.HANDLE_FETCH_SETTINGS, settingsService.getSettings());
});

ipcMain.on(_events.SAVE_SETTINGS, (event, settings) => {
    settingsService.saveSettings(settings);
});

ipcMain.on(_events.BACKUP_TO_DRIVE, (event) => {
    backupService.backup(mb.window.webContents).then(() => {
        event.sender.send(_events.HANDLE_BACKUP_TO_DRIVE);
    });
});

ipcMain.on(_events.DELETE_FILE, (event, file) => {
    driveService.delete(file).then();
});

ipcMain.on(_events.FETCH_FILES_ON_DRIVE, (event) => {
    driveService.listFiles().then(files => {
        event.sender.send(_events.HANDLE_FETCH_FILES_ON_DRIVE, files);
    });
});

ipcMain.on(_events.FETCH_STORAGE_QUOTA, (event) => {
    driveService.getStorageQuota().then(quota => {
        event.sender.send(_events.HANDLE_FETCH_STORAGE_QUOTA, quota);
    });
});

ipcMain.on(_events.DOWNLOAD_FILE_FROM_DRIVE, (event, file) => {
    driveService.downloadFile(file.id, file.name).then();
});