// Native transport for Showdown+ 1.4. Firefox's blocking extension webRequest
// API is replaced by Electron's session hook, restricted to Showdown assets.
const fs = require('node:fs');
const path = require('node:path');

function createRedirector(source, getExtension) {
  const {phdParseList, phdRedirectUrl} = require(path.join(source, 'config-node.cjs'));
  const list = phdParseList(fs.readFileSync(path.join(source, 'sprites.txt'), 'utf8'));
  const hosts = new Set(['pokemonshowdown.com', 'psim.us']);
  const overlays = {mistyterrain:'misty-terrain', electricterrain:'electric-terrain',
    grassyterrain:'grassy-terrain', psychicterrain:'psycic-terrain',
    trickroom:'trickroom', magicroom:'magicroom', wonderroom:'wonderroom'};
  return details => {
    const extension = getExtension();
    if (!extension) return {};
    let url;
    try { url = new URL(details.url); } catch { return {}; }
    if (!['http:', 'https:'].includes(url.protocol) || ![...hosts].some(host => url.hostname === host || url.hostname.endsWith('.' + host))) return {};
    const local = file => `chrome-extension://${extension.id}/${file}`;
    if (/^\/sprites\/gen6bgs\/[^/]+$/.test(url.pathname)) return {redirectURL:local('bg/battle-stadium.png')};
    const fx = /^\/fx\/weather-([a-z]+)\.png$/.exec(url.pathname);
    if (fx && overlays[fx[1]]) return {redirectURL:local(`bg_overlay/${overlays[fx[1]]}.png`)};
    const sprite = /^\/sprites\/(ani(?:-back)?(?:-shiny)?)\/([a-z0-9-]+)\.gif$/.exec(url.pathname);
    const redirected = sprite && phdRedirectUrl(list, sprite[1], sprite[2]);
    return redirected ? {redirectURL:redirected} : {};
  };
}

function installShowdownPlus({session, source, getExtension}) {
  const redirect = createRedirector(source, getExtension);
  const urls = ['pokemonshowdown.com', '*.pokemonshowdown.com', 'psim.us', '*.psim.us']
    .flatMap(host => [`*://${host}/sprites/*`, `*://${host}/fx/weather-*`]);
  session.webRequest.onBeforeRequest({urls}, (details, callback) => {
    try { callback(redirect(details)); }
    catch (error) { console.error('Showdown+ redirect:', error.message); callback({}); }
  });
  return redirect;
}
module.exports = {createRedirector, installShowdownPlus};
