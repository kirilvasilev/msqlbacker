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
            await this.dbService.backup(backupPath);
            await this.driveService.upload(backupPath, progressEmitter);
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
