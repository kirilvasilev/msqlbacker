// Modules to control application life and create native browser window
const path = require('path');
const { app } = require('electron');
const { menubar } = require('menubar');
const fs = require('fs');
console.log(__filename);
// Prints: /Users/mjr/example.js
console.log(__dirname);
const mb = menubar({
    browserWindow: {
        transparent: true,
        // resizable: false,
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

mb.on('ready', async () => {
    // createWindow();
});
mb.on('after-create-window', async () => {
    mb.window.webContents.openDevTools({ mode: 'detach' });
});

// Quit when all windows are closed.
mb.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit();
});
