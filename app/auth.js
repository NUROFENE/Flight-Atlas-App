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
 await request('/rest/v1/profiles?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},data:{id:session.user.id,nickname}});
 }catch(e){setStatus('Аккаунт создан, но таблицы ещё не настроены: '+e.message,true)}
}
function setStatus(message,error=false){const node=document.getElementById('atlasAuthStatus');if(node){node.textContent=message;node.style.color=error?'#ff8f8f':''}}
function mount(){
 const root=document.getElementById('atlasAuthPanel');if(!root)return;
 const user=session?.user;
 root.innerHTML='<div class="profile-overline">FLIGHT ATLAS / ACCOUNT</div><h2>Аккаунт пилота</h2>'+
 (user?'<p>Вы вошли как <strong>'+escapeHtml(user.email||user.id)+'</strong></p><button class="btn" id="atlasAuthLogout" type="button">Выйти</button>':
 '<p>Зарегистрируйтесь, чтобы затем синхронизировать профиль и участвовать в общем лидерборде.</p><form id="atlasAuthForm" class="atlas-auth-form"><label for="atlasAuthEmail">Email</label><input id="atlasAuthEmail" type="email" autocomplete="email" required placeholder="you@example.com"><label for="atlasAuthPassword">Пароль</label><input id="atlasAuthPassword" type="password" autocomplete="current-password" minlength="8" required placeholder="Не менее 8 символов"><div class="atlas-auth-actions"><button class="btn primary" type="submit" data-auth-action="signup">Регистрация</button><button class="btn" type="submit" data-auth-action="signin">Войти</button></div></form>')+
 '<p id="atlasAuthStatus" class="profile-note" role="status"></p>';
 const logout=root.querySelector('#atlasAuthLogout');
 if(logout)logout.onclick=async()=>{try{await request('/auth/v1/logout',{method:'POST'})}catch{}saveSession(null);mount()};
 const form=root.querySelector('#atlasAuthForm');
 if(form){let action='signin';form.querySelectorAll('[data-auth-action]').forEach(button=>button.addEventListener('click',()=>action=button.dataset.authAction));
 form.onsubmit=async e=>{e.preventDefault();const email=form.querySelector('#atlasAuthEmail').value.trim(),password=form.querySelector('#atlasAuthPassword').value;setStatus('Подключаемся…');
 try{
 const result=action==='signup'?
 await request('/auth/v1/signup',{method:'POST',data:{email,password},auth:false}):
 await request('/auth/v1/token?grant_type=password',{method:'POST',data:{email,password},auth:false});
 if(result.access_token){saveSession({...result,expires_at:Math.floor(Date.now()/1000)+(result.expires_in||3600)});mount();await syncOwnProfile();setStatus('Успешный вход')}
 else setStatus('Проверьте почту и подтвердите email, затем нажмите «Войти».');
 }catch(error){setStatus(error.message,true)}
 };
 }
}
window.FlightAtlasAuth={mount,ensureSession,request,syncOwnProfile,getSession:()=>session};
ensureSession().then(()=>{if(document.getElementById('atlasAuthPanel'))mount()});
})();
