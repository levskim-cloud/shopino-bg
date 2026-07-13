/* =====================================================
   SHOPINO.BG — бекенд (Node.js, без външни библиотеки)
   Стартиране:  node server.js   →  http://localhost:3000
   Витрина:     /            Бекофис: /#admin (парола admin123)
   Данни:       data/store.json (създава се автоматично)
===================================================== */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const STORE = path.join(DATA_DIR, 'store.json');
const PUBLIC_DIR = path.join(ROOT, 'public');

/* ---------- Начални данни ---------- */
const SEED = [
  {name:'Ленена рокля „Аура“',cat:'Жени',price:64.90,old:79.90,sizes:['XS','S','M','L'],stock:14,type:'dress',desc:'Лека ленена рокля с изчистен силует — идеална за лятото.'},
  {name:'Сатенена блуза „Мила“',cat:'Жени',price:39.90,sizes:['S','M','L'],stock:22,type:'shirt',desc:'Мека сатенена блуза с елегантна кройка.'},
  {name:'Панталон с висока талия',cat:'Жени',price:54.90,sizes:['S','M','L','XL'],stock:9,type:'pants',desc:'Прав панталон с висока талия и фин ръб.'},
  {name:'Рокля „Верона“',cat:'Жени',price:74.90,sizes:['XS','S','M'],stock:6,type:'dress',desc:'Вечерна рокля с деликатна драперия.'},
  {name:'Оксфорд риза „Борис“',cat:'Мъже',price:44.90,sizes:['M','L','XL','XXL'],stock:18,type:'shirt',desc:'Класическа оксфорд риза от памук.'},
  {name:'Чино панталон „Марин“',cat:'Мъже',price:49.90,old:59.90,sizes:['M','L','XL'],stock:11,type:'pants',desc:'Универсален чино панталон, slim кройка.'},
  {name:'Поло тениска „Веко“',cat:'Мъже',price:29.90,sizes:['S','M','L','XL','XXL'],stock:30,type:'shirt',desc:'Пике поло от органичен памук.'},
  {name:'Детска блузка „Слънчо“',cat:'Деца',price:19.90,sizes:['98','110','122','134'],stock:25,type:'kid',desc:'Мека памучна блузка за игра всеки ден.'},
  {name:'Детски комплект „Мечо“',cat:'Деца',price:34.90,old:42.90,sizes:['98','110','122'],stock:8,type:'kid',desc:'Комплект от две части — блуза и панталонки.'},
  {name:'Кожена чанта „Тера“',cat:'Аксесоари',price:89.90,sizes:['One size'],stock:5,type:'bag',desc:'Ръчно изработена чанта от естествена кожа.'},
  {name:'Кецове „Урбан“',cat:'Аксесоари',price:59.90,sizes:['38','39','40','41','42','43'],stock:16,type:'shoe',desc:'Изчистени кецове за всекидневието.'},
  {name:'Колан „Класик“',cat:'Аксесоари',price:24.90,sizes:['90','100','110'],stock:20,type:'bag',desc:'Кожен колан с матирана катарама.'}
];
function defaults(){
  return {
    v:3,
    products:SEED.map((p,i)=>({id:'p'+(i+1),img:'',created:Date.now()-i*86400000,active:true,...p})),
    orders:[],invoices:[],users:[],subscribers:[],campaigns:[],messages:{},
    promos:[{id:'pr1',code:'ДОБРЕДОШЛИ10',type:'percent',value:10,minOrder:30,expires:'',limit:0,used:0,active:true}],
    banners:[
      {id:'b1',img:'',title:'Нова колекция за жени',sub:'Разгледай',cat:'Жени',show:true},
      {id:'b2',img:'',title:'До −30% за мъже',sub:'Намаления',cat:'Мъже',show:true},
      {id:'b3',img:'',title:'Аксесоари за финал',sub:'Довърши визията',cat:'Аксесоари',show:true}
    ],
    seqOrder:1000,seqInv:1,seqProd:SEED.length+1,
    theme:{ink:'#2A2A28',tan:'#C2A278',headerBg:'#FFFFFF',btnColor:'#2A2A28',fontPair:'cormorant',logoMode:'svg',logoImg:'',logoH:44,siteName:'SHOPINO',siteTld:'.BG'},
    social:{facebook:'',instagram:'',tiktok:'',youtube:'',viber:''},
    ads:{enabled:false,img:'',link:'',text:'',cat:''},
    seo:{title:'SHOPINO.BG — Онлайн магазин за дрехи',desc:'Онлайн магазин за дрехи и аксесоари — жени, мъже, деца. Доставка с Еконт и Спиди.',keywords:'дрехи, онлайн магазин, мода, рокли, ризи, аксесоари',og:''},
    settings:{
      company:'ШОПИНО БГ ЕООД',eik:'206123456',vat:'BG206123456',mol:'Иван Иванов',
      addr:'гр. София, ул. Търговска 12',iban:'BG80BNBG96611020345678',bank:'Банка ДСК',vatReg:true,
      contactEmail:'office@shopino.bg',contactPhone:'+359880000000',contactCity:'София, България',
      freeShip:50,ship:{eo:2.5,ea:3.9,so:2.6,sa:4.2},lowStock:5,maintenance:false,
      adminPass:'admin123',
      econt:{user:'iasp-dev',pass:'1Asp-dev',demo:true,senderCity:'София',senderPost:'1000',senderStreet:'ул. Търговска 12',senderName:'ШОПИНО БГ ЕООД'},
      speedy:{user:'',pass:'',demo:true},
      vpos:{provider:'Borica / myPOS (демо)',demo:true}
    },
    cms:{
      topbar:'Безплатна доставка над €50 • Връщане до 14 дни • Доставка с Еконт и Спиди',
      heroEyebrow:'Нова колекция · Лято 2026',
      heroTitle:'Стилът е *подбор*, не случайност.',
      heroSub:'Внимателно селектирани дрехи за жени, мъже и деца. Поръчай с или без регистрация — доставяме с Еконт и Спиди до цялата страна.',
      marquee:'SHOPINO.BG ✦ Нова колекция ✦ Безплатна доставка над €50 ✦ ',
      footAbout:'Онлайн магазин за дрехи и аксесоари. Стил, който се закача.',
      footFin:'© 2026 SHOPINO.BG · Всички права запазени',
      nav:[
        {id:'n1',label:'Жени',cat:'Жени',show:true},
        {id:'n2',label:'Мъже',cat:'Мъже',show:true},
        {id:'n3',label:'Деца',cat:'Деца',show:true},
        {id:'n4',label:'Аксесоари',cat:'Аксесоари',show:true}
      ],
      pages:[
        {id:'pg1',title:'Общи условия',show:true,loc:'footer',body:'Настоящите общи условия уреждат отношенията между търговеца и клиентите на онлайн магазина.\n\n1. Поръчки се приемат 24/7 през сайта.\n2. Договорът се счита за сключен след потвърждение на поръчката.\n3. Клиентът има право на отказ в 14-дневен срок съгласно ЗЗП.'},
        {id:'pg2',title:'Политика за поверителност',show:true,loc:'footer',body:'Обработваме лични данни съгласно Регламент (ЕС) 2016/679 (GDPR).\n\nСъбираме само данните, необходими за изпълнение на поръчката.'},
        {id:'pg3',title:'Доставка и връщане',show:true,loc:'both',body:'Доставяме с Еконт и Спиди до офис, автомат или адрес за 1–2 работни дни.\n\nБезплатна доставка над €50. Връщане — до 14 дни.'},
        {id:'pg4',title:'Контакти',show:true,loc:'footer',body:'Имейл: office@shopino.bg\nТелефон: +359 88 000 0000\nАдрес: гр. София'}
      ]
    }
  };
}

