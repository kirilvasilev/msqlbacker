const path = require('path');
const moment = require('moment');
const config = require('config');
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
                const backup = config.get('backup');
                const time = moment().format('HH:mm');
                if (time === backup.time) {
                    await this.backup();
                }
            }, 60000);
        }
    }

    async backup() {
        const backupFile = `backup_${moment().format('DD-MM-YY-HH-mm')}.bak`;
        const backupPath = path.join(config.get('backup.location'), backupFile);
        try {
            await this.dbService.backup(backupPath);
            await this.driveService.upload(backupPath);
            if (config.has('backup.copyLocation')) {
                const copyPath = path.join(config.get('backup.copyLocation'), backupFile);
                await fsPromises.copyFile(backupPath, copyPath);
            }
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
