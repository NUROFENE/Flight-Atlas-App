'use strict';
const {app,BrowserWindow,protocol,net,shell,dialog,Menu}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');
const fsSync=require('node:fs');
const {spawn}=require('node:child_process');
const {ipcMain}=require('electron');
const {autoUpdater}=require('electron-updater');
const DEV_MODE=process.env.FLIGHT_ATLAS_DEV==='1';
if(DEV_MODE){app.setName('Flight Atlas Dev');app.setPath('userData',path.join(app.getPath('appData'),'Flight Atlas Dev'));}

const {FlightAtlasSimConnect}=require('./simconnect-bridge');
const simBridge=new FlightAtlasSimConnect();
const ROOT=path.join(__dirname,'app');
const SCHEME='atlas';
const HOST='flightatlas';
const CATALOG='https://portalpasha.ru/charts/';
let win=null;
protocol.registerSchemesAsPrivileged([{scheme:SCHEME,privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true,corsEnabled:true}}]);

function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
function failure(message,status=502){return new Response(message,{status,headers:{'content-type':'text/plain; charset=utf-8'}})}
async function getRemote(url,accept='*/*',seconds=40){
 const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),seconds*1000);
 try{let response;try{response=await net.fetch(url,{headers:{'user-agent':'Mozilla/5.0 FlightAtlas/6.0 (Windows; Flight Simulator)','accept':accept,'referer':'https://portalpasha.ru/charts/'},signal:ctrl.signal})}catch(err){if(!/ERR_BLOCKED_BY_CLIENT|ERR_FAILED|ERR_CONNECTION/i.test(String(err)))throw err;response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 FlightAtlas/6.0 (Windows; Flight Simulator)','Accept':accept},signal:ctrl.signal})}if(!response.ok)throw Error('HTTP '+response.status);return response}
 finally{clearTimeout(timer)}
}
function dataDir(){return path.join(app.getPath('userData'),'charts')}
async function cacheRead(name){try{return await fs.readFile(path.join(dataDir(),name))}catch{return null}}
async function cacheWrite(name,bytes){await fs.mkdir(dataDir(),{recursive:true});await fs.writeFile(path.join(dataDir(),name),bytes)}
function chartCatalogFromHtml(html){
 // Only source-listed chart PDFs are accepted. No guessed file paths.
 const byIcao=new Map();const tags=/<a\b[^>]*?href\s*=\s*["']([^"']+\.pdf(?:\?[^"']*)?)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;
 while((m=tags.exec(html))){let uri;try{uri=new URL(m[1],CATALOG)}catch{continue}
 if(uri.origin!=='https://portalpasha.ru'||!uri.pathname.startsWith('/charts/filecharts/'))continue;
 const p=decodeURIComponent(uri.pathname).match(/^\/charts\/filecharts\/([^/]+)\/([A-Z0-9]{4})\.pdf$/i);if(!p)continue;
 const icao=p[2].toUpperCase();if(byIcao.has(icao))continue;
 const tail=html.slice(tags.lastIndex,tags.lastIndex+1300).split(/<a\b[^>]*href\s*=/i)[0];
 const iata=(tail.match(/IATA\s*:\s*(?:<[^>]*>\s*)*([A-Z0-9]{3})/i)||[])[1]||'';
 const name=(tail.match(/(?:Name|Имя|Город|City)\s*:\s*(?:<[^>]*>\s*)*([^<\r\n]+)/i)||[])[1]||icao;
 byIcao.set(icao,{icao,iata,name:name.trim(),country:p[1],url:uri.toString()});
 }
 return [...byIcao.values()];
}
async function loadCatalog(){const prev=await cacheRead('catalog.json');try{
 if(prev){const s=await fs.stat(path.join(dataDir(),'catalog.json'));if(Date.now()-s.mtimeMs<86400000)return JSON.parse(prev.toString('utf8'))}
 const response=await getRemote(CATALOG,'text/html',35);const data=chartCatalogFromHtml(await response.text());if(data.length<30)throw Error('Catalog contains insufficient entries');
 await cacheWrite('catalog.json',Buffer.from(JSON.stringify(data)));return data;
 }catch(e){if(prev)return JSON.parse(prev.toString('utf8'));throw e}}
