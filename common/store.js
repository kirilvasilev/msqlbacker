const Store = require('electron-store');
const yaml = require('js-yaml');
 
module.exports = new Store({
    fileExtension: 'yaml',
    serialize: yaml.safeDump,
    deserialize: yaml.safeLoad
});