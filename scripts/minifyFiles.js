const uglifyjs = require("uglify-js");
const fs = require('fs');

const outputDirectory = './out'

if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory);
}

try {
    const code = fs.readFileSync('./scripts/index.js', { encoding: 'utf-8' });
    const minified = uglifyjs.minify(code);
    fs.writeFileSync(outputDirectory + '/' + 'minified.js', 'javascript:' + minified.code, { encoding: 'utf-8' });
} catch (error) {
    console.error(error);
}

