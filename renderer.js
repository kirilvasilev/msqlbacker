/* eslint-disable no-unused-vars */
const { EventEmitter } = require('events');
const DriveService = require('./lib/providers/drive-service');
const BackupService = require('./lib/services/backup-service');

const driveService = new DriveService();
const backupService = new BackupService();
const deleteEmitter = new EventEmitter();

function loadBackupsList() {
    const backupsList = document.getElementById('backups-list');
    backupsList.innerHTML = '';
    driveService.listFiles().then((backups) => {
        backups.forEach((backup) => {
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
}
function loadInfo() {
    const backupsCount = document.getElementById('backups-count');
    const lastBackup = document.getElementById('last-backup');
    const freeSpace = document.getElementById('free-space');
    driveService.listFiles().then((files) => {
        backupsCount.innerText = `Available backups: ${files.length}`;
        lastBackup.innerText = `Last backup: ${files.length ? files[0].createdTime.format('DD.MM.YY HH.mm') : ''}`;
    });
    driveService.getStorageQuota().then((quota) => {
        freeSpace.innerText = `Available space: ${quota.usage}/${quota.limit}`;
    });
}

deleteEmitter.on('delete', () => {
    const files = document.querySelectorAll('.custom-control-input');
    if (files.length) {
        files.forEach((file) => {
            if (file.checked) {
                driveService.delete(file.id).then(() => {
                    setTimeout(loadBackupsList, 2000);
                });
            }
        });
    }
});

document.querySelectorAll('.nav-link').forEach((element) => {
    element.addEventListener('click', () => {
        if (element.classList.contains('active')) {
            return;
        }
        document.querySelectorAll('.nav-link').forEach((el) => {
            el.classList.remove('active');
        });
        document.querySelectorAll('.container').forEach((container) => {
            if (container.getAttribute('id') === element.innerHTML.toLowerCase()) {
                if (container.classList.contains('d-none')) {
                    container.classList.remove('d-none');
                }
            } else {
                container.classList.add('d-none');
            }
        });
        element.classList.add('active');
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

function backupToDrive() {
    const progressEmitter = new EventEmitter();
    const progressDiv = document.querySelector('div.progress.d-none');
    const backupButton = document.getElementById('backup-button');

    backupButton.setAttribute('disabled', 'true');
    progressEmitter.on('progress', (progress) => {
        const progressBar = document.getElementById('upload-progress');

        if (progressDiv.classList.contains('d-none')) {
            progressDiv.classList.remove('d-none');
        }
        progressBar.setAttribute('aria-valuenow', progress);
        progressBar.style.cssText = `width: ${progress}%`;
    });
    backupService.backup(progressEmitter).then(() => {
        loadInfo();
        progressDiv.classList.add('d-none');
        backupButton.removeAttribute('disabled');
    });
}

function downloadBackup() {
    const files = document.querySelectorAll('.custom-control-input');
    files.forEach((file) => {
        if (file.checked) {
            driveService.downloadFile(file.id, file.name);
        }
    });
}

function confirmDelete() {
    deleteEmitter.emit('delete');
}

loadInfo();
