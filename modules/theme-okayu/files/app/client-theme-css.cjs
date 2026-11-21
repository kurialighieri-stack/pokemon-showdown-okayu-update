const fs = require('node:fs');
const path = require('node:path');
// Resolve the document root explicitly inside the Pro scope.
const css = fs.readFileSync(path.join(__dirname, 'client-theme.css'), 'utf8')
  .replace(/\bhtml(?=[.,\s:#\[])/g, ':scope');
const palette = require('./theme-palette.cjs');
const native = fs.readFileSync(path.join(__dirname, 'client-native-theme.css'), 'utf8');
module.exports = native + '\n@scope (html.showdown-pro) {\n' + palette.tokenize(css) + '\n}\n' + palette.css;
