// Modules to control application life and create native browser window
const path = require('path');
const { app, Menu, ipcMain} = require('electron');
const { menubar } = require('menubar');
const _events = require('./constants/_event_constants');
const settingsService = require('./lib/services/settings-service')
const mb = menubar({
    browserWindow: {
        transparent: true,
        resizable: true,
        width: 360,
        height: 385,
        webPreferences: {
            nodeIntegration: true,
            // preload: path.join(__dirname, 'preload.js'),
            nodeIntegrationInWorker: true,
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
    mb.window.webContents.openDevTools({ mode: 'detach' });
});

// Quit when all windows are closed.
mb.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on(_events.FETCH_SETTINGS, (event) => {
    event.sender.send(_events.HANDLE_FETCH_SETTINGS, settingsService.loadSettings());
});

ipcMain.on(_events.SAVE_SETTINGS, (event, settings) => {
    console.dir(settings);
    settingsService.saveSettings(settings);
});