/* ---------- Хранилище ---------- */
function deepFill(base, over){
  for(const k in base){
    if(!(k in over)) over[k]=base[k];
    else if(base[k]&&typeof base[k]==='object'&&!Array.isArray(base[k])&&over[k]&&typeof over[k]==='object') deepFill(base[k],over[k]);
  }
  return over;
}
let DB;
function loadDB(){
  try{ DB = JSON.parse(fs.readFileSync(STORE,'utf8')); DB = deepFill(defaults(), DB); }
  catch(e){ DB = defaults(); saveDB(); }
}
let saveT=null;
function saveDB(){
  clearTimeout(saveT);
  saveT=setTimeout(()=>{
    if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true});
    fs.writeFileSync(STORE, JSON.stringify(DB));
  },200);
}

/* ---------- Помощни ---------- */
const hash = p => crypto.scryptSync(String(p),'shopino-salt',32).toString('hex');
const tokens = new Map();   // token -> {type:'admin'|'user', email?}
const newToken = data => { const t=crypto.randomBytes(24).toString('hex'); tokens.set(t,data); return t; };
const bgDate = () => new Date().toLocaleString('bg-BG',{dateStyle:'short',timeStyle:'short'});
const round2 = x => Math.round(x*100)/100;

function json(res,code,obj){
  const b=JSON.stringify(obj);
  res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(b)});
  res.end(b);
}
function readBody(req){
  return new Promise((resolve,reject)=>{
    let d='',size=0;
    req.on('data',c=>{size+=c.length;if(size>8*1024*1024){reject(new Error('too big'));req.destroy();return}d+=c});
    req.on('end',()=>{try{resolve(d?JSON.parse(d):{})}catch(e){reject(e)}});
    req.on('error',reject);
  });
}
function auth(req,type){
  const h=req.headers['authorization']||'';
  const t=h.startsWith('Bearer ')?h.slice(7):null;
  const info=t&&tokens.get(t);
  if(!info||(type&&info.type!==type))return null;
  return info;
}
function publicData(){
  return {
    products: DB.products.filter(p=>p.active!==false),
    cms: DB.cms, theme: DB.theme, seo: DB.seo, banners: DB.banners, social: DB.social, ads: DB.ads,
    settings: {
      freeShip:DB.settings.freeShip, ship:DB.settings.ship, maintenance:DB.settings.maintenance,
      contactEmail:DB.settings.contactEmail, contactPhone:DB.settings.contactPhone, contactCity:DB.settings.contactCity
    }
  };
}
function adminState(){
  const st=JSON.parse(JSON.stringify(DB));
  st.users=st.users.map(u=>({name:u.name,email:u.email,phone:u.phone,created:u.created})); // без пароли
  delete st.settings.adminPassHash;
  return st;
}

