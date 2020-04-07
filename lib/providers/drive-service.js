/* eslint-disable class-methods-use-this */
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const moment = require('moment');

const settingsService = require('../services/settings-service');
const _events = require('../../constants/_event_constants');
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
            logger.error('[getDriveClient] Error creating  Drive Client', err);
            throw err;
        }
    }

    async givePermissionsToFile(fileId, emailAddress, role = 'writable') {
        const drive = await this.getDriveClient();
        try {
            const userPerm = {
                type: 'user',
                role: role,
                emailAddress,
            };
            const permissions = await drive.permissions.create({
                resource: userPerm,
                fileId: fileId,
                fields: 'id',
            });
            logger.info(`[givePermissionsToFile] Permission: ${permissions}`);
        } catch (err) {
            logger.error(`[givePermissionsToFile] Error giving permission to ${emailAddress} for file ${fileId}:\n ${err.message}`);
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
            logger.error(`[getStorageQuota] Error getting quota:\n${err.message}`);
        }
    }

    /**
     * Lists the names and IDs of up to 10 files.
     */
    async listFiles(files = [], nextPageToken = null) {
        const drive = await this.getDriveClient();
        try {
            const options = {
                pageSize: 10,
                fields: 'nextPageToken, files(id, name, createdTime)',
            };

            if(nextPageToken) {
                options.pageToken = nextPageToken;
            }

            const res = await drive.files.list(options);            
            const data = JSON.parse(res.data);
            
            files.push(...data.files.map((file) => {
                file.createdTime = moment(file.createdTime).format('DD.MM.YY HH.mm');
                return file;
            }));

            if (data.nextPageToken) {
                await this.listFiles(files, data.nextPageToken);
            }

            if (files.length) {
                logger.info(`[listFiles] Found ${files.length} file${files.length > 0 ? 's': ''}.`);
            } else {
                logger.info('[listFiles] No files found.');
            }
            return files;
        } catch (err) {
            logger.error(`[listFiles] Error listing files:\n${err.message}`);
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
            logger.info(`[upload] File ID: ${JSON.parse(res.data).id}`);
            // await this.givePermissionsToFile(JSON.parse(res.data).id, backup.owner);
        } catch (err) {
            logger.error(`[upload] Error uploading ${filePath}:\n${err.message}`);
        }
    }

    async downloadFile(fileId, fileName) {
        const drive = await this.getDriveClient();
        const res = await drive.files.get({ fileId: fileId, alt: 'media' }, { responseType: 'stream' });
        return new Promise((resolve, reject) => {
            const { backup } = settingsService.getSettings();
            const filePath = path.join(backup.location, `downlaod_${fileName}`);
            logger.info(`[downloadFile] Writing to ${filePath}.`);
            const dest = fs.createWriteStream(filePath);

            res.data
                .on('end', () => {
                    logger.info('[downloadFile] Done downloading file.');
                    resolve(filePath);
                })
                .on('error', (err) => {
                    logger.error(`[downloadFile] Error downloading file:\n${err.message}`);
                    reject(err);
                })
                .pipe(dest);
        });
    }

    async delete(fileId) {
        const drive = await this.getDriveClient();
        try {
            await drive.files.delete({ fileId });
            logger.info(`[delete] Deleted file with ID: ${fileId}.`);
        } catch (err) {
            logger.error(`[delete] Error deleting file with ID: ${fileId}:\n${err.message}`);
        }
    }
}

module.exports = DriveService;
