const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('flightAtlasDesktop',Object.freeze({
  version:()=>ipcRenderer.invoke('app:version'),
  minimizeWindow:()=>ipcRenderer.invoke('window:minimize'),
  toggleMaximizeWindow:()=>ipcRenderer.invoke('window:toggle-maximize'),
  closeWindow:()=>ipcRenderer.invoke('window:close'),
  isWindowMaximized:()=>ipcRenderer.invoke('window:is-maximized'),
  metar:ids=>ipcRenderer.invoke('weather:metar',ids),
  simbrief:id=>ipcRenderer.invoke('flight:simbrief',id),
  simconnect:()=>ipcRenderer.invoke('simconnect:status'),
  simlinkStatus:()=>ipcRenderer.invoke('simlink:status'),
  simlinkToggle:enabled=>ipcRenderer.invoke('simlink:toggle',enabled),
  checkUpdates:()=>ipcRenderer.invoke('updater:check'),
  installUpdate:()=>ipcRenderer.invoke('updater:install'),
  onUpdate:fn=>{if(typeof fn!=='function')return()=>{};const listener=(_e,v)=>fn(v);ipcRenderer.on('updater:event',listener);return()=>ipcRenderer.removeListener('updater:event',listener)}
}));
