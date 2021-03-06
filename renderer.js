const { ipcRenderer } = require('electron');
const { _events, _app_constants } = require('./constants');

function loadBackupsList() {
    ipcRenderer.send(_events.FETCH_FILES_ON_DRIVE);
}

ipcRenderer.on(_events.HANDLE_FETCH_FILES_ON_DRIVE, (event, files) => {
    const backupsList = document.getElementById('backups-list');
    backupsList.innerHTML = '';
    files.forEach((backup) => {
        const li = document.createElement('li');
        li.classList.add('list-group-item');
        const div = document.createElement('div');
        div.classList.add('custom-control');
        div.classList.add('custom-checkbox');
        const input = document.createElement('input');
        input.classList.add('custom-control-input');
        input.setAttribute('type', 'checkbox');
        input.setAttribute('id', backup.id);
        input.setAttribute('name', backup.name);
        const label = document.createElement('label');
        label.classList.add('custom-control-label');
        label.setAttribute('for', backup.id);
        label.innerHTML = backup.name;
        div.appendChild(input);
        div.appendChild(label);
        li.appendChild(div);
        backupsList.appendChild(li);
    });
});

function loadInfo() {
    ipcRenderer.send(_events.FETCH_FILES_ON_DRIVE);
    ipcRenderer.send(_events.FETCH_STORAGE_QUOTA);
}

ipcRenderer.on(_events.HANDLE_FETCH_FILES_ON_DRIVE, (event, files) => {
    const backupsCount = document.getElementById('backups-count');
    const lastBackup = document.getElementById('last-backup');
    backupsCount.innerText = `Available backups: ${files.length}`;
    lastBackup.innerText = `Last backup: ${files.length ? files[0].createdTime : ''}`;
});
ipcRenderer.on(_events.HANDLE_FETCH_STORAGE_QUOTA, (event, quota) => {
    const freeSpace = document.getElementById('free-space');
    freeSpace.innerText = `Available space: ${quota.usage}/${quota.limit}`;
    const freeCloudStorage = Number(quota.limit) - Number(quota.usage);
    if(freeCloudStorage <= _app_constants.QUOTA_WANING_TRESHOLD) {
        freeSpace.classList.remove('badge-info');
        freeSpace.classList.add('badge-warning');
    }
});

ipcRenderer.on(_events.REFRESH_DATA, () => {
    loadInfo();
    loadBackupsList();
});

function backupToDrive() {
    const backupButton = document.getElementById('backup-button');

    backupButton.setAttribute('disabled', 'true');
    
    ipcRenderer.send(_events.BACKUP_TO_DRIVE);
}

ipcRenderer.on(_events.HANDLE_BACKUP_PROGRESS, (event, progress) => {
    const progressBar = document.getElementById('upload-progress');
    const progressDiv = document.getElementById('upload-progress-div');
    if (progressDiv.classList.contains('d-none')) {
        progressDiv.classList.remove('d-none');
    }
    progressBar.setAttribute('aria-valuenow', progress);
    progressBar.style.cssText = `width: ${progress}%`;
});

ipcRenderer.on(_events.HANDLE_BACKUP_TO_DRIVE, () => {
    const progressDiv = document.getElementById('upload-progress-div');
    const backupButton = document.getElementById('backup-button');
    loadInfo();
    progressDiv.classList.add('d-none');
    backupButton.removeAttribute('disabled');
});

function downloadBackup() {
    const files = Array.from(document.querySelectorAll('.custom-control-input'));
    const checkedFiles = files.filter(file => file.checked).map(file => { return { id: file.id, name: file.name }});
    if(checkedFiles.length) {
        const progressDiv = document.getElementById('download-progress-div');
        progressDiv.classList.remove('d-none');
        ipcRenderer.send(_events.DOWNLOAD_FILE_FROM_DRIVE, checkedFiles);
    }
}

