// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const DriveService = require('./providers/drive-service');

const driverService = new DriveService();


document.querySelectorAll('.nav-link').forEach((element) => {
    element.addEventListener('click', () => {
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
        case 'info':
            break;
        case 'backups': {
            const backupsList = document.getElementById('backups-list');
            backupsList.innerHTML = '';
            driverService.listFiles().then((backups) => {
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
            break;
        default:
            break;
        }
    });
});
