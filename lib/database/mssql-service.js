/* eslint-disable class-methods-use-this */
const sql = require('mssql');
const Store = require('electron-store');
const yaml = require('js-yaml');

const store = new Store({
	fileExtension: 'yaml',
	serialize: yaml.safeDump,
	deserialize: yaml.safeLoad
});
const path = require('path');
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
        if (!this.pool) {
            this.pool = await new sql.ConnectionPool({...store.get('connection'), pool: defaultPool}).connect();
        }
        return this.pool;
    }

    async backup(backupPath) {
        const { database } = store.get('connection');
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
