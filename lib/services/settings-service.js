
const Store = require('electron-store');

class SettingsService extends Store{
    constructor() {
        super();
    }

    saveSettings(settings) {
        for(const key of Object.keys(settings)) {
            for(const subKey of Object.keys(settings[key])){
                this.set(`${key}.${subKey}`, settings[key][subKey]);
            }
        }
    }

    getSettings() {
        return {
            connection: {
                server: this.get('connection.server'),
                user: this.get('connection.user'),
                password: this.get('connection.password'),
                database: this.get('connection.database'),
            },
            drive: {
                serviceUser: this.get('drive.serviceUser'),
                privateKey: this.get('drive.privateKey'),
            },
            backup: {
                time: this.get('backup.time'),
                location: this.get('backup.location'),
                owner: this.get('backup.owner'),
            }
        }
    }

}

const SettingsServiceInstance = new SettingsService();
module.exports = SettingsServiceInstance;
