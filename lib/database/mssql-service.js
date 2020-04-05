/* eslint-disable class-methods-use-this */
const sql = require('mssql');
const settingsService = require('../services/settings-service');

const getLogger = require('../../common/logger');

const logger = getLogger('database-service');

class DatabaseService {
    constructor() {
        this.pool = null;
    }

    async getPool() {
        const defaultPool = {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
        const { connection } = settingsService.getSettings();
        if (!this.pool) {
            this.pool = await new sql.ConnectionPool({...connection, pool: defaultPool}).connect();
        }
        return this.pool;
    }

    async backup(backupPath) {
        const { connection } = settingsService.getSettings();
        try {
            const pool = await this.getPool();
            const result = await pool.request().query(`BACKUP DATABASE [${connection.database}] TO DISK = '${backupPath}' WITH NOFORMAT, NOINIT, NAME = 'backup-full', SKIP, NOREWIND, NOUNLOAD, STATS = 10`);
            logger.info(result);
        } catch (err) {
            logger.error('Error backing up database', err);
        }
    }
}

module.exports = DatabaseService;
