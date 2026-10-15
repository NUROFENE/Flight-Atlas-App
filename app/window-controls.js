'use strict';
(()=> {
 const bridge=window.flightAtlasDesktop;
 for(const [id,method] of [['faMinimize','minimizeWindow'],['faMaximize','toggleMaximizeWindow'],['faClose','closeWindow']]){
  document.getElementById(id)?.addEventListener('click',()=>{bridge?.[method]?.().catch?.(console.error)});
 }
})();
