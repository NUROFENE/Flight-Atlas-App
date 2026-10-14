const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('flightAtlasDesktop',Object.freeze({
  version:()=>ipcRenderer.invoke('app:version'),
  checkUpdates:()=>ipcRenderer.invoke('updater:check'),
  installUpdate:()=>ipcRenderer.invoke('updater:install'),
  onUpdate:fn=>{if(typeof fn!=='function')return()=>{};const listener=(_e,v)=>fn(v);ipcRenderer.on('updater:event',listener);return()=>ipcRenderer.removeListener('updater:event',listener)}
}));
