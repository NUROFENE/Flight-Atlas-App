(()=>{
"use strict";
const ASSET="https://raw.githubusercontent.com/NUROFENE/Flight-Atlas-App/main/app/assets/";
const D="https://www.flightsim.to/";
const M=[
["PMDG Boeing 737-800","aircraft","pmdg_737_800.jpg","https://pmdg.com/",["msfs20","msfs24"]],
["PMDG Boeing 737-700","aircraft","pmdg_737_700.jpg","https://pmdg.com/",["msfs20","msfs24"]],
["PMDG Boeing 737-600","aircraft","pmdg_737_600.jpg","https://pmdg.com/",["msfs20","msfs24"]],
["PMDG Boeing 737-900","aircraft","pmdg_737_900.jpg","https://pmdg.com/",["msfs20","msfs24"]],
["PMDG Boeing 777-300ER","aircraft","pmdg_777_300er.jpg","https://pmdg.com/",["msfs20","msfs24"]],
["PMDG Boeing 777-200ER","aircraft","pmdg_777_200er.jpg","https://pmdg.com/",["msfs20","msfs24"]],
["FlyByWire A32NX","aircraft","flybywire_a32nx.jpg","https://flybywiresim.com/",["msfs20","msfs24"]],
["Fenix A320 Family","aircraft","fenix_bundle.jpg","https://fenixsim.com/",["msfs20","msfs24"]],
["iniBuilds Airbus A350","aircraft","inibuilds_a350.jpg","https://inibuilds.com/",["msfs24"]],
["TFDi Design MD-11","aircraft","tfdi_md11.jpg","https://www.tfdidesign.com/",["msfs20","msfs24"]],
["FlightSim Studio E-Jets 170/175","aircraft","fss_ejets_17x.jpg","https://flightsim-studio.com/",["msfs20","msfs24"]],
["FlightSim Studio E-Jets 190/195","aircraft","fss_ejets_19x.jpg","https://flightsim-studio.com/",["msfs20","msfs24"]],
["Санкт-Петербург — Пулково · ULLI","scenery","scenery_ULLI.jpg",D,["msfs20","msfs24"]],
["Москва — Шереметьево · UUEE","scenery","scenery_UUEE.jpg",D,["msfs20","msfs24"]],
["Москва — Домодедово · UUDD","scenery","scenery_UUDD.jpg",D,["msfs20","msfs24"]],
["Москва — Внуково · UUWW","scenery","scenery_UUWW.jpg",D,["msfs20","msfs24"]],
["Сочи · URSS","scenery","scenery_URSS.jpg",D,["msfs20","msfs24"]],
["Казань · UWKD","scenery","scenery_UWKD.jpg",D,["msfs20","msfs24"]],
["Мурманск · ULMM","scenery","scenery_ULAA.jpg",D,["msfs20","msfs24"]],
["Минск · UMMS","scenery","scenery_UMMS.jpg",D,["msfs20","msfs24"]],
["Калининград · UMKK","scenery","scenery_UMKK.jpg",D,["msfs20","msfs24"]],
["Тбилиси · UGTB","scenery","scenery_UGTB.jpg",D,["msfs20","msfs24"]],
["Батуми · UGSB","scenery","scenery_UGSB.jpg",D,["msfs20","msfs24"]],
["Анталья · LTAI","scenery","scenery_LTAI.jpg",D,["msfs20","msfs24"]],
["Стамбул · LTFM","scenery","scenery_LTFM.jpg",D,["msfs20","msfs24"]],
["Баку · UBBB","scenery","scenery_UBBB.jpg",D,["msfs20","msfs24"]],
["Ереван · UDYZ","scenery","scenery_UDYZ.jpg",D,["msfs20","msfs24"]],
["Алматы · UAAA","scenery","scenery_UAAA.jpg",D,["msfs20","msfs24"]],
["Иркутск · UIII","scenery","scenery_UIII.jpg",D,["msfs20","msfs24"]],
["Екатеринбург · USSS","scenery","scenery_USSS.jpg",D,["msfs20","msfs24"]],
["Самара · UWWW","scenery","scenery_UWWW.jpg",D,["msfs20","msfs24"]],
["Краснодар · URKK","scenery","scenery_URKK.jpg",D,["msfs20","msfs24"]],
["Волгоград · URWW","scenery","scenery_URWW.jpg",D,["msfs20","msfs24"]],
["Нижний Новгород · UWGG","scenery","scenery_UWGG.jpg",D,["msfs20","msfs24"]],
["Сургут · USRR","scenery","scenery_USNN.jpg",D,["msfs20","msfs24"]],
["Уфа · UWUU","scenery","scenery_UWUU.jpg",D,["msfs20","msfs24"]],
["Кольцово · USSS","scenery","scenery_USSS.jpg",D,["msfs20","msfs24"]],
["SimBrief Flight Planner","utility",null,"https://dispatch.simbrief.com/",["msfs20","msfs24"]],
["vPilot · VATSIM","utility",null,"https://vpilot.rosscarlson.dev/",["msfs20","msfs24"]],
["Little Navmap","utility",null,"https://albar965.github.io/littlenavmap.html",["msfs20","msfs24"]],
["FlyByWire Installer","utility","flybywire_a32nx.jpg","https://flybywiresim.com/",["msfs20","msfs24"]]
].map(([name,cat,image,url,games],idx)=>({name,cat,image,url,games,idx}));
const T={
ru:{home:"ГЛАВНАЯ",sub:"Subscription",routes:"РЕЙСЫ",mods:"МОДЫ",account:"АККАУНТ",charts:"ЧАРТЫ",map:"КАРТА",support:"ПОДДЕРЖКА",download:"Скачать",modsKicker:"FLIGHT ATLAS / БИБЛИОТЕКА",modsTitle:"Моды и дополнения",modsDesc:"Самолёты, аэропорты и инструменты для твоего авиасимулятора. Выбери игру, категорию или найди дополнение по названию.",search:"Поиск модов, самолётов, аэропортов...",sortDefault:"По каталогу",sortName:"По названию",sortReverse:"В обратном порядке",all:"Все",aircraft:"✈ Самолёты",scenery:"◈ Сценарии",utility:"⚙ Утилиты",shown:"Найдено: ",noMods:"По выбранным фильтрам ничего не найдено. Попробуй изменить игру или категорию.",detail:"Подробнее об дополнении",source:"Сайт разработчика / каталог",close:"Закрыть",allGames:"Все игры",heroKicker:"СОЗДАНО ДЛЯ ВИРТУАЛЬНЫХ ПИЛОТОВ",lead:"Маршруты авиакомпаний, авиационные чарты, VATSIM, моды и инструменты для полётов. Всё, что нужно виртуальному пилоту — в Flight Atlas.",learn:"Узнать больше",downloadFor:"Скачать для Windows",free:"Бесплатно",subKicker:"FLIGHT ATLAS / ПОДПИСКА",subTitle:"Subscription",subText:"Раздел подписки готовится. Пока Flight Atlas можно скачивать и использовать бесплатно. Платёжная система на сайте не подключена.",routesKicker:"FLIGHT ATLAS / РЕЙСЫ",routesTitle:"Маршрутный каталог",routesText:"Примеры направлений из Flight Atlas. Для полного каталога, выбора самолёта и планирования воспользуйся Windows-приложением.",accountKicker:"FLIGHT ATLAS / ПИЛОТ",accountTitle:"Аккаунт",accountText:"Личный кабинет доступен в приложении Flight Atlas. Вход через веб-сайт пока не подключён, поэтому здесь не предлагается отдельная регистрация.",chartsKicker:"FLIGHT ATLAS / AIRPORT CHARTS",chartsTitle:"Авиационные чарты",chartsText:"Раздел схем доступен в Windows-приложении. Веб-просмотр чартов добавим позже; пока не показываем несуществующие схемы.",mapKicker:"FLIGHT ATLAS / WORLD MAP",mapTitle:"Карта полётов",mapText:"Карта истории и маршрутов пока работает в настольной версии Flight Atlas. Веб-версия карты находится в разработке.",desktop:"Открыть загрузку Windows-приложения",modalAircraft:"Самолёт",modalScenery:"Сценарий",modalUtility:"Утилита",modalLabel:"Официальный сайт / каталог",modalDesc:"Эта карточка основана на каталоге Flight Atlas. Информация о загрузке и совместимости уточняется на сайте разработчика.",supportNote:"Поддержка открывает Discord. Прямая ссылка на сервер Flight Atlas будет добавлена после получения приглашения."},
en:{home:"HOME",sub:"Subscription",routes:"FLIGHTS",mods:"MODS",account:"ACCOUNT",charts:"CHARTS",map:"MAP",support:"SUPPORT",download:"Download",modsKicker:"FLIGHT ATLAS / LIBRARY",modsTitle:"Mods & add-ons",modsDesc:"Aircraft, scenery and tools for your flight simulator. Filter by simulator, category or search by name.",search:"Search mods, aircraft, airports...",sortDefault:"Catalog order",sortName:"Name A–Z",sortReverse:"Reverse order",all:"All",aircraft:"✈ Aircraft",scenery:"◈ Scenery",utility:"⚙ Utilities",shown:"Found: ",noMods:"No add-ons match your filters. Try a different simulator or category.",detail:"About this add-on",source:"Developer website / catalog",close:"Close",allGames:"All simulators",heroKicker:"BUILT FOR VIRTUAL PILOTS",lead:"Airline routes, airport charts, VATSIM, add-ons and planning tools. Everything a virtual pilot needs — in Flight Atlas.",learn:"Explore features",downloadFor:"Download for Windows",free:"Free",subKicker:"FLIGHT ATLAS / SUBSCRIPTION",subTitle:"Subscription",subText:"Subscriptions are coming later. Flight Atlas is currently free to download and use. No payment processing is enabled on this website.",routesKicker:"FLIGHT ATLAS / FLIGHTS",routesTitle:"Flight catalog",routesText:"A few sample routes from Flight Atlas. Use the Windows application for the full airline catalog, aircraft selection and flight planning.",accountKicker:"FLIGHT ATLAS / PILOT",accountTitle:"Account",accountText:"Pilot accounts are currently available in the Flight Atlas desktop application. Website authentication is not yet enabled.",chartsKicker:"FLIGHT ATLAS / AIRPORT CHARTS",chartsTitle:"Airport charts",chartsText:"Charts are accessible in the Windows app. Web chart viewing is still in development.",mapKicker:"FLIGHT ATLAS / WORLD MAP",mapTitle:"Flight map",mapText:"Flight history and route maps are currently available in the Flight Atlas Windows app. A browser-based map is planned.",desktop:"Get the Windows app",modalAircraft:"Aircraft",modalScenery:"Scenery",modalUtility:"Utility",modalLabel:"Developer site / catalog",modalDesc:"This listing comes from the Flight Atlas catalog. Check availability and compatibility on the developer's website.",supportNote:"Support opens Discord. A direct invite to the Flight Atlas server will be added once provided."}
};
let lang=(localStorage.getItem("fa-website-language")==="en"?"en":"ru");
let cat="all",game="all",query="",sort="default";const q=(s)=>document.querySelector(s),qa=(s)=>[...document.querySelectorAll(s)];
const t=(key)=>T[lang][key]??key;
const PAGES=["home","subscription","routes","mods","account","charts","map"];
function pageFromHash(){const hash=decodeURIComponent(location.hash.slice(1)).replace(/^\//,"").split("/")[0];return PAGES.includes(hash)?hash:"home";}
function setPage(){
 const current=pageFromHash();
 qa(".page").forEach(p=>p.classList.toggle("active",p.dataset.page===current));
 qa("[data-page-link]").forEach(a=>{const active=a.dataset.pageLink===current;a.classList.toggle("active",active);if(active)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});
 q(".navlinks")?.classList.remove("open");q(".mobile-toggle")?.setAttribute("aria-expanded","false");
 window.scrollTo(0,0);document.title=(current==="home"?"Flight Atlas":t(current)+" — Flight Atlas");
}
function setText(selector,value){const x=q(selector);if(x)x.textContent=value;}
function translate(){
 document.documentElement.lang=lang;
 qa("[data-i18n]").forEach(el=>{el.textContent=t(el.dataset.i18n)});
 qa(".lang-picker button").forEach(b=>{const a=b.dataset.lang===lang;b.classList.toggle("active",a);b.setAttribute("aria-pressed",String(a))});
 setText("#page-home .copy .eyebrow",t("heroKicker"));
 setText("#page-home .lead",t("lead"));
 setText("#page-home .copy .button.white", "↓ "+t("downloadFor"));
 setText("#page-home .copy .button.ghost",t("learn")+" ↗");
 qa(".mod-cat").forEach(b=>{b.textContent=t(b.dataset.cat==="all"?"all":b.dataset.cat);b.classList.toggle("selected",cat===b.dataset.cat);b.setAttribute("aria-pressed",String(cat===b.dataset.cat))});
 const search=q("#modsSearch");if(search)search.placeholder=t("search");
 const sel=q("#modsGame");if(sel){const old=sel.value;sel.querySelector("option[value=all]").textContent=t("allGames");sel.value=old}
 const order=q("#modsSort");if(order){order.querySelector("option[value=default]").textContent=t("sortDefault");order.querySelector("option[value=name]").textContent=t("sortName");order.querySelector("option[value=reverse]").textContent=t("sortReverse")}
 setText("#modsShownTitle",t("shown"));setText("#modsEmpty",t("noMods"));
 setText("#modalClose",t("close"));setText("#modOpenSource",t("modalLabel")+" ↗");setText("#modDetail",t("modalDesc"));
 setText("#homeMetaFree",t("free"));
 renderMods();document.title=pageFromHash()==="home"?"Flight Atlas":t(pageFromHash())+" — Flight Atlas";
}
function renderMods(){
 const term=query.toLocaleLowerCase().trim();
 let items=M.filter(m=>(cat==="all"||m.cat===cat)&&(game==="all"||(game==="msfsboth"?m.games.includes("msfs20")&&m.games.includes("msfs24"):m.games.includes(game)))&&(!term||(m.name.toLocaleLowerCase()+" "+m.cat+" "+m.games.join(" ")).includes(term)));
 if(sort==="name")items=items.sort((a,b)=>a.name.localeCompare(b.name,lang));
 if(sort==="reverse")items=items.reverse();
 const grid=q("#modsGrid");if(!grid)return;
 grid.replaceChildren();
 const frag=document.createDocumentFragment();
 for(const mod of items){
   const b=document.createElement("button");b.type="button";b.className="mod-card";b.setAttribute("aria-label",mod.name);b.dataset.idx=String(mod.idx);
   if(mod.image){const im=document.createElement("img");im.loading="lazy";im.decoding="async";im.alt="";im.src=ASSET+mod.image;im.onerror=()=>{im.remove();b.classList.add("missing-image")};b.append(im)}
   else{b.style.background="radial-gradient(ellipse at 75% 0,#4c5367,#1c202a 65%)";const sym=document.createElement("span");sym.textContent="✈";sym.style.cssText="position:absolute;top:18%;left:42%;font-size:64px;color:#b6b9c3;opacity:.44";b.append(sym)}
   const grad=document.createElement("span");grad.className="mod-gradient";b.append(grad);
   const pill=document.createElement("span");pill.className="mod-pill";pill.textContent=mod.cat==="aircraft"?t("modalAircraft"):mod.cat==="scenery"?t("modalScenery"):t("modalUtility");b.append(pill);
   const info=document.createElement("span");info.className="mod-info";
   const name=document.createElement("strong");name.className="mod-name";name.textContent=mod.name;info.append(name);
   const sub=document.createElement("span");sub.className="mod-sub";const sims=document.createElement("span");sims.textContent=mod.games.length===2?"MSFS 2020 / 2024":"MSFS 2024";const click=document.createElement("span");click.textContent="↗";sub.append(sims,click);info.append(sub);b.append(info);
   b.addEventListener("click",()=>openMod(mod));frag.append(b);
 }
 grid.append(frag);grid.hidden=items.length===0;q("#modsEmpty").hidden=items.length!==0;setText("#modsCount",String(items.length));
}
function openMod(mod){
 const dialog=q("#modDialog");if(!dialog)return;
 const img=q("#modImage");img.hidden=!mod.image;if(mod.image)img.src=ASSET+mod.image;
 setText("#modName",mod.name);
 setText("#modKind",(mod.cat==="aircraft"?t("modalAircraft"):mod.cat==="scenery"?t("modalScenery"):t("modalUtility"))+" · "+(mod.games.length===2?"MSFS 2020 / 2024":"MSFS 2024"));
 const out=q("#modOpenSource");out.href=mod.url;
 dialog.showModal();
}
qa(".lang-picker button").forEach(b=>b.addEventListener("click",()=>{lang=b.dataset.lang;localStorage.setItem("fa-website-language",lang);translate()}));
q(".mobile-toggle")?.addEventListener("click",()=>{const nav=q(".navlinks");const open=nav.classList.toggle("open");q(".mobile-toggle").setAttribute("aria-expanded",String(open))});
q("#modsSearch")?.addEventListener("input",e=>{query=e.target.value;renderMods()});
q("#modsGame")?.addEventListener("change",e=>{game=e.target.value;renderMods()});
q("#modsSort")?.addEventListener("change",e=>{sort=e.target.value;renderMods()});
qa(".mod-cat").forEach(b=>b.addEventListener("click",()=>{cat=b.dataset.cat;qa(".mod-cat").forEach(el=>{el.classList.toggle("selected",el===b);el.setAttribute("aria-pressed",String(el===b))});renderMods()}));
q("#modalClose")?.addEventListener("click",()=>q("#modDialog").close());
q("#modDialog")?.addEventListener("click",e=>{if(e.target===e.currentTarget)e.currentTarget.close()});
window.addEventListener("hashchange",setPage);
translate();setPage();
})();