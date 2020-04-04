const path = require('path');
const moment = require('moment');
const Store = require('electron-store');
const yaml = require('js-yaml');

const store = new Store({
	fileExtension: 'yaml',
	serialize: yaml.safeDump,
	deserialize: yaml.safeLoad
});
const fs = require('fs');
const { Worker } = require('worker_threads');
const DriveService = require('../providers/drive-service');
const DatabaseService = require('../database/mssql-service');
const getLogget = require('../../common/logger');

const logger = getLogget('backup-service');
const fsPromises = fs.promises;

class BackupService {
    constructor() {
        this.interval = null;
        this.driveService = new DriveService();
        this.dbService = new DatabaseService();
    }

    start() {
        if (!this.interval) {
            this.interval = setInterval(async () => {
                const backup = store.get('backup');
                const time = moment().format('HH:mm');
                if (time === backup.time) {
                    await this.backup();
                }
            }, 60000);
        }
    }

    async backup(progressEmitter) {
        const backupFile = `backup_${moment().format('DD-MM-YY-HH-mm')}.bak`;
        const backupPath = path.join(store.get('backup.location'), backupFile);
        try {
            const testBackupPath = path.join(__dirname, '../../', backupPath);
            await this.dbService.backup(backupPath);
            // TODO: resolves container issue
            const uploadProgress = await this.driveService.upload(testBackupPath, progressEmitter);
            if (store.has('backup.copyLocation')) {
                const copyPath = path.join(store.get('backup.copyLocation'), backupFile);
                // TODO: resolves container issue
                await fsPromises.copyFile(testBackupPath, copyPath);
            }
            return uploadProgress;
        } catch (err) {
            logger.error('Error backing up database to the cloud', err);
        }
    }

    destroy() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}

module.exports = BackupService;