/* ---------- Еконт API (реални заявки при demo=false) ---------- */
function econtCall(service, payload){
  const ec=DB.settings.econt;
  const host = ec.demo ? 'demo.econt.com' : 'ee.econt.com';
  const base = ec.demo ? '/ee/services/' : '/services/';
  const body = JSON.stringify(payload);
  const authHdr = 'Basic '+Buffer.from(ec.user+':'+ec.pass).toString('base64');
  return new Promise((resolve,reject)=>{
    const req=https.request({
      host, path: base+service, method:'POST',
      headers:{'Content-Type':'application/json','Authorization':authHdr,'Content-Length':Buffer.byteLength(body)},
      timeout: 20000
    },res=>{
      let d='';res.on('data',c=>d+=c);
      res.on('end',()=>{
        try{
          const j=JSON.parse(d);
          if(j.type&&j.message)return reject(new Error('Econt: '+j.message)); // Error клас на Еконт
          resolve(j);
        }catch(e){reject(new Error('Econt: невалиден отговор ('+res.statusCode+')'))}
      });
    });
    req.on('timeout',()=>{req.destroy();reject(new Error('Econt: изтече времето за връзка'))});
    req.on('error',e=>reject(new Error('Econt: '+e.message)));
    req.write(body);req.end();
  });
}
function buildEcontLabel(order){
  const ec=DB.settings.econt;
  const office = order.delivery.method==='До офис';
  const cityName = (order.delivery.place||'').split(',')[0].trim();
  const label = {
    senderClient:{ name: ec.senderName, phones:[DB.settings.contactPhone] },
    senderAddress:{ city:{ country:{code3:'BGR'}, name:ec.senderCity, postCode:ec.senderPost }, street: ec.senderStreet },
    receiverClient:{ name: order.customer.name, phones:[order.customer.phone] },
    packCount:1, shipmentType:'PACK', weight:1,
    shipmentDescription:'Дрехи — поръчка '+order.num,
    services:{}
  };
  if(order.payment==='Наложен платеж'){
    label.services.cdAmount = order.total;
    label.services.cdType = 'get';
    label.services.cdCurrency = 'EUR'; // от 2026 пратките са в евро
  }
  if(office){
    // при реална интеграция офис кодът идва от Nomenclatures.getOffices; тук приемаме свободен текст
    label.receiverAddress = { city:{ country:{code3:'BGR'}, name: cityName }, fullAddress: order.delivery.place };
  } else {
    label.receiverAddress = { city:{ country:{code3:'BGR'}, name: cityName }, fullAddress: order.delivery.place };
  }
  return { label, mode:'create' };
}

