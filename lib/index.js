const DatabaseService = require('./database/mssql-service');
const DriveService = require('./providers/drive-service');
const BackupService = require('./services/backup-service');
const settingsService = require('./services/settings-service');

module.exports = {
    DatabaseService,
    DriveService,
    BackupService,
    settingsService
}