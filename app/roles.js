'use strict';
/* Adds role management to the existing secure admin panel. The SQL RPC checks admin permissions server-side. */
(()=>{
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function bind(){
  const overlay=document.getElementById('atlasAdminOverlay');
  if(!overlay||overlay.dataset.rolesAttached)return;
  overlay.dataset.rolesAttached='true';
  const area=document.createElement('div');
  area.style.cssText='display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:14px 0';
  area.innerHTML='<input id="atlasPilotRoleId" placeholder="ID пилота: FA-000002" style="padding:12px;background:#172439;color:#fff;border:1px solid #43566d;border-radius:8px"><select id="atlasPilotRole" style="padding:12px;background:#172439;color:#fff"><option value="admin">Выдать админку</option><option value="user">Убрать админку</option></select><button class="btn" id="atlasSetPilotRole">Изменить роль</button>';
  const btn=overlay.querySelector('#atlasNewRecord');btn?.before(area);
  area.querySelector('#atlasSetPilotRole').onclick=async()=>{
   const raw=area.querySelector('#atlasPilotRoleId').value.trim();
   const match=/^(?:FA-)?0*([0-9]+)$/i.exec(raw);
   const status=overlay.querySelector('#atlasAdminStatus');
   if(!match){if(status)status.textContent='Укажи корректный ID: FA-000002';return}
   if(!confirm('Изменить роль пилота '+raw+'?'))return;
   try{
    await window.FlightAtlasAuth.request('/rest/v1/rpc/atlas_set_role',{method:'POST',data:{target_pilot_number:Number(match[1]),target_role:area.querySelector('#atlasPilotRole').value}});
    if(status)status.textContent='Роль пилота '+esc(raw)+' успешно изменена';
   }catch(e){if(status)status.textContent='Ошибка: '+e.message}
  };
 }
 new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
 bind();
})();