/* ---------- Статични файлове ---------- */
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.webp':'image/webp'};
function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function serveStatic(req,res,urlPath){
  let p = urlPath==='/' ? '/index.html' : urlPath;
  p = path.normalize(p).replace(/^(\.\.[\/\\])+/,'');
  const file = path.join(PUBLIC_DIR,p);
  if(!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }
  fs.readFile(file,(err,buf)=>{
    if(err){ res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}); return res.end('404'); }
    const ext=path.extname(file);
    if(p==='/index.html'){
      // SEO инжекция от бекофиса
      let html=buf.toString('utf8');
      html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>'+esc(DB.seo.title)+'</title>');
      html=html.replace(/<meta name="description"[^>]*>/,'<meta name="description" content="'+esc(DB.seo.desc)+'">');
      html=html.replace(/<meta name="keywords"[^>]*>/,'<meta name="keywords" content="'+esc(DB.seo.keywords)+'">');
      html=html.replace(/<meta property="og:title"[^>]*>/,'<meta property="og:title" content="'+esc(DB.seo.title)+'">');
      html=html.replace(/<meta property="og:description"[^>]*>/,'<meta property="og:description" content="'+esc(DB.seo.desc)+'">');
      res.writeHead(200,{'Content-Type':MIME['.html']});
      return res.end(html);
    }
    res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream'});
    res.end(buf);
  });
}