const DEFAULT_CHARTS={ULLI:'Russian Federation',UUEE:'Russian Federation',UUDD:'Russian Federation',UUWW:'Russian Federation',UMMS:'Belarus',URSS:'Russian Federation',URMM:'Russian Federation',UWWW:'Russian Federation',UNNT:'Russian Federation',UMKK:'Russian Federation'};
async function loadPdf(icao){const cache=await cacheRead(icao+'.pdf');const catalog=await loadCatalog().catch(()=>[]);const record=catalog.find(x=>x.icao===icao);
 let uri=record?.url;
 if(!uri&&DEFAULT_CHARTS[icao])uri='https://portalpasha.ru/charts/filecharts/'+encodeURIComponent(DEFAULT_CHARTS[icao])+'/'+icao+'.pdf';
 if(!uri)throw Error('Airport not present in chart catalog');
 const permitted=new URL(uri);if(permitted.origin!=='https://portalpasha.ru'||!permitted.pathname.startsWith('/charts/filecharts/'))throw Error('Unsafe charts URL');
 if(cache&&cache.subarray(0,5).toString()==='%PDF-')return cache;
 const remote=await getRemote(uri,'application/pdf,application/octet-stream;q=0.9,*/*;q=0.8',60);const bytes=Buffer.from(await remote.arrayBuffer());
 if(bytes.subarray(0,5).toString()!=='%PDF-')throw Error('Provider returned a non-PDF file');
 await cacheWrite(icao+'.pdf',bytes);return bytes;
}
function mime(filename){return ({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.webp':'image/webp'})[path.extname(filename).toLowerCase()]||'application/octet-stream'}
async function handle(request){try{
 const uri=new URL(request.url),route=uri.pathname;
 if(request.method==='GET'&&route==='/metar'){
 const ids=uri.searchParams.get('ids')||'';if(!/^[A-Za-z0-9]{4}(,[A-Za-z0-9]{4}){0,6}$/.test(ids))return json({error:'Invalid ICAO'},400);
 return getRemote('https://aviationweather.gov/api/data/metar?ids='+encodeURIComponent(ids)+'&format=json','application/json',20);
 }
 if(request.method==='GET'&&route==='/simbrief'){
 const id=uri.searchParams.get('userid')||'';if(!/^\d{1,10}$/.test(id))return failure('Invalid Pilot ID',400);
 return getRemote('https://www.simbrief.com/api/xml.fetcher.php?userid='+id,'application/xml',28);
 }
 if(request.method==='GET'&&route==='/charts-catalog')return json(await loadCatalog());
 if(request.method==='GET'&&route==='/charts-pdf'){
 const icao=(uri.searchParams.get('icao')||'').toUpperCase();if(!/^[A-Z0-9]{4}$/.test(icao))return failure('Invalid ICAO',400);
 const bytes=await loadPdf(icao);return new Response(bytes,{headers:{'content-type':'application/pdf','cache-control':'no-store'}});
 }
 if(route==='/launch-volanta'){
 if(request.method!=='POST')return json({launched:false,error:'Use POST'},405);
 if(process.platform!=='win32')return json({launched:false,error:'Windows only'},400);
 const bases=[process.env.LOCALAPPDATA,process.env.ProgramFiles,process.env['ProgramFiles(x86)']].filter(Boolean);
 const paths=[...bases.flatMap(base=>[path.join(base,'Programs','Volanta','Volanta.exe'),path.join(base,'volanta','Volanta.exe'),path.join(base,'Orbx','Volanta','Volanta.exe')])];
 const exe=paths.find(p=>fsSync.existsSync(p));if(!exe)return json({launched:false,error:'Volanta not found'},404);
 const child=spawn(exe,[],{detached:true,stdio:'ignore',windowsHide:false});child.unref();return json({launched:true});
 }
 if(request.method!=='GET')return failure('Method not allowed',405);
 // Static assets are confined to bundled app directory.
 const localPath=path.resolve(ROOT,'.'+(route==='/'?'/app.html':route));if(!(localPath===ROOT||localPath.startsWith(ROOT+path.sep)))return failure('Forbidden',403);
 const bytes=await fs.readFile(localPath);return new Response(bytes,{headers:{'content-type':mime(localPath)}});
 }catch(err){const message=String(err?.message||err);return failure(message,/ENOENT/.test(message)?404:502)}
}
function emit(type,extra={}){if(win&&!win.isDestroyed())win.webContents.send('updater:event',{type,...extra})}
function updaterConfigured(){return app.isPackaged && process.env.FLIGHT_ATLAS_DISABLE_UPDATES!=='1'}
// Navigraph SimLink process control (Windows only).
const {execFile}=require('node:child_process');
const SIMLINK_BINARY='NavigraphSimlink.exe';
const simlinkCandidates=[
 path.join(process.env.ProgramFiles||'C:\\Program Files','Navigraph','Simlink',SIMLINK_BINARY),
 path.join(process.env['ProgramFiles(x86)']||'C:\\Program Files (x86)','Navigraph','Simlink',SIMLINK_BINARY)
];
function simlinkPath(){return simlinkCandidates.find(p=>fsSync.existsSync(p))||null}
function processCheck(){return new Promise(resolve=>{if(process.platform!=='win32')return resolve(false);execFile('tasklist',['/FI','IMAGENAME eq '+SIMLINK_BINARY,'/FO','CSV','/NH'],{windowsHide:true,timeout:8000},(err,stdout)=>resolve(!err&&stdout.toLowerCase().includes(SIMLINK_BINARY.toLowerCase())))})}
async function simlinkStatus(){return {installed:!!simlinkPath(),running:await processCheck()}}
async function simlinkToggle(enabled){
 if(process.platform!=='win32')return {ok:false,error:'SimLink поддерживается только в Windows'};
 const installed=simlinkPath(),running=await processCheck();
 if(enabled){
  if(running)return {ok:true,running:true};
  if(!installed)return {ok:false,error:'Navigraph SimLink не найден. Установи SimLink с сайта Navigraph.'};
  try{const child=spawn(installed,[],{detached:true,stdio:'ignore',windowsHide:true});child.unref();return {ok:true,running:true}}catch(e){return {ok:false,error:e.message}}
 }
 if(!running)return {ok:true,running:false};
 return new Promise(resolve=>execFile('taskkill',['/IM',SIMLINK_BINARY],{windowsHide:true,timeout:8000},(err)=>resolve(err?{ok:false,error:err.message}:{ok:true,running:false})));
}
let oauthWindow=null;
function startDiscordOAuth(){
 if(oauthWindow&&!oauthWindow.isDestroyed()){oauthWindow.focus();return {ok:true}}
 const url='https://adtvscheowcmnogysars.supabase.co/auth/v1/authorize?provider=discord&redirect_to='+encodeURIComponent('flightatlas://auth/callback');
 oauthWindow=new BrowserWindow({width:550,height:760,minWidth:430,minHeight:550,parent:win||undefined,modal:false,show:true,title:'Flight Atlas — Discord',autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
 const callback=url=>{if(!url.startsWith('flightatlas://auth/callback'))return false;win?.webContents.send('auth:discord-callback',url);if(oauthWindow&&!oauthWindow.isDestroyed())oauthWindow.close();return true};
 oauthWindow.webContents.on('will-navigate',(event,url)=>{if(callback(url))event.preventDefault()});
 oauthWindow.webContents.on('will-redirect',(event,url)=>{if(callback(url))event.preventDefault()});
 oauthWindow.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\//.test(url))shell.openExternal(url);return {action:'deny'}});
 oauthWindow.on('closed',()=>{oauthWindow=null});
 oauthWindow.loadURL(url).catch(e=>win?.webContents.send('auth:discord-error',e.message));
 return {ok:true};
}
function setupUpdater(){
 ipcMain.handle('auth:discord-start',()=>startDiscordOAuth());
 ipcMain.handle('window:minimize',()=>{win?.minimize();return true});
 ipcMain.handle('window:toggle-maximize',()=>{if(!win)return false;win.isMaximized()?win.unmaximize():win.maximize();return win.isMaximized()});
 ipcMain.handle('window:close',()=>{win?.close();return true});
 ipcMain.handle('window:is-maximized',()=>win?.isMaximized()||false);
 ipcMain.handle('simconnect:status',()=>simBridge.snapshot());
 ipcMain.handle('simlink:status',()=>simlinkStatus());
 ipcMain.handle('simlink:toggle',(_event,enabled)=>simlinkToggle(enabled===true));
 ipcMain.handle('weather:metar',async(_e,ids)=>{
  if(!/^[A-Z0-9]{4}(,[A-Z0-9]{4}){0,6}$/.test(ids))throw Error('Недопустимые ICAO');
  const response=await getRemote('https://aviationweather.gov/api/data/metar?ids='+encodeURIComponent(ids)+'&format=json','application/json',30);
  return response.json();
 });
 ipcMain.handle('flight:simbrief',async(_e,id)=>{
  if(!/^\d{1,10}$/.test(id))throw Error('Неверный SimBrief Pilot ID');
  const response=await getRemote('https://www.simbrief.com/api/xml.fetcher.php?userid='+id,'application/xml',40);
  return response.text();
 });
 if(DEV_MODE){
  ipcMain.handle('app:version',()=>app.getVersion()+'-dev');
  ipcMain.handle('updater:check',async()=>({ok:false,error:'Обновления отключены в Flight Atlas Dev.'}));
  ipcMain.handle('updater:install',async()=>({ok:false,error:'Обновления отключены в Flight Atlas Dev.'}));
  return;
 }
 autoUpdater.autoDownload=true;
 autoUpdater.autoInstallOnAppQuit=true;
 autoUpdater.setFeedURL({provider:'github',owner:'NUROFENE',repo:'Flight-Atlas-App'});
 let ready=false;
 autoUpdater.on('checking-for-update',()=>emit('checking'));
 autoUpdater.on('update-available',info=>emit('available',{version:info.version,releaseNotes:info.releaseNotes||''}));
 autoUpdater.on('update-not-available',()=>emit('current'));
 autoUpdater.on('download-progress',info=>emit('progress',{percent:Math.round(info.percent)}));
 autoUpdater.on('update-downloaded',info=>{ready=true;emit('downloaded',{version:info.version});setTimeout(()=>autoUpdater.quitAndInstall(true,true),1200)});
 autoUpdater.on('error',err=>emit('error',{message:err.message}));
 ipcMain.handle('app:version',()=>app.getVersion());
 ipcMain.handle('updater:check',async()=>{
  if(!updaterConfigured())return {ok:false,error:'Обновления недоступны в этой сборке.'};
  try {await autoUpdater.checkForUpdates();return {ok:true}}catch(e){return {ok:false,error:e.message}}
 });
 ipcMain.handle('updater:install',async()=>{
  if(!updaterConfigured())return {ok:false,error:'Обновления недоступны в этой сборке.'};
  try {
   if(ready){setImmediate(()=>autoUpdater.quitAndInstall(true,true));return {ok:true};}
   await autoUpdater.downloadUpdate();
   if(!ready)throw Error('Обновление не завершило загрузку.');
   setImmediate(()=>autoUpdater.quitAndInstall(true,true));
   return {ok:true};
  }catch(e){emit('error',{message:e.message});return {ok:false,error:e.message}}
 });
}
function buildWindow(){Menu.setApplicationMenu(null);win=new BrowserWindow({frame:false,width:1500,height:940,minWidth:1000,minHeight:650,backgroundColor:'#0b1322',title:'',show:false,autoHideMenuBar:true,icon:path.join(ROOT,'FlightAtlas.ico'),webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
 win.once('ready-to-show',()=>{win.setTitle(DEV_MODE?'Flight Atlas Dev':'');win.show();if(updaterConfigured())setTimeout(()=>autoUpdater.checkForUpdates().catch(e=>emit('error',{message:e.message})),1500)});win.loadURL('atlas://flightatlas/');
 win.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\//i.test(url))shell.openExternal(url);return {action:'deny'}});
 win.webContents.on('will-navigate',(ev,url)=>{if(!url.startsWith('atlas://flightatlas/')){ev.preventDefault();if(/^https:\/\//i.test(url))shell.openExternal(url)}});
 win.webContents.on('render-process-gone',()=>dialog.showErrorBox('Flight Atlas','Процесс интерфейса остановился. Перезапустите приложение.'));
}
app.whenReady().then(()=>{protocol.handle(SCHEME,handle);setupUpdater();simBridge.start();buildWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)buildWindow()})});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});

app.on('before-quit',()=>simBridge.stop());
