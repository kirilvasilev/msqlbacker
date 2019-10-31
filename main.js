// Modules to control application life and create native browser window
const path = require('path');
const { app, BrowserWindow, Menu, MenuItem } = require('electron');
const { menubar } = require('menubar');
const DriveService = require('./providers/drive-service');
const DatabaseService = require('./lib/database/mssql-service');
const getLogger = require('./common/logger');

const logger = getLogger('drive-service');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

async function createWindow() {
    const driverService = new DriveService();
    // await driverService.upload('./main.js');
    const abaut = await driverService.getStorageQuota();
    console.dir(abaut);
    // driverService.downloadFile('13wIbKf6fAq3-RTAYVPD2zMJ6OkKPxbV_');
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // and load the index.html of the app.
    mainWindow.loadFile('index.html');

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

const mb = menubar({
    browserWindow: {
        transparent: true,
        // resizable: false,
        width: 330,
        height: 330,
        webPreferences: {
            nodeIntegration: true,
        },
    },
    icon: path.join(__dirname, 'assets/icons/icon_32x32.png'),
});

// mb.on('ready', () => {
//   console.log('Menubar app is ready.');
// });

mb.on('ready', async () => {
    // createWindow();
});
mb.on('after-create-window', async () => {
    mb.window.webContents.openDevTools({ mode: 'detach' });
});
mb.on('right-click', () => {
    // eslint-disable-next-line no-console
    console.log('right click');
    const menu = new Menu();
    menu.append(new MenuItem({
        label: 'Resume',
        click() {
            console.log('resume clicked');
        },
    }));
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({
        label: 'Pause',
        click() {
            console.log('item 2 clicked');
        },
    }));
    menu.popup();
});
// Quit when all windows are closed.
mb.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit();
});

mb.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
