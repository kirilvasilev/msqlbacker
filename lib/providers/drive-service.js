/* eslint-disable class-methods-use-this */
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const settingsService = require('../services/settings-service');
const _events = require('../../constants/_event_constants');
const moment = require('moment');
const http = require('axios/lib/adapters/http');
const getLogger = require('../../common/logger');

const logger = getLogger('drive-service');

// eslint-disable-next-line global-require
google.options({ adapter: http });
class DriveService {
    async getDriveClient() {
        // If modifying these scopes, delete token.json.
        const SCOPES = ['https://www.googleapis.com/auth/drive'];
        const { drive } = settingsService.getSettings();
        try {
            const jwtClient = new google.auth.JWT(
                drive.serviceUser,
                null,
                drive.privateKey,
                SCOPES,
            );

            // Authenticate request
            await jwtClient.authorize();
            return google.drive({ version: 'v3', auth: jwtClient });
        } catch (err) {
            logger.error('Error creating  Drive Client', err);
            throw err;
        }
    }

    async givePermissionsToFile(fileId, emailAddress, role = 'writable') {
        const drive = await this.getDriveClient();
        try {
            const userPerm = {
                type: 'user',
                role,
                emailAddress,
            };
            const permissions = await drive.permissions.create({
                resource: userPerm,
                fileId,
                fields: 'id',
            });
            logger.info(permissions);
        } catch (err) {
            logger.error(err);
        }
    }

    async getStorageQuota() {
        const drive = await this.getDriveClient();
        try {
            const res = await drive.about.get({
                fields: 'user, storageQuota',
            });
            const { storageQuota } = JSON.parse(res.data);
            return {
                limit: (Number(storageQuota.limit) / 1024 / 1024 / 1024).toFixed(2),
                usage: (Number(storageQuota.usage) / 1024 / 1024 / 1024).toFixed(2),
            };
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }

    /**
     * Lists the names and IDs of up to 10 files.
     */
    async listFiles() {
        const drive = await this.getDriveClient();
        try {
            const res = await drive.files.list({
                pageSize: 10,
                fields: 'nextPageToken, files(id, name, createdTime)',
            });
            const { files } = JSON.parse(res.data);
            // eslint-disable-next-line no-param-reassign, no-return-assign
            files.forEach((file) => file.createdTime = moment(file.createdTime).format('DD.MM.YY HH.mm'));
            if (files.length) {
                logger.info('Files:');
                files.map((file) => logger.info(`${file.name} (${file.id}) (${file.createdTime})`));
            } else {
                logger.info('No files found.');
            }
            return files;
        } catch (err) {
            logger.error(`Error listing files: ${err}`);
        }
        return [];
    }

    async upload(filePath, webContents) {
        const drive = await this.getDriveClient();
        const fileSize = fs.statSync(filePath).size;
        const fileMetadata = {
            name: path.basename(filePath),
        };
        const media = {
            mimeType: mime.lookup(filePath),
            body: fs.createReadStream(filePath),
        };
        try {
            const res = await drive.files.create(
                {
                    resource: fileMetadata,
                    media,
                    fields: 'id',
                },
                {
                // Use the `onUploadProgress` event from Axios to track the
                // number of bytes uploaded to this point.
                    onUploadProgress: (evt) => {
                        const progress = (evt.bytesRead / fileSize) * 100;
                        if(webContents) {
                            webContents.send(_events.HANDLE_BACKUP_PROGRESS, progress);
                        }
                    },
                },
            );
            logger.info(res.data);
        } catch (err) {
            logger.error(`Error uploading ${filePath}`, err);
        }
    }

    async downloadFile(fileId, fileName) {
        const drive = await this.getDriveClient();
        const res = await drive.files.get({ fileId: fileId, alt: 'media' }, { responseType: 'stream' });
        return new Promise((resolve, reject) => {
            const { backup } = settingsService.getSettings();
            const filePath = path.join(backup.location, `downlaod_${fileName}`);
            logger.info(`writing to ${filePath}`);
            const dest = fs.createWriteStream(filePath);
            let progress = 0;

            res.data
                .on('end', () => {
                    logger.info('Done downloading file.');
                    resolve(filePath);
                })
                .on('error', (err) => {
                    logger.error('Error downloading file.');
                    reject(err);
                })
                .on('data', (d) => {
                    progress += d.length;
                    if (process.stdout.isTTY) {
                        process.stdout.clearLine();
                        process.stdout.cursorTo(0);
                        process.stdout.write(`Downloaded ${progress} bytes`);
                    }
                })
                .pipe(dest);
        });
    }

    async delete(fileId) {
        const drive = await this.getDriveClient();
        try {
            await drive.files.delete({ fileId });
            logger.info(`Deleted file with ID: ${fileId}`);
        } catch (err) {
            logger.error(`Error deleting file with ID: ${fileId}`, err);
        }
    }
}

module.exports = DriveService;
