const obf = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');
const pkg = require('pkg');

function walk(dir) {
    const files = fs.readdirSync(dir);
    let results = [];

    files.forEach(file => {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);

        if (stat.isDirectory()) {
            results = results.concat(walk(filepath));
        } else {
            results.push(filepath);
        }
    });

    return results;
}

// Obfuscate
const files = walk('./dist');
files.forEach(file => {
    if (!file.endsWith('.js')) return;

    const code = fs.readFileSync(file, 'utf8');
    const obfCode = obf.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        deadCodeInjection: true,
    }).getObfuscatedCode();

    const outFile = file.replace('dist', 'dist-obf');
    const dir = path.dirname(outFile);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outFile, obfCode);
});

(async () => {
    await pkg.exec([
        'dist-obf/main.js',
        '--targets',
        'node18-win-x64',
        '--output',
        'myapp.exe'
    ]);
})();
