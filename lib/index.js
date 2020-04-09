const DatabaseService = require('./database/mssql-service');
const DriveService = require('./providers/drive-service');
const BackupService = require('./services/backup-service');

module.exports = {
    DatabaseService,
    DriveService,
    BackupService
}