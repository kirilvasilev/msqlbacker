/* eslint-disable class-methods-use-this */
const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');
const os = require('os');
const path = require('path');
const uuid = require('uuid');
const mime = require('mime-types');

const getLogger = require('../common/logger');

const logger = getLogger('drive-service');
const privateKey = require('../credentials/drive-credentials');

class DriveService {
    async getDriveClient() {
        // If modifying these scopes, delete token.json.
        const SCOPES = ['https://www.googleapis.com/auth/drive'];
        try {
            const jwtClient = new google.auth.JWT(
                privateKey.client_email,
                null,
                privateKey.private_key,
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
            const about = await drive.about.get({
                fields: 'user, storageQuota',
            });
            const quota = about.data.storageQuota;
            return {
                limit: Number(quota.limit) / 1024 / 1024 / 1024,
                usage: Number(quota.usage) / 1024 / 1024 / 1024,
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
                fields: 'nextPageToken, files(id, name)',
            });

            const { files } = res.data;
            logger.info(res);
            if (files.length) {
                logger.info('Files:');
                files.map((file) => logger.info(`${file.name} (${file.id})`));
            } else {
                logger.info('No files found.');
            }
            return files;
        } catch (err) {
            logger.error(`Error listing files: ${err}`);
        }
        return [];
    }

    async upload(fileName) {
        const drive = await this.getDriveClient();
        const fileSize = fs.statSync(fileName).size;
        const fileMetadata = {
            name: fileName,
        };
        const media = {
            mimeType: mime.lookup(fileName),
            body: fs.createReadStream(fileName),
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
                        readline.clearLine();
                        readline.cursorTo(0);
                        process.stdout.write(`${Math.round(progress)}% complete`);
                    },
                },
            );
            logger.info(res.data);
        } catch (err) {
            logger.error(`Error uploading ${fileName}`, err);
        }
    }

    async downloadFile(fileId, fileName) {
        const drive = await this.getDriveClient();
        const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
        return new Promise((resolve, reject) => {
            const filePath = path.join(os.tmpdir(), uuid.v4());
            logger.info(`writing to ${filePath}`);
            const dest = fs.createWriteStream(`./${fileName}`);
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
}

module.exports = DriveService;
