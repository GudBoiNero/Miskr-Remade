const fs = require('node:fs');
const path = require('node:path');

module.exports = () => {
    const dlPath = path.join(__dirname, '../../res/dl');
    const dlFiles = fs.readdirSync(dlPath).filter(file => file.endsWith('.ogg') || file.endsWith('.webm') || file.endsWith('.wav'));

    for (const file of dlFiles) {
        const filePath = path.join(dlPath, file);

        fs.unlinkSync(filePath);
        fs.rmSync(filePath, {force: true})
    }
}