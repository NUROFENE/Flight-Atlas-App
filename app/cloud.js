'use strict';
/* Flight Atlas: authenticated cloud content and leaderboard. Server RLS is mandatory. */
(()=> {
 const A=()=>window.FlightAtlasAuth;
 const api=(path,opts)=>A().request(path,opts);
 const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let me=null,content=[];let bundledMods=null,bundledFlights=null;
 const status=(s)=>{const el=document.getElementById('atlasAdminStatus');if(el)el.textContent=s};
 async function profile(){
  if(!A()||!await A().ensureSession()){me=null;return null}
  const u=A().getSession()?.user;
  if(!u)return null;
  try{const rows=await api('/rest/v1/atlas_profiles?id=eq.'+encodeURIComponent(u.id)+'&select=id,nickname,role,pilot_number');me=rows[0]||null;return me}
  catch(e){console.warn('Cloud profile unavailable:',e);me=null;return null}
 }
 async function loadContent(){
  try{
   const rows=await api('/rest/v1/atlas_content?select=id,kind,payload,published,updated_at&published=eq.true&order=updated_at.asc',{auth:false});
   content=rows;
   if(typeof MOD_CATALOG!=='undefined'){
    if(!bundledMods)bundledMods=MOD_CATALOG.map(x=>({...x}));
    MOD_CATALOG.splice(0,MOD_CATALOG.length,...bundledMods.map(x=>({...x})));
    const cloudMods=rows.filter(x=>x.kind==='mod').map(x=>({...x.payload,_cloudId:x.id}));
    // All existing bundled mods remain; cloud items are additive or override by name.
    for(const m of cloudMods){const i=MOD_CATALOG.findIndex(x=>x.name===(m.replaces||m.name));if(i>=0)MOD_CATALOG.splice(i,1);MOD_CATALOG.push(m)}
   }
   if(typeof records!=='undefined'){
    if(!bundledFlights)bundledFlights=records.map(x=>({...x}));
    records.splice(0,records.length,...bundledFlights.map(x=>({...x})));
    const cloudFlights=rows.filter(x=>x.kind==='flight').map(x=>x.payload);
    for(const f of cloudFlights){
     const old=f.replaces||{airline:f.airline,orig:f.orig,dest:f.dest,flight:f.flight};
     const ix=records.findIndex(r=>r.airline===old.airline&&r.orig===old.orig&&r.dest===old.dest&&r.flight===old.flight);
     if(ix>=0)records.splice(ix,1);
     records.push({...f,status:'admin',source:'Flight Atlas Cloud'});
    }
       }
   if(typeof renderLobby==='function')renderLobby();
   return rows;
  }catch(e){console.warn('Cloud catalog unavailable, local data preserved:',e);return []}
 }
 function initPanel(){
  const root=document.getElementById('atlasCloudArea');if(!root)return;
  if(!me){root.innerHTML='<p class="profile-note">Для персонального Flight Atlas ID войдите в аккаунт. Облачные функции включаются после настройки базы.</p>';return}
  root.innerHTML='<div class="profile-card" style="margin-top:14px;padding:20px"><div class="profile-overline">FLIGHT ATLAS ID</div><h2>'+h(me.nickname)+' · FA-'+String(me.pilot_number).padStart(6,'0')+'</h2><p class="profile-note">Роль: '+h(me.role)+'</p>'+(me.role==='admin'?'<button class="btn primary" id="openAtlasAdmin">Открыть админ-панель</button>':'')+'</div>';
  const button=document.getElementById('openAtlasAdmin');if(button)button.onclick=()=>showAdmin();
 }
 async function decorateProfile(){await profile();initPanel()}
 function editorHTML(item){
  const p=item?.payload||{};return '<form id="atlasAdminForm" style="display:grid;gap:10px">'+
   '<input type="hidden" name="id" value="'+h(item?.id||'')+'"><input type="hidden" name="replaces" value="'+h(JSON.stringify(item?.payload?.replaces||item?._replaces||''))+'">'+
   '<label>Тип записи <select name="kind"><option value="mod" '+(item?.kind!=='flight'?'selected':'')+'>Мод</option><option value="flight" '+(item?.kind==='flight'?'selected':'')+'>Рейс</option></select></label>'+
   '<label>Название мода / Авиакомпания <input name="name" required maxlength="120" value="'+h(p.name||p.airline||'')+'"></label>'+
   '<label>Описание <input name="description" maxlength="500" value="'+h(p.description||'')+'"></label>'+
   '<label>Обложка (URL) <input name="image" type="url" value="'+h(p.image||'')+'"></label>'+
   '<label>Или загрузить картинку <input name="upload" type="file" accept="image/png,image/jpeg,image/webp"></label>'+
   '<label>Категория <select name="type">'+['aircraft','scenery','utilities'].map(v=>'<option '+(p.type===v?'selected':'')+'>'+v+'</option>').join('')+'</select></label>'+
   '<label>Симуляторы (через запятую: msfs24,msfs20,xp12,xp11) <input name="sim" value="'+h((p.sim||[]).join?.(',')||'msfs24')+'"></label>'+
   '<label>MSFS 2020 — ссылка <input name="url20" type="url" value="'+h(p.url20||'')+'"></label>'+
   '<label>MSFS 2024 — ссылка <input name="url24" type="url" value="'+h(p.url24||'')+'"></label>'+
   '<label>X-Plane 12 — ссылка <input name="url12" type="url" value="'+h(p.url12||'')+'"></label>'+
   '<label>ICAO отправления <input name="orig" maxlength="4" value="'+h(p.orig||'')+'"></label>'+
   '<label>ICAO назначения <input name="dest" maxlength="4" value="'+h(p.dest||'')+'"></label>'+
   '<label>Позывной перевозчика ICAO <input name="carrier" maxlength="3" value="'+h(p.carrier||'')+'"></label>'+
   '<label>Номер рейса (без ICAO) <input name="flight" maxlength="12" value="'+h(p.flight||'')+'"></label>'+
   '<label>Тип ВС <input name="aircraft" maxlength="12" value="'+h(item?.kind==='flight'?p.type:'')+'"></label>'+
   '<label>Длительность (мин) <input name="min" type="number" min="1" max="1440" value="'+h(p.min||90)+'"></label>'+
   '<label><input type="checkbox" name="published" '+(item?.published?'checked':'')+'> Опубликовать всем</label>'+
   '<div style="display:flex;gap:10px"><button type="submit" class="btn primary">Сохранить / Опубликовать</button><button type="button" class="btn" id="atlasAdminCancel">Отмена</button></div></form>';
 }
 async function uploadImage(file){
  if(!file)return '';
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5242880)throw Error('PNG, JPG, WEBP не более 5 МБ');
  const session=A().getSession(),extension=file.type.split('/')[1].replace('jpeg','jpg');
  const key=crypto.randomUUID()+'.'+extension;
  const url='https://adtvscheowcmnogysars.supabase.co';
  const res=await fetch(url+'/storage/v1/object/atlas-mod-images/'+key,{method:'POST',headers:{'apikey':'sb_publishable_Ce-WVyTNii_wFsTph8CTgA_syQx3_zg','Authorization':'Bearer '+session.access_token,'Content-Type':file.type},body:file});
  if(!res.ok)throw Error('Загрузка картинки: '+await res.text());
  return url+'/storage/v1/object/public/atlas-mod-images/'+key;
 }
 function collect(form){
  const v=n=>String(form.elements.namedItem(n)?.value||'').trim();
  const kind=v('kind'),url=x=>{const value=v(x);if(value&&!/^https:\/\//i.test(value))throw Error('Ссылки должны начинаться с https://');return value};
  if(kind==='flight'){
   const orig=v('orig').toUpperCase(),dest=v('dest').toUpperCase(),carrier=v('carrier').toUpperCase();
   if(!/^[A-Z0-9]{4}$/.test(orig)||!/^[A-Z0-9]{4}$/.test(dest)||!/^[A-Z]{3}$/.test(carrier)||!v('flight'))throw Error('Заполни ICAO аэропортов, авиакомпании и номер рейса');
   return {airline:v('name'),orig,dest,carrier,flight:v('flight'),type:v('aircraft'),min:Number(v('min')),status:'verified'};
  }
  const sim=v('sim').split(',').map(x=>x.trim()).filter(Boolean);
  if(!sim.length||sim.some(x=>!['msfs20','msfs24','xp12','xp11'].includes(x)))throw Error('Неверный список симуляторов');
  return {name:v('name'),description:v('description'),image:url('image'),type:v('type'),sim,url20:url('url20'),url24:url('url24'),url12:url('url12')};
 }
 async function showAdmin(){
  if(!await profile()||me.role!=='admin'){alert('Недостаточно прав');return}
  document.getElementById('atlasAdminOverlay')?.remove();
  const overlay=document.createElement('div');overlay.id='atlasAdminOverlay';
  overlay.style.cssText='position:fixed;inset:44px 0 0;background:#080d17f5;z-index:220;overflow:auto;padding:28px';
  overlay.innerHTML='<div style="max-width:1000px;margin:auto;color:#edf5ff"><div style="display:flex;justify-content:space-between;align-items:center"><h1>Flight Atlas · Админ-панель</h1><button class="btn" id="closeAtlasAdmin">Закрыть ✕</button></div><p id="atlasAdminStatus" class="profile-note">Загрузка…</p><button class="btn primary" id="atlasNewRecord">+ Добавить запись</button><div id="atlasAdminEditor" style="padding:14px 0"></div><div id="atlasAdminRecords" style="display:grid;gap:8px;margin-top:20px"></div></div>';
  document.body.appendChild(overlay);
  overlay.querySelector('#closeAtlasAdmin').onclick=()=>overlay.remove();
  overlay.querySelector('#atlasNewRecord').onclick=()=>openEditor(null);
  overlay.querySelector('#atlasExistingMod').onclick=()=>pickBundled('mod');
  overlay.querySelector('#atlasExistingFlight').onclick=()=>pickBundled('flight');
  await refreshAdmin();
 }
 async function refreshAdmin(){
  try{const rows=await api('/rest/v1/atlas_content?select=*&order=updated_at.desc');content=rows;
   const root=document.getElementById('atlasAdminRecords');if(!root)return;
   root.innerHTML=rows.map(x=>'<div style="display:flex;gap:10px;align-items:center;background:#172439;padding:12px;border-radius:10px"><span style="flex:1">'+h(x.kind==='mod'?x.payload.name:x.payload.airline+' '+x.payload.carrier+x.payload.flight+' '+x.payload.orig+'→'+x.payload.dest)+' · '+(x.published?'Опубликовано':'Черновик')+'</span><button class="btn" data-edit="'+h(x.id)+'">Редактировать</button><button class="btn" data-del="'+h(x.id)+'">Удалить</button></div>').join('')||'<p>Пока пусто.</p>';
   root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openEditor(rows.find(x=>x.id===b.dataset.edit)));
   root.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{if(!confirm('Удалить эту запись?'))return;try{await api('/rest/v1/atlas_content?id=eq.'+encodeURIComponent(b.dataset.del),{method:'DELETE'});await refreshAdmin();status('Удалено')}catch(e){status(e.message)}});
   status('Записей: '+rows.length);
  }catch(e){status('Ошибка базы: '+e.message)}
 }
 function pickBundled(kind){
  const list=kind==='mod'?(bundledMods||MOD_CATALOG):(bundledFlights||records);
  const root=document.getElementById('atlasAdminEditor');if(!root)return;
  const pick=document.createElement('select');pick.style.cssText='width:100%;padding:12px;background:#172439;color:#fff';
  const hint=document.createElement('p');hint.textContent='Выбери встроенную запись для редактирования';root.replaceChildren(hint,pick);
  const blank=document.createElement('option');blank.value='';blank.textContent='Выбери…';pick.append(blank);
  list.forEach((item,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=kind==='mod'?item.name:item.airline+' '+item.carrier+item.flight+' '+item.orig+' → '+item.dest;pick.append(o)});
  pick.onchange=()=>{if(!pick.value)return;const item=list[Number(pick.value)];const replaces=kind==='mod'?item.name:{airline:item.airline,orig:item.orig,dest:item.dest,flight:item.flight};openEditor({kind,payload:item,_replaces:replaces,published:true})};
 }
 function openEditor(item){
  const root=document.getElementById('atlasAdminEditor');if(!root)return;root.innerHTML=editorHTML(item);
  root.querySelector('#atlasAdminCancel').onclick=()=>root.innerHTML='';
  root.querySelector('#atlasAdminForm').onsubmit=async ev=>{
   ev.preventDefault();const form=ev.currentTarget,button=form.querySelector('[type=submit]');button.disabled=true;status('Сохраняем…');
   try{
    const kind=form.elements.namedItem('kind').value,id=form.elements.namedItem('id').value;
    const payload=collect(form),uploaded=await uploadImage(form.elements.namedItem('upload').files[0]);
    const original=JSON.parse(form.elements.namedItem('replaces')?.value||'""');if(original)payload.replaces=original;
    if(uploaded)payload.image=uploaded;
    const row={kind,payload,published:form.elements.namedItem('published').checked,updated_by:me.id,updated_at:new Date().toISOString()};
    if(id)await api('/rest/v1/atlas_content?id=eq.'+encodeURIComponent(id),{method:'PATCH',data:row});
    else await api('/rest/v1/atlas_content',{method:'POST',data:row});
    root.innerHTML='';status('Сохранено. Опубликованные изменения увидят пользователи при следующей загрузке каталога.');
    await refreshAdmin();await loadContent();
   }catch(e){status('Не удалось сохранить: '+e.message)}finally{button.disabled=false}
  };
 }
 async function syncHistory(){
  if(!await profile())return;
  const user=A().getSession()?.user;if(!user||typeof getHistory!=='function')return;
  const rows=getHistory().slice(0,500).map(f=>{
   const completed=new Date(f.completedAt||'');if(!Number.isFinite(completed.getTime()))return null;
   const start=new Date(f.startedAt||'');
   return {user_id:user.id,entry_key:[f.completedAt,f.orig,f.dest,f.number||f.flight].join('|').slice(0,180),
    orig:f.orig||null,dest:f.dest||null,flight:String(f.number||f.flight||'').slice(0,25),
    completed_at:completed.toISOString(),started_at:Number.isFinite(start.getTime())?start.toISOString():null,
    duration_minutes:Number.isFinite(start.getTime())?Math.min(1440,Math.max(0,Math.round((completed-start)/60000))):0,
    landing_fpm:f.landingFpm==null?null:Math.max(-5000,Math.min(5000,Math.round(Number(f.landingFpm)||0)))};
  }).filter(Boolean);
  for(let i=0;i<rows.length;i+=50){
   try{await api('/rest/v1/atlas_flights?on_conflict=user_id,entry_key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},data:rows.slice(i,i+50)})}
   catch(e){console.warn('Flight sync failed:',e);break}
  }
 }
 async function renderLeaderboard(){
  const root=document.getElementById('leaderboardView');if(!root)return;
  const owner=await profile();
  if(!owner){root.insertAdjacentHTML('beforeend','<p class="profile-note">Войди в аккаунт, чтобы увидеть общий рейтинг пилотов.</p>');return}
  try{
   const [profiles,flights]=await Promise.all([
    api('/rest/v1/atlas_profiles?select=id,nickname,pilot_number&limit=5000'),
    api('/rest/v1/atlas_flights?select=user_id,completed_at,duration_minutes,landing_fpm&limit=10000')
   ]);
   const month=new Date().toISOString().slice(0,7);
   const sums=new Map();
   for(const f of flights){if(!String(f.completed_at).startsWith(month))continue;const a=sums.get(f.user_id)||{count:0,minutes:0};a.count++;a.minutes+=Number(f.duration_minutes)||0;sums.set(f.user_id,a)}
   const sorted=profiles.map(p=>({...p,...(sums.get(p.id)||{count:0,minutes:0})})).sort((a,b)=>b.minutes-a.minutes||b.count-a.count).slice(0,100);
   root.innerHTML='<div class="profile-overline">FLIGHT ATLAS / GLOBAL LEADERBOARD</div><h1>Рейтинг пилотов</h1><p class="leaderboard-intro">Общий рейтинг за текущий месяц · синхронизация с Supabase</p><div class="leaderboard-standalone-list">'+sorted.map((p,i)=>'<button class="leaderboard-pilot-detail" data-pilot="'+h(p.id)+'" style="width:100%;display:flex;gap:14px;padding:14px;border:1px solid #354b62;border-radius:10px;background:#172439;color:#fff;text-align:left;margin-bottom:8px"><strong>#'+(i+1)+'</strong><span style="flex:1">'+h(p.nickname)+' <small>FA-'+String(p.pilot_number).padStart(6,'0')+'</small></span><span>'+p.count+' рейсов · '+(p.minutes/60).toFixed(1)+' ч</span></button>').join('')+'</div>';
   root.querySelectorAll('[data-pilot]').forEach(b=>b.onclick=()=>showPilot(b.dataset.pilot,profiles,flights));
  }catch(e){root.insertAdjacentHTML('beforeend','<p class="profile-note">Глобальный рейтинг пока недоступен: '+h(e.message)+'</p>')}
 }
 function showPilot(id,profiles,flights){
  const p=profiles.find(x=>x.id===id);if(!p)return;
  const f=flights.filter(x=>x.user_id===id),minutes=f.reduce((a,b)=>a+(Number(b.duration_minutes)||0),0);
  const el=document.getElementById('leaderboardView');el.innerHTML='<button class="btn" id="atlasBackLeaderboard">← К рейтингу</button><h1>'+h(p.nickname)+'</h1><p>Flight Atlas ID: FA-'+String(p.pilot_number).padStart(6,'0')+'</p><h2>'+f.length+' рейсов · '+(minutes/60).toFixed(1)+' ч</h2>';
  el.querySelector('#atlasBackLeaderboard').onclick=renderLeaderboard;
 }
 window.AtlasCloud={loadContent,decorateProfile,renderLeaderboard,syncHistory,showAdmin};
 document.addEventListener('DOMContentLoaded',()=>{loadContent();profile()});
})();
