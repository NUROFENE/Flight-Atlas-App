'use strict';
/* Supabase public (publishable) key is safe in client apps.
   Never place service_role / secret keys here. */
(()=> {
const URL='https://adtvscheowcmnogysars.supabase.co';
const KEY='sb_publishable_Ce-WVyTNii_wFsTph8CTgA_syQx3_zg';
const SESSION_KEY='flightatlas_supabase_session_v1';
let session=null;
try{session=JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{}
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function request(path,opts={}){
 const headers={'apikey':KEY,'Content-Type':'application/json',...opts.headers};
 if(opts.auth!==false && session?.access_token)headers.Authorization='Bearer '+session.access_token;
 const response=await fetch(URL+path,{method:opts.method||'GET',headers,body:opts.data?JSON.stringify(opts.data):undefined});
 const body=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(body.msg||body.error_description||body.message||body.error||'HTTP '+response.status);
 return body;
}
function saveSession(next){session=next; if(next)localStorage.setItem(SESSION_KEY,JSON.stringify(next));else localStorage.removeItem(SESSION_KEY)}
async function ensureSession(){
 if(!session?.access_token)return false;
 if(session.expires_at&&Date.now()/1000<session.expires_at-90)return true;
 if(!session.refresh_token){saveSession(null);return false}
 try{const result=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',data:{refresh_token:session.refresh_token},auth:false});saveSession({...result,expires_at:Math.floor(Date.now()/1000)+result.expires_in});return true}
 catch{saveSession(null);return false}
}
async function syncOwnProfile(){
 if(!await ensureSession())return;
 const nickname=(document.getElementById('profileNick')?.value||'').trim().slice(0,40)||'Пилот';
 try{
 await request('/rest/v1/atlas_profiles?id=eq.'+encodeURIComponent(session.user.id),{method:'PATCH',data:{nickname}});
 }catch(e){setStatus('Облачный профиль пока не настроен: '+e.message,true)}
}
function setStatus(message,error=false){const node=document.getElementById('atlasAuthStatus');if(node){node.textContent=message;node.style.color=error?'#ff8f8f':''}}
async function onDiscordCallback(raw){
 try{
  const callback=new URL(raw);
  if(callback.protocol!=='flightatlas:'||callback.host!=='auth'||callback.pathname!=='/callback')throw Error('Неверный адрес возврата');
  const parts=new URLSearchParams(callback.hash.slice(1)||callback.search.slice(1));
  if(parts.get('error'))throw Error(parts.get('error_description')||parts.get('error'));
  const token=parts.get('access_token'),refresh=parts.get('refresh_token');
  if(!token||!refresh)throw Error('Discord не передал токены авторизации. Проверь Redirect URLs в Supabase.');
  const response=await fetch(URL+'/auth/v1/user',{headers:{apikey:KEY,Authorization:'Bearer '+token}});
  if(!response.ok)throw Error('Не удалось проверить аккаунт');
  const user=await response.json();
  saveSession({access_token:token,refresh_token:refresh,user,expires_at:Math.floor(Date.now()/1000)+Number(parts.get('expires_in')||3600)});
  mount();setStatus('Discord подключён. Добро пожаловать!');
  window.AtlasCloud?.decorateProfile();
 }catch(error){setStatus('Ошибка входа через Discord: '+error.message,true)}
}
function mount(){
 const root=document.getElementById('atlasAuthPanel');if(!root)return;
 const user=session?.user;
 root.innerHTML='<div class="profile-overline">FLIGHT ATLAS / ACCOUNT</div><h2>Аккаунт пилота</h2>'+
 (user?'<p>Вы вошли как <strong>'+escapeHtml(user.user_metadata?.full_name||user.user_metadata?.name||user.email||user.id)+'</strong></p><button class="btn" id="atlasAuthLogout" type="button">Выйти</button>':
 '<p>Регистрация и вход через Discord. Код из письма не требуется.</p><button class="btn primary" id="atlasDiscordLogin" type="button" style="width:100%;padding:14px">Войти через Discord</button>')+
 '<p id="atlasAuthStatus" class="profile-note" role="status"></p>';
 root.querySelector('#atlasAuthLogout')?.addEventListener('click',async()=>{try{await request('/auth/v1/logout',{method:'POST'})}catch{}saveSession(null);mount();window.AtlasCloud?.decorateProfile()});
 root.querySelector('#atlasDiscordLogin')?.addEventListener('click',async()=>{
  setStatus('Открываем Discord…');
  try{if(!window.flightAtlasDesktop?.startDiscordLogin)throw Error('Для входа обнови Flight Atlas');await window.flightAtlasDesktop.startDiscordLogin();setStatus('Подтверди вход в открывшемся окне Discord.')}
  catch(e){setStatus(e.message,true)}
 });
}
window.flightAtlasDesktop?.onDiscordCallback?.(onDiscordCallback);
window.flightAtlasDesktop?.onDiscordError?.(message=>setStatus('Не удалось открыть Discord: '+message,true));
window.FlightAtlasAuth={mount,ensureSession,request,syncOwnProfile,getSession:()=>session};
ensureSession().then(()=>{if(document.getElementById('atlasAuthPanel'))mount()});
})();
