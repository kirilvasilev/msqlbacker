const path = require('path');
const moment = require('moment');
const settingsService = require('../services/settings-service');
const _events = require('../../constants/_event_constants');
const DriveService = require('../providers/drive-service');
const DatabaseService = require('../database/mssql-service');
const getLogget = require('../../common/logger');

const logger = getLogget('backup-service');

class BackupService {
    constructor() {
        this.interval = null;
        this.driveService = new DriveService();
        this.dbService = new DatabaseService();
    }

    start(webContents) {
        if (!this.interval) {
            this.interval = setInterval(async () => {
                const { backup } = settingsService.getSettings();
                const time = moment().format('HH:mm');
                if (time === backup.time) {
                    await this.backup(null);
                    webContents.send(_events.REFRESH_DATA);
                }
            }, 60000);
        }
    }

    async backup(webContents) {
        const { backup } = settingsService.getSettings();
        const backupFile = `backup_${moment().format('DD-MM-YY-HH-mm')}.bak`;
        const backupPath = path.join(backup.location, backupFile);
        try {
            await this.dbService.backup(backupPath);
            await this.driveService.upload(backupPath, webContents);
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
