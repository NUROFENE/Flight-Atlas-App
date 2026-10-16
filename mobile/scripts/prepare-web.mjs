import { cp, copyFile, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const mobile = resolve(here, '..');
const root = resolve(mobile, '..');
// CI checks out the up-to-date Flight-Atlas UI, including its airline tail artwork.
// Local builds can choose the same location with FLIGHT_ATLAS_SOURCE_APP.
const source = process.env.FLIGHT_ATLAS_SOURCE_APP
  ? resolve(root, process.env.FLIGHT_ATLAS_SOURCE_APP)
  : join(root, 'app');
const web = join(mobile, 'www');
await rm(web, { recursive: true, force: true });
await mkdir(web, { recursive: true });
await cp(source, web, { recursive: true });
let html = await readFile(join(source, 'app.html'), 'utf8');
if (!html.includes('<script src="auth.js">') || !html.includes('</head>')) {
  throw new Error('The desktop HTML structure has changed; inspect mobile bootstrap before building.');
}
html = html.replace('<script src="auth.js">', '<script src="mobile-bridge.js"></script><script src="auth.js">');
// The live UI uses flightatlas.layoutMode; the mobile release always starts modern.
html = html.replace('</head>', '<meta name="theme-color" content="#181819"><script>try{localStorage.setItem("flightatlas.layoutMode","modern");localStorage.setItem("flightatlas_theme","graphite")}catch(e){}</script><link rel="stylesheet" href="mobile.css"></head>');
// Electron's <webview> is unsupported by Android. RadarPlugin opens a real native WebView.
html = html.replace('<script src="vatsim-native.js"></script>', '');
const begin = html.indexOf('// Desktop updater:');
const end = html.indexOf('</script><script src="cloud.js">', begin);
if (begin >= 0 && end > begin) html = html.slice(0, begin) + html.slice(end);
html = html.replace('FLIGHT ATLAS v6.0 / DESKTOP', 'FLIGHT ATLAS / ANDROID');
await writeFile(join(web, 'index.html'), html);
await copyFile(join(mobile, 'assets', 'mobile.css'), join(web, 'mobile.css'));
await build({
  entryPoints: [join(mobile, 'assets', 'mobile-bridge.mjs')],
  outfile: join(web, 'mobile-bridge.js'),
  bundle: true, format: 'iife', platform: 'browser', target: 'es2022',
  minify: true, logLevel: 'info'
});
console.log('Flight Atlas Android web assets ready:', web);