ipcRenderer.on(_events.HANDLE_DOWNLOAD_FILE_FROM_DRIVE, () => {
    const progressDiv = document.getElementById('download-progress-div');
    progressDiv.classList.add('d-none');
});

function confirmDelete() {
    const files = document.querySelectorAll('.custom-control-input');
    if (files.length) {
        files.forEach((file) => {
            if (file.checked) {
                ipcRenderer.send(_events.DELETE_FILE, file.id);
            }
        });
        setTimeout(loadBackupsList, 2000);
    }
}

function loadSettings() {
    ipcRenderer.send(_events.FETCH_SETTINGS);
}

ipcRenderer.on(_events.HANDLE_FETCH_SETTINGS, (event, settings) => {
    document.getElementById('connection-server').value = settings.connection.server;
    document.getElementById('connection-user').value = settings.connection.user;
    document.getElementById('connection-password').value = settings.connection.password;
    document.getElementById('connection-database').value = settings.connection.database;

    document.getElementById('drive-service-user').value = settings.drive.serviceUser;
    document.getElementById('drive-private-key').value = settings.drive.privateKey;

    document.getElementById('backup-time').value = settings.backup.time;
    document.getElementById('backup-location').value = settings.backup.location;
});

function saveSettings() {
    const settings = {
        connection: {
            server: document.getElementById('connection-server').value,
            user: document.getElementById('connection-user').value,
            password: document.getElementById('connection-password').value,
            database: document.getElementById('connection-database').value,
        },
        drive: {
            serviceUser: document.getElementById('drive-service-user').value,
            privateKey: document.getElementById('drive-private-key').value,
        },
        backup: {
            time: document.getElementById('backup-time').value,
            location: document.getElementById('backup-location').value,
        }
    }
    ipcRenderer.send(_events.SAVE_SETTINGS, settings);
}

//Attach navlink event listeners
document.querySelectorAll('.nav-link').forEach((element) => {
    element.addEventListener('click', () => {
        if (element.classList.contains('active')) {
            return;
        }

        document.querySelectorAll('.nav-link').forEach((el) => {
            el.classList.remove('active');
        });
        
        if(element.innerHTML.toLowerCase() === 'settings') {
            return;
        }
        element.classList.add('active');
        document.querySelectorAll('.container').forEach((container) => {
            if (container.getAttribute('id') === element.innerHTML.toLowerCase()) {
                if (container.classList.contains('d-none')) {
                    container.classList.remove('d-none');
                    container.classList.add('d-flex');
                }
            } else {
                container.classList.add('d-none');
                container.classList.remove('d-flex');
            }
        });
        
        switch (element.innerHTML.toLowerCase()) {
        case 'info': loadInfo();
            break;
        case 'backups': loadBackupsList();
            break;
        default:
            break;
        }
    });
});

//attach settings submenus event listeners
document.querySelectorAll('.dropdown-item').forEach(dropdown => {
    dropdown.addEventListener('click', () => {

        //activate settings tab
        document.querySelectorAll('.nav-link').forEach((element) => {
            if (element.innerHTML.toLowerCase() === 'settings') {
                if (!element.classList.contains('active')) {
                    element.classList.add('active');
                }
            } else {
                element.classList.remove('active');
            }
        });

        //display settings container
        document.querySelectorAll('.container').forEach((container) => {
            if (container.getAttribute('id') === 'settings') {
                container.classList.remove('d-none');
                container.classList.add('d-flex');
            } else {
                container.classList.add('d-none');
                container.classList.remove('d-flex');
            }
        });

        //display the correct settings div
        document.querySelectorAll('div.settings').forEach(div => {
            if(dropdown.innerHTML.toLowerCase() === div.getAttribute('id')){
                div.classList.remove('d-none');
            } else {
                div.classList.add('d-none');
            }
        });

        //load settings at the end
        loadSettings();
    });
});

//Innitial data load
loadInfo();
