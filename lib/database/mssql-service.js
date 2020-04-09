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
        try {
            if(!connection.server 
                || !connection.database 
                || !connection.user 
                || !connection.password) {
                throw new Error('Incorrect MS SQL settings.');
            }
            
            if (!this.pool) {
                this.pool = await new sql.ConnectionPool({...connection, pool: defaultPool}).connect();
            }
            return this.pool;
        } catch (err) {
            logger.error(`[getPool] Error getting connection pool:\n${err.message}`);
        }
    }

    async backup(backupPath) {
        const { connection } = settingsService.getSettings();
        try {
            const pool = await this.getPool();
            await pool.request().query(`BACKUP DATABASE [${connection.database}] TO DISK = '${backupPath}' WITH NOFORMAT, NOINIT, NAME = 'backup-full', SKIP, NOREWIND, NOUNLOAD, STATS = 10`);
            logger.info(`[backup] Backed up "${connection.database}" database successfully to ${backupPath}`);
        } catch (err) {
            logger.error(`[backup] Error backing up database:\n${err.message}`);
        }
    }
}

module.exports = DatabaseService;
