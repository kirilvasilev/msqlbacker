const path = require('path');
const moment = require('moment');

const { _events } = require('../../constants');
const { DriveService, DatabaseService } = require('..');
const settingsService = require('./settings-service');

const getLogget = require('../../common/logger');

const logger = getLogget('backup-service');

class BackupService {
    constructor() {
        this.interval = null;
        this.driveService = new DriveService();
        this.dbService = new DatabaseService();
    }

    start(webContents) {
        const { backup } = settingsService.getSettings();
        if(!backup.location || !backup.time) {
            throw new Error('Incorrect Backup settings.');
        }
        logger.info('[start] Starting automatic backup.');
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

    async backup(menubar) {
        const { backup, connection } = settingsService.getSettings();
        if(!backup.location || !backup.time) {
            throw new Error('Incorrect Backup settings.');
        }
        const backupFile = `backup_${connection.database}_${moment().format('DD-MM-YY-HH-mm')}.bak`;
        const backupPath = path.join(backup.location, backupFile);
        try {
            await this.dbService.backup(backupPath);
            await this.driveService.upload(backupPath, menubar);
        } catch (err) {
            logger.error(`[backup] Error backing up database to the cloud:\n${err.message}`);
        }
    }

    destroy() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}

module.exports = BackupService;
