const fs = require('fs');
const path = require('path');
const os = require('os');

const DB_NAME = 'onurltd.db';

// Electron default userData paths for this app
const possibleFolders = [
    'onurltd',
    'OnurLtd Market',
    'onurapp'
];

let found = false;

possibleFolders.forEach(folder => {
    const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', folder, DB_NAME);
    if (fs.existsSync(dbPath)) {
        try {
            fs.unlinkSync(dbPath);
            console.log(`Successfully deleted: ${dbPath}`);
            found = true;
        } catch (err) {
            console.error(`Error deleting ${dbPath}: ${err.message}`);
        }
    }
});

if (!found) {
    console.log('Database file not found in any standard Electron locations.');
    console.log('You can find it manually at: %APPDATA%\\<app-name>\\onurltd.db');
} else {
    console.log('\nDatabase has been reset. It will be recreated with fresh seeds when you start the app next time.');
}
