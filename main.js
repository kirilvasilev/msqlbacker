// Modules to control application life and create native browser window
const path = require('path');
const { app, Menu, Tray} = require('electron');
const { menubar } = require('menubar');

const mb = menubar({
    browserWindow: {
        transparent: true,
        resizable: true,
        width: 360,
        height: 330,
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
    // mb.window.webContents.openDevTools({ mode: 'detach' });
});

// Quit when all windows are closed.
mb.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit();
});
