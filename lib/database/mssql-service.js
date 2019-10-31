/* eslint-disable class-methods-use-this */
const sql = require('mssql');
const config = require('config');
const path = require('path');
const getLogger = require('../../common/logger');

const logger = getLogger('database-service');

class DatabaseService {
    constructor() {
        this.pool = null;
    }

    async getPool() {
        if (!this.pool) {
            this.pool = await new sql.ConnectionPool(config.get('connection')).connect();
        }
        return this.pool;
    }

    async backup(backupPath) {
        const { database } = config.get('connection');
        try {
            const pool = await this.getPool();
            const result = await pool.request().query(`BACKUP DATABASE [${database}] TO DISK = '${backupPath}' WITH NOFORMAT, NOINIT, NAME = 'backup-full', SKIP, NOREWIND, NOUNLOAD, STATS = 10`);
            logger.info(result);
        } catch (err) {
            logger.error('Error backing up database', err);
        }
    }
}

module.exports = DatabaseService;