/* ---------- Рутер ---------- */
const server=http.createServer(async (req,res)=>{
  const u=new URL(req.url,'http://x');
  const p=u.pathname, m=req.method;
  try{
    /* --- SEO файлове --- */
    if(p==='/robots.txt'){res.writeHead(200,{'Content-Type':'text/plain'});return res.end('User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n')}
    if(p==='/sitemap.xml'){
      const host=(req.headers.host||'localhost');
      const urls=['/'].concat(DB.cms.pages.filter(x=>x.show).map(x=>'/#page-'+x.id));
      const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
        urls.map(x=>'  <url><loc>https://'+host+x+'</loc></url>').join('\n')+'\n</urlset>';
      res.writeHead(200,{'Content-Type':'application/xml'});return res.end(xml);
    }
    if(!p.startsWith('/api/')) return serveStatic(req,res,p);

    /* ================= ПУБЛИЧНИ ================= */
    if(p==='/api/public'&&m==='GET') return json(res,200,publicData());

    if(p==='/api/newsletter'&&m==='POST'){
      const {email}=await readBody(req);
      if(!/.+@.+\..+/.test(email||''))return json(res,400,{error:'Невалиден имейл.'});
      if(!DB.subscribers.find(s=>s.email===email))DB.subscribers.push({email,date:new Date().toLocaleDateString('bg-BG')});
      saveDB();return json(res,200,{ok:true});
    }

    if(p==='/api/promo/check'&&m==='POST'){
      const {code,subtotal}=await readBody(req);
      const pr=DB.promos.find(x=>x.code.toUpperCase()===(code||'').trim().toUpperCase());
      if(!pr)return json(res,400,{error:'Невалиден код.'});
      if(!pr.active)return json(res,400,{error:'Кодът е деактивиран.'});
      if(pr.expires&&new Date(pr.expires+'T23:59:59')<new Date())return json(res,400,{error:'Кодът е изтекъл.'});
      if(pr.limit>0&&pr.used>=pr.limit)return json(res,400,{error:'Кодът е изчерпан.'});
      if((subtotal||0)<pr.minOrder)return json(res,400,{error:'Кодът важи за поръчки над €'+pr.minOrder.toFixed(2)+'.'});
      return json(res,200,{promo:{id:pr.id,code:pr.code,type:pr.type,value:pr.value,minOrder:pr.minOrder}});
    }

    if(p==='/api/orders'&&m==='POST'){
      if(DB.settings.maintenance)return json(res,400,{error:'Магазинът е временно в профилактика.'});
      const b=await readBody(req);
      if(!b.customer||!b.customer.name||!b.customer.phone||!/.+@.+\..+/.test(b.customer.email||''))
        return json(res,400,{error:'Липсват данни на клиента.'});
      if(!Array.isArray(b.items)||!b.items.length)return json(res,400,{error:'Празна кошница.'});
      // цените се смятат на сървъра — клиентът праща само id/размер/бройка
      let sub=0; const items=[];
      for(const it of b.items){
        const pr=DB.products.find(x=>x.id===it.pid&&x.active!==false);
        if(!pr)return json(res,400,{error:'Невалиден продукт.'});
        const qty=Math.max(1,Math.min(99,parseInt(it.qty)||1));
        if(pr.stock<qty)return json(res,400,{error:'„'+pr.name+'“ няма достатъчна наличност.'});
        items.push({pid:pr.id,name:pr.name,size:String(it.size||''),qty,price:pr.price});
        sub+=pr.price*qty;
      }
      sub=round2(sub);
      // промо
      let discount=0,promoCode=null,promoRef=null;
      if(b.promoCode){
        promoRef=DB.promos.find(x=>x.code.toUpperCase()===String(b.promoCode).toUpperCase()&&x.active);
        if(promoRef&&(!promoRef.expires||new Date(promoRef.expires+'T23:59:59')>=new Date())&&(promoRef.limit===0||promoRef.used<promoRef.limit)&&sub>=promoRef.minOrder){
          discount=round2(Math.min(sub,promoRef.type==='percent'?sub*promoRef.value/100:promoRef.value));
          promoCode=promoRef.code;
        }
      }
      // доставка
      const kind=String(b.delivery&&b.delivery.kind||'econt-office');
      const sh=DB.settings.ship;
      let ship = kind==='econt-office'?sh.eo:kind==='speedy-office'?sh.so:kind==='econt-addr'?sh.ea:sh.sa;
      if(sub-discount>=DB.settings.freeShip)ship=0;
      ship=round2(ship);
      const total=round2(sub-discount+ship);
      const num='SHP-'+(++DB.seqOrder);
      const order={
        id:'o'+Date.now()+Math.floor(Math.random()*1000),num,
        date:bgDate(),ts:Date.now(),
        customer:{name:String(b.customer.name).slice(0,120),phone:String(b.customer.phone).slice(0,40),email:String(b.customer.email).slice(0,120)},
        delivery:{carrier:kind.startsWith('econt')?'Еконт':'Спиди',method:kind.endsWith('office')?'До офис':'До адрес',
          place:String(b.delivery.place||'').slice(0,240),price:ship,note:String(b.delivery.note||'').slice(0,500)},
        payment:b.payment==='card'?'Карта онлайн':'Наложен платеж',
        items,sub,discount,promo:promoCode,total,status:'Нова',invoiceId:null,waybill:null
      };
      items.forEach(it=>{const pr=DB.products.find(x=>x.id===it.pid);pr.stock=Math.max(0,pr.stock-it.qty)});
      if(promoRef&&discount>0)promoRef.used++;
      DB.orders.unshift(order);
      // профил по желание
      let token=null;
      if(b.makeAcc&&b.pass&&!DB.users.find(x=>x.email===order.customer.email)){
        DB.users.push({name:order.customer.name,email:order.customer.email,passHash:hash(b.pass),phone:order.customer.phone,created:Date.now()});
        token=newToken({type:'user',email:order.customer.email});
      }
      saveDB();
      return json(res,200,{num,total,token});
    }

    if(p==='/api/auth/register'&&m==='POST'){
      const {name,email,pass}=await readBody(req);
      if(!name||!/.+@.+\..+/.test(email||'')||!pass)return json(res,400,{error:'Попълни име, имейл и парола.'});
      if(DB.users.find(u=>u.email===email))return json(res,400,{error:'Вече има профил с този имейл.'});
      DB.users.push({name,email,passHash:hash(pass),phone:'',created:Date.now()});saveDB();
      return json(res,200,{token:newToken({type:'user',email}),name});
    }
    if(p==='/api/auth/login'&&m==='POST'){
      const {email,pass}=await readBody(req);
      const u=DB.users.find(u=>u.email===email&&u.passHash===hash(pass||''));
      if(!u)return json(res,401,{error:'Грешен имейл или парола.'});
      return json(res,200,{token:newToken({type:'user',email}),name:u.name});
    }
    if(p==='/api/my/orders'&&m==='GET'){
      const a=auth(req,'user');if(!a)return json(res,401,{error:'Нужен е вход.'});
      return json(res,200,{orders:DB.orders.filter(o=>o.customer.email===a.email)});
    }
    if(p==='/api/my/messages'&&m==='GET'){
      const a=auth(req,'user');if(!a)return json(res,401,{error:'Нужен е вход.'});
      return json(res,200,{messages:DB.messages[a.email]||[]});
    }

    /* ================= АДМИН ================= */
    if(p==='/api/admin/login'&&m==='POST'){
      const {pass}=await readBody(req);
      if(pass!==DB.settings.adminPass)return json(res,401,{error:'Грешна парола.'});
      return json(res,200,{token:newToken({type:'admin'})});
    }
    // всичко надолу изисква админ токен
    if(p.startsWith('/api/admin/')){
      if(!auth(req,'admin'))return json(res,401,{error:'Нужен е вход в бекофиса.'});
    }
    if(p==='/api/admin/state'&&m==='GET')return json(res,200,adminState());

    if(p==='/api/admin/data'&&m==='PUT'){
      const b=await readBody(req);
      for(const k of ['products','promos','cms','theme','seo','banners','social','ads'])if(b[k]!==undefined)DB[k]=b[k];
      if(b.settings){const keepPass=DB.settings.adminPass;DB.settings=b.settings;if(!DB.settings.adminPass)DB.settings.adminPass=keepPass}
      if(b.seqProd)DB.seqProd=b.seqProd;
      if(b.seqInv)DB.seqInv=b.seqInv;
      saveDB();return json(res,200,{ok:true});
    }

    let mm;
    if((mm=p.match(/^\/api\/admin\/orders\/([^/]+)$/))&&m==='PATCH'){
      const o=DB.orders.find(o=>o.id===mm[1]);if(!o)return json(res,404,{error:'Няма такава поръчка.'});
      const b=await readBody(req);
      if(b.status&&['Нова','Потвърдена','На изчакване','Изпратена','Доставена','Отказана'].includes(b.status))o.status=b.status;
      saveDB();return json(res,200,{order:o});
    }

    if((mm=p.match(/^\/api\/admin\/orders\/([^/]+)\/waybill$/))&&m==='POST'){
      const o=DB.orders.find(o=>o.id===mm[1]);if(!o)return json(res,404,{error:'Няма такава поръчка.'});
      if(o.waybill)return json(res,400,{error:'Вече има товарителница.'});
      if(o.delivery.carrier==='Еконт'&&!DB.settings.econt.demo){
        // РЕАЛНА заявка към Еконт
        const payload=buildEcontLabel(o);
        const r=await econtCall('Shipments/LabelService.createLabel.json',payload);
        const lb=r&&r.label?r.label:{};
        o.waybill={carrier:'Еконт',num:String(lb.shipmentNumber||lb.barcode||'—'),demo:false,date:bgDate(),pdf:lb.pdfURL||''};
      }else{
        // ДЕМО (и за Спиди, докато не е вързан)
        const num=(o.delivery.carrier==='Еконт'?'105':'80')+String(Math.floor(1e7+Math.random()*9e7));
        o.waybill={carrier:o.delivery.carrier,num,demo:true,date:bgDate(),pdf:''};
      }
      if(o.status==='Нова'||o.status==='Потвърдена')o.status='Изпратена';
      saveDB();return json(res,200,{order:o});
    }

    if((mm=p.match(/^\/api\/admin\/orders\/([^/]+)\/invoice$/))&&m==='POST'){
      const o=DB.orders.find(o=>o.id===mm[1]);if(!o)return json(res,404,{error:'Няма такава поръчка.'});
      if(o.invoiceId)return json(res,400,{error:'Вече има фактура.'});
      const {recipient}=await readBody(req);
      const num=String(DB.seqInv++).padStart(10,'0');
      const base=round2(o.total/1.2),vat=round2(o.total-base);
      const inv={id:'inv'+Date.now(),num,date:new Date().toLocaleDateString('bg-BG'),orderNum:o.num,orderId:o.id,
        recipient:{name:String(recipient&&recipient.name||o.customer.name),eik:String(recipient&&recipient.eik||''),vat:String(recipient&&recipient.vat||''),addr:String(recipient&&recipient.addr||o.delivery.place)},
        items:[...o.items.map(i=>({name:i.name+' (размер '+i.size+')',qty:i.qty,price:i.price})),
          ...(o.discount?[{name:'Търговска отстъпка (код '+(o.promo||'')+')',qty:1,price:-o.discount}]:[]),
          ...(o.delivery.price?[{name:'Доставка '+o.delivery.carrier,qty:1,price:o.delivery.price}]:[])],
        base,vat,total:o.total,payment:o.payment};
      DB.invoices.unshift(inv);o.invoiceId=inv.id;saveDB();
      return json(res,200,{invoice:inv});
    }

    if(p==='/api/admin/campaign'&&m==='POST'){
      const b=await readBody(req);
      if(!b.subject||!b.body)return json(res,400,{error:'Липсва тема или съдържание.'});
      const msg={date:bgDate(),subject:String(b.subject).slice(0,200),body:String(b.body).slice(0,4000)};
      let sent=0;
      if(b.audience==='one'&&b.email){(DB.messages[b.email]=DB.messages[b.email]||[]).unshift(msg);sent=1}
      else if(b.audience==='subs'){sent=DB.subscribers.length /* имейл каналът чака SMTP връзка */}
      else{DB.users.forEach(u=>{(DB.messages[u.email]=DB.messages[u.email]||[]).unshift(msg);sent++})}
      DB.campaigns.unshift({id:'c'+Date.now(),date:msg.date,subject:msg.subject,body:msg.body,channel:b.channel||'inbox',audience:b.audience||'users',sent});
      // Място за реален имейл: тук се извиква SMTP услуга (Brevo/Mailgun) с API ключ.
      saveDB();return json(res,200,{ok:true,sent});
    }

    if(p==='/api/admin/reset'&&m==='POST'){DB=defaults();saveDB();return json(res,200,{ok:true})}

    return json(res,404,{error:'Няма такъв адрес.'});
  }catch(e){
    return json(res,500,{error:e.message||'Вътрешна грешка.'});
  }
});
loadDB();
server.listen(PORT,()=>console.log('SHOPINO.BG върви на http://localhost:'+PORT+'  ·  Бекофис: http://localhost:'+PORT+'/#admin'));
