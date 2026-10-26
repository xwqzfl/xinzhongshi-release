/*XZS_UPDATER:21*/
/* Shared canonical forms: browser updater and offline builder must agree. */
function xzsModel19() {
  const norm = s => String(s == null ? '' : s).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  function fnv(s) { let h=2166136261; for(let i=0;i<s.length;i++) h=Math.imul(h^s.charCodeAt(i),16777619)>>>0; return h.toString(16).padStart(8,'0'); }
  const clone = v => decode(encode(v));
  const encode = v => JSON.stringify(v, (k,x)=>Object.prototype.toString.call(x)==='[object RegExp]'?{$xzsRegex:x.source,flags:x.flags}:x);
  const decode = s => JSON.parse(s,(k,x)=>x&&typeof x.$xzsRegex==='string'?new RegExp(x.$xzsRegex,x.flags):x);
  function stable(v) { if(Array.isArray(v))return '['+v.map(stable).join(',')+']'; if(v&&typeof v==='object')return '{'+Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}'; return JSON.stringify(v); }
  const hash = x => fnv(stable(x));
  const scriptHash = s => fnv(norm(s));
  // Local SHA-256 fallback for ordinary HTTP LAN access, where SubtleCrypto is unavailable.
  function sha256Bytes(bytes) {
    const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    const h=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
    const padded=new Uint8Array(Math.ceil((bytes.length+9)/64)*64);padded.set(bytes);padded[bytes.length]=128;
    const v=new DataView(padded.buffer),bits=bytes.length*8;v.setUint32(padded.length-8,Math.floor(bits/4294967296));v.setUint32(padded.length-4,bits>>>0);
    const w=new Uint32Array(64),ror=(n,b)=>(n>>>b)|(n<<(32-b));
    for(let offset=0;offset<padded.length;offset+=64){
      for(let i=0;i<16;i++)w[i]=v.getUint32(offset+i*4);
      for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2];w[i]=(w[i-16]+(ror(x,7)^ror(x,18)^(x>>>3))+w[i-7]+(ror(y,17)^ror(y,19)^(y>>>10)))>>>0;}
      let [a,b,c,d,e,f,g,z]=h;
      for(let i=0;i<64;i++){const t1=(z+(ror(e,6)^ror(e,11)^ror(e,25))+((e&f)^(~e&g))+K[i]+w[i])>>>0,t2=((ror(a,2)^ror(a,13)^ror(a,22))+((a&b)^(a&c)^(b&c)))>>>0;z=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
      [a,b,c,d,e,f,g,z].forEach((x,i)=>h[i]=(h[i]+x)>>>0);
    }
    return Array.from(h,x=>x.toString(16).padStart(8,'0')).join('');
  }
  const build = s => (/\/\*XZS_BUILD:([\w.-]+)\*\//.exec(s||'')||[])[1]||'';
  const number = s => Number((/-(\d{14})$/.exec(s||'')||[])[1]||0);
  const mark = s => Number((/\/\*XZS_UPDATER:(\d+)\*\//.exec(s||'')||[])[1]||0);
  const ext = c => c.extensions || (c.data&&c.data.extensions) || {};
  const scripts = c => (ext(c).tavern_helper||{}).scripts || [];
  const rxName = r => r.script_name == null ? r.scriptName : r.script_name;
  function rx(r) {
    // Player enablement and ID are deliberately not owned by the publisher.
    const source={};for(const k of ['user_input','ai_output','slash_command','world_info','reasoning'])source[k]=!!r.source?.[k];
    return {script_name:rxName(r),find_regex:r.find_regex||'',replace_string:r.replace_string||'',trim_strings:r.trim_strings||[],source,destination:{display:!!r.destination?.display,prompt:!!r.destination?.prompt},run_on_edit:!!r.run_on_edit,min_depth:r.min_depth??null,max_depth:r.max_depth??null};
  }
  const fields = c => ({version:c.version||'',first_messages:(c.first_messages||[]).map(s=>String(s).replace(/\r\n?/g,'\n')),creator:c.creator||'',creator_notes:c.creator_notes||'',description:c.description||''});
  // Preserve the v17 wire hash; compare host text through a separate canonical form.
  // Only line endings and text boundary whitespace are insignificant, never internal text/order.
  const canonicalFields = c => Object.fromEntries(Object.entries(fields(c)).map(([k,v])=>[k,Array.isArray(v)?v.map(norm):norm(v)]));
  const fieldHashes = c => Object.fromEntries(Object.entries(canonicalFields(c)).map(([k,v])=>[k,hash(v)]));
  function fieldDiff(c,expected) {
    const actual=fieldHashes(c);
    return Object.keys(actual).filter(k=>actual[k]!==expected[k]);
  }
  function fieldsReadable(c) {
    return !!c&&Array.isArray(c.first_messages)&&c.first_messages.length>0&&c.first_messages.every(s=>typeof s==='string')&&['version','creator','creator_notes','description'].every(k=>typeof c[k]==='string');
  }
  const implicit={addMemo:true,matchPersonaDescription:false,matchCharacterDescription:false,matchCharacterPersonality:false,matchCharacterDepthPrompt:false,matchScenario:false,matchCreatorNotes:false,group:'',groupOverride:false,groupWeight:100,caseSensitive:null,matchWholeWords:null,useGroupScoring:null,automationId:'',ignoreBudget:false,outletName:'',triggers:[],characterFilter:{isExclude:false,names:[],tags:[]}};
  function worldEntry(e) {
    let v;
    if(e.strategy) v=clone(e);
    else v={uid:e.uid,name:e.comment||'',enabled:!e.disable,
      strategy:{type:e.constant?'constant':e.vectorized?'vectorized':'selective',keys:e.key||[],keys_secondary:{logic:['and_any','not_all','not_any','and_all'][e.selectiveLogic||0],keys:e.keysecondary||[]},scan_depth:e.scanDepth==null?'same_as_global':e.scanDepth},
      position:{type: ['before_character_definition','after_character_definition','before_author_note','after_author_note','at_depth','before_example_messages','after_example_messages','outlet'][e.position],role:['system','user','assistant'][e.role||0],depth:e.depth,order:e.order},content:e.content||'',probability:e.useProbability?e.probability:100,
      recursion:{prevent_incoming:e.excludeRecursion,prevent_outgoing:e.preventRecursion,delay_until:typeof e.delayUntilRecursion==='number'&&e.delayUntilRecursion>0?e.delayUntilRecursion:null},
      effect:{sticky:e.sticky>0?e.sticky:null,cooldown:e.cooldown>0?e.cooldown:null,delay:e.delay>0?e.delay:null}};
    v.content=String(v.content||'').replace(/\r\n?/g,'\n');
    v.strategy.keys=(v.strategy.keys||[]).map(String);v.strategy.keys_secondary.keys=(v.strategy.keys_secondary.keys||[]).map(String);
    for(const k of Object.keys(implicit))v[k]=e[k]===undefined?clone(implicit[k]):e[k];
    if(e.extra)v.extra=e.extra;
    return v;
  }
  const world = entries => entries.map(worldEntry).sort((a,b)=>a.uid-b.uid);
  function want(c,d) {
    const ss=scripts(c);
    if(d.kind==='script') {const all=ss.filter(s=>s.name===d.name);return all.length>0&&all.every(s=>scriptHash(s.content)===d.contentHash);}
    if(d.kind==='pack')return d.items.every(i=>{const all=ss.filter(s=>s.name===i.name);if(i.retired)return all.length===0;return all.length>0&&all.every(s=>scriptHash(s.content)===i.contentHash)&&!(i.replaces||[]).some(n=>ss.some(s=>s.name===n))});
    if(d.kind==='regex')return d.items.every(i=>{const all=(ext(c).regex_scripts||[]).filter(r=>rxName(r)===i.name);return all.length>0&&all.every(r=>hash(rx(r))===i.contentHash)});
    if(d.kind==='fields')return hash(fields(c))===d.contentHash;
    return false;
  }
  function putScript(c,item,enabled) {
    const e=ext(c);if(!c.extensions&&!c.data?.extensions)c.extensions=e;
    e.tavern_helper=e.tavern_helper||{};const ss=e.tavern_helper.scripts=e.tavern_helper.scripts||[];
    const found=ss.filter(s=>s.name===item.name);
    if(found.length)found.forEach(s=>{s.content=item.content;if(item.button)s.button=clone(item.button);if(item.info)s.info=item.info;if(item.export_with)s.export_with=clone(item.export_with);});
    else ss.push({type:'script',name:item.name,content:item.content,enabled:!!enabled,id:item.id&&!ss.some(s=>s.id===item.id)?item.id:'xzs-'+Date.now()+'-'+Math.random().toString(36).slice(2),info:item.info||'新中市组件',data:clone(item.data||{}),button:clone(item.button||{enabled:true,buttons:[]}),export_with:clone(item.export_with||{data:true,button:true})});
  }
  const ownedNames=d=>d.kind==='script'?[d.name]:d.kind==='pack'?d.items.flatMap(i=>[i.name,...(i.replaces||[])]):[];
  function apply(c,d,text) {
    if(d.kind==='script')putScript(c,{name:d.name,content:text},true);
    if(d.kind==='pack'){
      const items=JSON.parse(text).scripts, before=scripts(c).slice(), retired=new Set(items.filter(i=>i.retired).map(i=>i.name));
      for(const item of items)for(const n of item.replaces||[])retired.add(n);
      const e=ext(c);if(!c.extensions&&!c.data?.extensions)c.extensions=e;e.tavern_helper=e.tavern_helper||{};
      e.tavern_helper.scripts=before.filter(s=>!retired.has(s.name));
      for(const item of items.filter(i=>!i.retired)){
        const replacing=(item.replaces||[]).some(n=>before.some(s=>s.name===n));
        putScript(c,item,false);
        if(replacing)scripts(c).filter(s=>s.name===item.name).forEach(s=>s.enabled=false);
      }
    }
    if(d.kind==='fields'){const f=JSON.parse(text);for(const k of Object.keys(fields(f)))if(f[k]!=null)c[k]=clone(f[k]);}
    if(d.kind==='regex'){
      const e=ext(c);if(!c.extensions&&!c.data?.extensions)c.extensions=e;
      let list=e.regex_scripts||[];for(const r of JSON.parse(text).scripts){const hits=list.filter(s=>rxName(s)===rxName(r));if(hits.length)list=list.map(s=>rxName(s)===rxName(r)?{...clone(r),id:s.id,enabled:s.enabled}:s);else list.push(clone(r));}e.regex_scripts=list;
    }return c;
  }
  return {norm,fnv,clone,encode,decode,stable,hash,scriptHash,sha256Bytes,build,number,mark,ext,scripts,rxName,rx,fields,canonicalFields,fieldHashes,fieldDiff,fieldsReadable,worldEntry,world,want,apply,ownedNames};
}


/* Source is bundled with model.cjs by build.cjs. No runtime dependency download. */
(function bootstrap() {
  'use strict';
  const owner=window;let parent=owner;
  try{while(parent.parent&&parent.parent!==parent&&parent.parent.document)parent=parent.parent;}catch(_){}
  // The updater changes its own script. Keep the transaction, promises and timers
  // in the top page's realm so removing the old script iframe cannot orphan them.
  const start=parent.Function('createModel','return ('+runtime.toString()+')(createModel);');
  const createModel=parent.Function('return ('+xzsModel19.toString()+');')();
  const service=start(createModel);owner.__xzsUpdater=service;
  try{owner.replaceScriptButtons?.([{name:'检查更新',visible:true},{name:'恢复更新备份',visible:true}]);owner.eventOnButton?.('检查更新',()=>service.check(true));owner.eventOnButton?.('恢复更新备份',service.recover);}catch(_){}
  function runtime(createModel) {
  'use strict';
  const M=createModel();
  const NAME='新中市更新器', WB_MARK='【系统】世界书版本', UPDATER_MARK=21;
  const CONFIG={connect:20000,idle:45000,total:600000,writeNotice:20000,readNotice:5000,readTimeout:25000,auto:8000};
  let host=window;
  try { while(host.parent&&host.parent!==host&&host.parent.document)host=host.parent; }catch(_){}
  const timer=host.setTimeout.bind(host),clear=host.clearTimeout.bind(host);
  const previous=host.__xzsUpdaterRuntime17;
  if(previous?.busy){
    // Never steal an in-flight legacy writer. Its own iframe may already have
    // disappeared; let the player reload and reconcile the persisted journal.
    if(!previous.durable&&!previous.handoffTimer)previous.handoffTimer=timer(()=>{
      if(!previous.busy||previous.stage!=='verify'||!previous.message.includes('保存更新器'))return;
      const el=host.document?.getElementById('xzs-update-status17');if(!el)return;
      el.querySelector('.message').textContent='新版更新器已载入，旧版的保存确认未能结束。\n请整页刷新，再点“检查更新”核对保存结果。备份仍保留。';
      el.querySelectorAll('button').forEach(b=>{if(b.dataset.action==='reload'){b.disabled=false;b.onclick=()=>host.location.reload();}});
    },CONFIG.readNotice);
    window.__xzsUpdater=previous.api;return previous.api;
  }
  if(previous?.autoTimer)clear(previous.autoTimer);
  const R={durable:true,version:UPDATER_MARK,busy:false,cancelled:false,stage:'idle',message:'尚未检查',cache:previous?.cache||new Map(),loaded:0,total:0,controller:null,api:null};
  host.__xzsUpdaterRuntime17=R;
  const bases=[
    ['https://raw.githubusercontent.com/xwqzfl/xinzhongshi-release/main/',''],
    ['https://api.github.com/repos/xwqzfl/xinzhongshi-release/contents/','api'],
    ['https://fastly.jsdelivr.net/gh/xwqzfl/xinzhongshi-release@main/',''],
    ['https://cdn.jsdelivr.net/gh/xwqzfl/xinzhongshi-release@main/',''],
    ['https://ghproxy.net/https://raw.githubusercontent.com/xwqzfl/xinzhongshi-release/main/',''],
    ['https://gh-proxy.com/https://raw.githubusercontent.com/xwqzfl/xinzhongshi-release/main/','']
  ];
  function api(n,required=true){const f=host.TavernHelper?.[n]||window[n];if(typeof f==='function')return f.bind(host.TavernHelper||window);if(required)throw Error('酒馆助手缺少接口：'+n);return null;}
  function context(){try{return host.SillyTavern?.getContext?.()||{};}catch(_){return {};}}
  function identity(){const c=context();return JSON.stringify([api('getCurrentCharacterName',false)?.()||c.name2||'',c.getCurrentChatId?.()||c.chatId||c.chat_id||'',c.chatMetadata?.world_info||'']);}
  function binding(){const ctx=context();let chat=ctx.chatMetadata?.world_info; if(chat===undefined&&!ctx.chatMetadata)chat=api('getChatWorldbookName',false)?.('current');return {global:api('getGlobalWorldbookNames',false)?.()||[],char:api('getCharWorldbookNames',false)?.('current')||{},chat:chat||''};}
  function guard(s){if(identity()!==s.identity||M.stable(binding())!==s.binding)throw Error('角色、聊天或世界书绑定已改变。已停止继续写入，请回到原聊天检查。');}
  function mb(n){return (n/1048576).toFixed(2)+' MiB';}
  function panel(){
    const doc=host.document;if(!doc?.body)return null;
    let el=doc.getElementById('xzs-update-status17');
    if(!el){el=doc.createElement('section');el.id='xzs-update-status17';el.setAttribute('role','status');el.style.cssText='position:fixed;inset:auto 16px 16px auto;margin:0;z-index:2147483600;width:min(400px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;box-sizing:border-box;padding:16px;border:1px solid #66849b;border-radius:12px;background:#152435;color:#f4f7fa;box-shadow:0 8px 28px #0008;font:14px/1.55 system-ui;white-space:normal;';
      const title=doc.createElement('strong');title.textContent='新中市更新';el.appendChild(title);
      const msg=doc.createElement('div');msg.className='message';msg.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0';el.appendChild(msg);
      const prog=doc.createElement('progress');prog.max=100;prog.style.width='100%';el.appendChild(prog);
      const detail=doc.createElement('div');detail.className='detail';el.appendChild(detail);
      const actions=doc.createElement('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin-top:10px';el.appendChild(actions);
      for(const [label,action]of [['重试检查','retry'],['取消下载','cancel'],['恢复备份','recover'],['导出备份','export'],['刷新页面','reload'],['收起','close']]){const b=doc.createElement('button');b.textContent=label;b.dataset.action=action;b.style.cssText='padding:5px 9px;border:1px solid #7893a5;border-radius:6px;color:inherit;background:#283e53;cursor:pointer';actions.appendChild(b);}
      if(typeof el.showPopover==='function')el.setAttribute('popover','manual');doc.body.appendChild(el);
    }
    el.hidden=false;if(typeof el.showPopover==='function'&&!el.matches(':popover-open')){try{el.showPopover();}catch(_){}}
    el.querySelector('.message').textContent=R.message;
    const p=el.querySelector('progress');if(R.stage==='download'&&R.total>0)p.value=Math.min(100,R.loaded/R.total*100);else if(R.stage==='done')p.value=100;else p.removeAttribute('value');
    el.querySelector('.detail').textContent=R.stage==='download'?mb(R.loaded)+' / '+mb(R.total)+' · '+Math.min(100,Math.floor(R.loaded/Math.max(1,R.total)*100))+'%（下载）':(R.busy?'处理中，完成前请保持此页面打开。':'');
    el.querySelectorAll('button').forEach(b=>{
      const a=b.dataset.action;b.disabled=(R.busy&&a!=='cancel'&&a!=='close')||(a==='cancel'&&R.stage!=='download'&&R.stage!=='check');
      b.onclick=()=>{if(a==='retry')check(true);if(a==='cancel'){R.cancelled=true;R.controller?.abort();}if(a==='recover')recover();if(a==='export')exportBackup();if(a==='reload')host.location.reload();if(a==='close')el.hidden=true;};
    });return el;
  }
  function status(stage,msg){R.stage=stage;R.message=msg;panel();try{host.console.log('[新中市更新17]',stage,msg);}catch(_){} }
  function db(){return new Promise((resolve,reject)=>{if(!host.indexedDB)return reject(Error('浏览器不支持可靠备份存储，已取消写入'));const q=host.indexedDB.open('xzs-updater-safe-v17',1);q.onupgradeneeded=()=>q.result.createObjectStore('records');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);q.onblocked=()=>reject(Error('备份数据库被占用'));});}
  async function storage(key,value){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('records',value===undefined?'readonly':'readwrite'),s=t.objectStore('records');const q=value===undefined?s.get(key):s.put(M.encode(value),key);let out;q.onsuccess=()=>out=q.result;t.oncomplete=()=>{d.close();resolve(value===undefined?(out?M.decode(out):null):value)};t.onerror=t.onabort=()=>{d.close();reject(t.error||Error('备份存储失败'))};});}
  function stop(){if(R.cancelled)throw Error('下载已取消，尚未提交本次更新');}
  async function sha(text){const bytes=new TextEncoder().encode(text);if(!host.crypto?.subtle)return M.sha256Bytes(bytes);const h=await host.crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(h),x=>x.toString(16).padStart(2,'0')).join('');}
  async function fetchOne(base,path,d){
    stop();const ac=new AbortController();R.controller=ac;
    let idle,limit,connect,reason='',received=0;const before=R.loaded;
    const abort=why=>{reason=why;ac.abort();};
    connect=timer(()=>abort('连接超时'),CONFIG.connect);limit=timer(()=>abort('下载超过最长等待时间'),CONFIG.total);
    function tick(){clear(idle);idle=timer(()=>abort('下载长时间无进展'),CONFIG.idle);}
    try{
      const url=base[0]+path+(base[1]==='api'?'?ref=main':'');
      const response=await host.fetch(url,{cache:'no-store',signal:ac.signal,headers:base[1]==='api'?{Accept:'application/vnd.github.raw'}:{}});
      clear(connect);if(!response.ok)throw Error('HTTP '+response.status);tick();
      let text;
      if(response.body?.getReader){const reader=response.body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});const chunks=[];while(true){const chunk=await reader.read();if(chunk.done)break;stop();received+=chunk.value.byteLength;if(received>(d?.bytes||2097152))throw Error('下载内容超过清单大小限制');chunks.push(decoder.decode(chunk.value,{stream:true}));tick();if(d){R.loaded=before+received;panel();}}chunks.push(decoder.decode());text=chunks.join('');}
      else {text=await response.text();received=new TextEncoder().encode(text).length;if(received>(d?.bytes||2097152))throw Error('下载内容超过大小限制');}
      stop();if(d){if(received!==d.bytes)throw Error('文件长度不匹配');if(await sha(text)!==d.sha256)throw Error('文件SHA-256校验失败');R.loaded=before+received;panel();}return text;
    }catch(e){R.loaded=before;stop();throw Error(reason||e.message);}finally{clear(connect);clear(idle);clear(limit);R.controller=null;}
  }
  async function download(path,d,validate){
    if(d&&R.cache.has(d.sha256)){R.loaded+=d.bytes;panel();return R.cache.get(d.sha256);}
    let last;
    for(let i=0;i<bases.length;i++){stop();status(d?'download':'check',(d?'正在下载 '+d.label:'正在检查版本')+'\n更新源 '+(i+1)+'/'+bases.length+(last?' · 上个源：'+last:''));try{const t=await fetchOne(bases[i],path,d);if(validate)await validate(t);stop();if(d)R.cache.set(d.sha256,t);return t;}catch(e){last=e.message;stop();}}
    throw Error('所有更新源失败：'+last);
  }
  function manifest(text){
    const m=JSON.parse(text);if(m.schema!==2||!M.number(m.release)||!m.worldbookName||!m.worldbookNamePrefix||!m.components)throw Error('不支持的更新清单，已停止');
    const names=new Set(),files=Object.values(m.components);if(!files.length)throw Error('清单没有组件');
    for(const d of files){if(!['script','world','pack','regex','fields'].includes(d.kind)||!/^assets\/[a-f0-9]{64}\/[\w.-]+$/.test(d.path)||!Number.isSafeInteger(d.bytes)||d.bytes<=0||d.bytes>50000000||!/^[a-f0-9]{64}$/.test(d.sha256)||!d.label||!d.contentHash)throw Error('清单组件格式错误');
      if(d.kind==='fields'&&d.fieldHashes){const keys=Object.keys(fieldLabels);if(Object.keys(d.fieldHashes).length!==keys.length||keys.some(k=>!/^[a-f0-9]{8}$/.test(d.fieldHashes[k])))throw Error('卡字段分项指纹格式错误');}
      if(d.path.split('/')[1]!==d.sha256)throw Error('清单文件地址与校验值不一致');
      if(d.kind==='script'){if(!d.name||names.has(d.name))throw Error('脚本名称冲突');names.add(d.name);}
      if(d.kind==='pack'||d.kind==='regex'){if(!Array.isArray(d.items)||!d.items.length)throw Error('清单条目缺失');const own=new Set();for(const i of d.items){if(!i.name||!i.contentHash||own.has(i.name))throw Error('重复或无效条目');own.add(i.name);if(d.kind==='pack'){if(names.has(i.name))throw Error('脚本名称冲突');names.add(i.name);}}}
    }
    // Validate pack/core conflicts independently of object order.
    const all=files.flatMap(d=>d.kind==='script'?[d.name]:d.kind==='pack'?d.items.map(i=>i.name):[]);if(new Set(all).size!==all.length)throw Error('脚本名称冲突');
    return m;
  }
  const matches=(hash,d)=>hash===d.contentHash||(d.compatibleHashes||[]).includes(hash);
  const fieldLabels={version:'卡片版本号',first_messages:'开场白',creator:'作者',creator_notes:'作者备注',description:'角色描述'};
  function installed(c,d){if(d.kind==='fields')return M.fieldsReadable(c)&&(d.fieldHashes?M.fieldDiff(c,d.fieldHashes).length===0:M.want(c,d));if(d.kind==='script'){const hits=M.scripts(c).filter(x=>x.name===d.name);return hits.length>0&&hits.every(x=>matches(M.scriptHash(x.content),d));}return M.want(c,d);}
  const fieldChoice=(c,d)=>({target:d.sha256,actual:M.hash(M.canonicalFields(c))});
  async function readWorld(name){try{return await api('getWorldbook')(name);}catch(e){const names=api('getWorldbookNames',false)?.();if(names&&!names.includes(name))return null;throw e;}}
  function chooseBook(m,b){const names=[b.char.primary,...(b.char.additional||[]),b.chat,...b.global].filter(Boolean);if(names.includes(m.worldbookName))return m.worldbookName;return names.find(n=>n.startsWith(m.worldbookNamePrefix))||m.worldbookName;}
  async function waitWrite(label,fn){status('write',label);const t=timer(()=>status('uncertain',label+'\n保存耗时较长，结果尚未确认。请勿重复提交；可以保持页面等待，或重开后检查备份记录。'),CONFIG.writeNotice);try{return await fn();}finally{clear(t);}}
  async function waitRead(label,fn){
    let notice,limit;
    try{return await Promise.race([
      Promise.resolve().then(fn),
      new Promise((resolve,reject)=>{notice=timer(()=>status('verify','正在回读确认：'+label+'\n读取耗时较长，最多等待25秒；不会因此重复写入。'),CONFIG.readNotice);limit=timer(()=>reject(Error(label+'回读超时，保存结果尚未确认。已停止后续操作，请整页刷新后检查更新')),CONFIG.readTimeout);})
    ]);}finally{clear(notice);clear(limit);}
  }
  async function editCard(name,change,s){
    const replace=api('replaceCharacter',false);
    if(!replace)return api('updateCharacterWith')(name,card=>{guard(s);return change(card);});
    const current=await waitRead('读取待保存角色卡',()=>api('getCharacter')(name));guard(s);
    const next=await change(current);guard(s);
    // Avoid the helper's default delayed re-render, which can regenerate the
    // first message, reload scripts and re-open the card during verification.
    return replace(name,next,{render:'none'});
  }
  async function writeChecked(label,write,verify,s){
    let last;for(let i=0;i<3;i++){
      guard(s);let thrown=null;try{const result=await waitWrite(label+'（第'+(i+1)+'次）',write);if(result===false)thrown=Error(label+'返回失败');}catch(e){thrown=e;}
      guard(s);status('verify','正在回读确认：'+label);
      // A failed/unresolved read is not evidence of a failed write. Do not
      // automatically write a large card again unless a read proves mismatch.
      for(let poll=0;poll<3;poll++){
        const verified=await waitRead(label,verify);guard(s);if(verified)return;
        if(poll<2)await new Promise(r=>timer(r,250*(poll+1)));
      }
      last=thrown||last||Error(label+'回读不一致');if(i<2)await new Promise(r=>timer(r,1500*(i+1)));
    }throw last;
  }
  function validatePayload(d,t){
    if(d.kind==='script'){if(M.scriptHash(t)!==d.contentHash)throw Error('脚本内容指纹不一致');new Function(t);if(d.name===NAME&&M.mark(t)!==d.mark)throw Error('更新器标记不一致');}
    if(d.kind==='world'){const w=JSON.parse(t);if(!w.entries||M.hash(M.world(Object.values(w.entries)))!==d.contentHash)throw Error('世界书内容不一致');const ids=Object.values(w.entries).map(e=>e.uid);if(new Set(ids).size!==ids.length)throw Error('世界书条目UID重复');}
    if(d.kind==='fields'&&M.hash(M.fields(JSON.parse(t)))!==d.contentHash)throw Error('卡字段内容不一致');
    if(d.kind==='fields'&&d.fieldHashes&&M.stable(M.fieldHashes(JSON.parse(t)))!==M.stable(d.fieldHashes))throw Error('卡字段分项指纹不一致');
    if(d.kind==='pack'||d.kind==='regex'){const p=JSON.parse(t);if(!Array.isArray(p.scripts)||p.scripts.length!==d.items.length)throw Error('脚本包条目不一致');const names=new Set();for(let i=0;i<p.scripts.length;i++){const v=p.scripts[i],n=d.kind==='pack'?v.name:M.rxName(v);const expected=d.items.find(x=>x.name===n);if(names.has(n)||!expected||(d.kind==='pack'?M.scriptHash(v.content):M.hash(M.rx(v)))!==expected.contentHash)throw Error('脚本包内容不一致');if(d.kind==='pack'&&(!!v.retired!==!!expected.retired||M.stable(v.replaces||[])!==M.stable(expected.replaces||[])))throw Error('脚本迁移规则不一致');names.add(n);if(d.kind==='pack')new Function(v.content);}}
  }
  async function execute(manual){
    status('check','正在读取角色卡');const c=await api('getCharacter')('current');
    if(!String(c.avatar||'').includes('新中市人间世'))throw Error('当前不是新中市角色卡');
    const name=String(c.avatar).replace(/\.png$/,'');const s={identity:identity(),binding:M.stable(binding()),name};
    const localRelease=await storage('installed:'+name);
    const b=binding();let book,world;
    // A successful HTTP response may still contain a stale CDN manifest. Validate
    // it inside the source loop so a rejected source cannot stop later mirrors.
    const m=manifest(await download('manifest.v2.json',null,async text=>{
      const candidate=manifest(text);guard(s);
      const updater=Object.values(candidate.components).find(d=>d.kind==='script'&&d.name===NAME);
      const minimumMark=Math.max(UPDATER_MARK,...M.scripts(c).filter(x=>x.name===NAME).map(x=>M.mark(x.content)));
      if(!updater||!Number.isSafeInteger(updater.mark)||updater.mark<minimumMark)throw Error('此源更新器版本较旧，正在尝试其他更新源');
      const target=chooseBook(candidate,b),w=await readWorld(target);guard(s);
      const wbMark=(w||[]).find(e=>(e.name||e.comment)===WB_MARK)?.content||'';
      const highest=Math.max(M.number(localRelease?.release),M.number(wbMark),...M.scripts(c).map(x=>M.number(M.build(x.content))));
      if(M.number(candidate.release)<highest)throw Error('此源仍是旧构建，已阻止降级并尝试其他更新源');
      book=target;world=w;
    }));guard(s);
    if(Object.values(m.components).some(d=>d.kind==='fields')&&!M.fieldsReadable(c))throw Error('角色卡字段未完整读出，暂不判断开场白与描述需要更新。请等待卡片加载后重试');
    let plan=Object.entries(m.components).filter(([key,d])=>d.kind==='world'?!world||!matches(M.hash(M.world(world)),d):!installed(c,d));
    // Older manifests lack per-field hashes. Verify their payload before classifying a difference.
    const fieldEntry=plan.find(([k,d])=>d.kind==='fields');
    if(fieldEntry&&!fieldEntry[1].fieldHashes){const [k,d]=fieldEntry;R.total=d.bytes;R.loaded=0;const t=await download(d.path,d);validatePayload(d,t);d.fieldHashes=M.fieldHashes(JSON.parse(t));if(installed(c,d))plan=plan.filter(([key])=>key!==k);}
    const skipped=await storage('fields-choice:'+name);let keptFields=false;
    R.fieldDifferences=fieldEntry?M.fieldDiff(c,fieldEntry[1].fieldHashes).map(k=>fieldLabels[k]):[];
    if(!manual)plan=plan.filter(([k,d])=>{if(d.kind==='fields'&&M.stable(skipped)===M.stable(fieldChoice(c,d))){keptFields=true;return false;}return true;});
    // Never install a numerically older updater even if a stale manifest has a newer release label.
    for(const [k,d]of plan)if(d.kind==='script'&&d.name===NAME&&M.scripts(c).some(x=>x.name===NAME&&M.mark(x.content)>d.mark))throw Error('清单中的更新器版本较旧，已停止');
    const old=await storage('journal:'+name);
    if(old&&old.state!=='complete'&&old.state!=='restored'&&old.release!==m.release){
      // A previous iframe may have died after all writes succeeded. Reconcile
      // its exact descriptors before allowing a later release to proceed.
      const current=await waitRead('核对上次角色卡',()=>api('getCharacter')(name));guard(s);
      if(M.encode(current)!==M.encode(c))throw Error('核对上次更新期间角色卡已改变，请重新检查');
      const newestUpdater=Object.values(m.components).find(d=>d.kind==='script'&&d.name===NAME);
      let confirmed=['prepared','world','card','updater'].includes(old.state)&&old.book===book&&Array.isArray(old.plan)&&old.plan.length>0;
      for(const item of old.plan||[]){
        const d=item.descriptor;let hit=false;
        if(d.kind==='world'){const w=await waitRead('核对上次世界书',()=>readWorld(old.book));hit=!!w&&matches(M.hash(M.world(w)),d);}
        else{hit=installed(c,d);
          // A manually installed recovery updater may already supersede the
          // interrupted target. Accept only the current validated manifest code.
          if(!hit&&d.kind==='script'&&d.name===NAME&&newestUpdater&&newestUpdater.mark>=d.mark)hit=installed(c,newestUpdater);
          if(!hit&&d.kind==='pack')hit=d.items.every(i=>{const hits=M.scripts(c).filter(s=>s.name===i.name);return (i.retired||hits.length>0)&&hits.every(s=>M.scriptHash(s.content)===i.contentHash)});
        }
        confirmed=confirmed&&hit;
      }
      guard(s);if(!confirmed)throw Error('上次更新的部分组件仍未保存完整；已保留原始备份并停止新版本写入，请恢复备份后再检查');
      const archive='history:'+name+':'+old.release+':'+(old.at||'unknown');
      const completed={...old,state:'complete',confirmedAgainstRelease:m.release};
      await storage(archive,completed);if(M.encode(await storage(archive))!==M.encode(completed))throw Error('上次备份归档回读失败，已停止');
      Object.assign(old,completed,{archivedKey:archive});await storage('journal:'+name,old);
    }
    // v17/18 can download the replacement but cannot remove retired entries. Finish only
    // that already-approved, byte-identical migration, retaining its original before-image.
    const resumeMigration=old?.state==='complete'&&old.release===m.release&&plan.length===1&&plan[0][1].kind==='pack'&&
      old.plan?.some(x=>x.descriptor.sha256===plan[0][1].sha256)&&plan[0][1].items.some(i=>i.retired&&M.scripts(c).some(s=>s.name===i.name))&&
      plan[0][1].items.every(i=>{const hits=M.scripts(c).filter(s=>s.name===i.name);return (i.retired||hits.length>0)&&hits.every(s=>M.scriptHash(s.content)===i.contentHash)});
    if(!plan.length){if(!keptFields&&old&&old.state!=='complete'&&old.state!=='restored'){old.state='complete';await storage('journal:'+name,old);}await storage('installed:'+name,{release:m.release});status('done',keptFields?'已按你的选择保留自定义卡片字段，其余组件已核实。可手动检查以重新选择。':'所有组件已经核实为最新版本：'+m.release);return;}
    R.total=plan.reduce((n,[k,d])=>n+d.bytes,0);R.loaded=0;
    const message='本次更新：\n'+plan.map(([k,d])=>d.label+(d.kind==='fields'?'（差异：'+M.fieldDiff(c,d.fieldHashes).map(k=>fieldLabels[k]).join('、')+'）':'')+' · '+mb(d.bytes)).join('\n')+'\n总下载量：'+mb(R.total)+'\n将先保存备份，再逐项写入并验证。\n现在更新吗？';
    if(!resumeMigration&&!host.confirm(message)){status('cancelled','已取消更新，未写入。');return;}
    const f=plan.find(([k,d])=>d.kind==='fields');
    if(f&&!host.confirm('卡片字段与官方版本存在差异：'+M.fieldDiff(c,f[1].fieldHashes).map(k=>fieldLabels[k]).join('、')+'。可能包含你的自定义内容。\n确定：备份后同步官方内容。\n取消：保留这些字段，其他组件继续更新；相同内容不再自动提醒，可手动重新检查。')){await storage('fields-choice:'+name,fieldChoice(c,f[1]));keptFields=true;plan=plan.filter(([k,d])=>d.kind!=='fields');}
    const files={};R.total=plan.reduce((n,[k,d])=>n+d.bytes,0);
    for(const [k,d]of plan){guard(s);const t=await download(d.path,d);status('verify','正在校验：'+d.label);validatePayload(d,t);files[k]=t;}
    stop();guard(s);
    if(!plan.length){status('cancelled','已保留自定义字段，未写入。');return;}
    // Persist full before-images once. Quota failure aborts before any host mutation.
    let j=resumeMigration||old&&old.state!=='complete'&&old.state!=='restored'?old:{state:'prepared',release:m.release,name,book,binding:b,beforeCard:M.clone(c),beforeWorld:world?M.clone(world):null,previousBackupKey:old?.archivedKey||old?.previousBackupKey||null,plan:plan.map(([k,d])=>({key:k,descriptor:d})),at:new Date().toISOString()};
    if(j.book!==book)throw Error('恢复记录的世界书目标不一致');
    for(const [k,d]of plan)if(!j.plan.some(x=>x.key===k))j.plan.push({key:k,descriptor:d});
    await storage('journal:'+name,j);const saved=await storage('journal:'+name);if(M.encode(saved)!==M.encode(j))throw Error('备份回读失败，已取消写入');
    const changed=await api('getCharacter')(name);if(M.encode(changed)!==M.encode(c))throw Error('下载期间角色卡已改变，已停止写入，请重新检查');guard(s);
    if(plan.some(([k,d])=>d.kind==='world')){const now=await readWorld(book);if(M.hash(now?M.world(now):null)!==M.hash(world?M.world(world):null))throw Error('下载期间世界书已改变，已停止写入，请重新检查');guard(s);}
    // The transaction now survives iframe replacement in the parent realm.
    const wd=plan.find(([k,d])=>d.kind==='world');
    if(wd){api('importRawWorldbook');const [k,d]=wd;j.state='world';await storage('journal:'+name,j);
      await writeChecked('保存世界书',()=>api('importRawWorldbook')(book,files[k]),async()=>{const w=await readWorld(book);return !!w&&matches(M.hash(M.world(w)),d)},s);
      if(![b.char.primary,...(b.char.additional||[]),b.chat,...b.global].includes(book)){guard(s);j.addedBinding=true;await storage('journal:'+name,j);await waitWrite('绑定世界书',()=>api('rebindGlobalWorldbooks')([...b.global,book]));const now=binding();if(!now.global.includes(book))throw Error('世界书已保存，但绑定未通过回读');s.binding=M.stable(now);}
    }
    const cardPlan=plan.filter(([k,d])=>d.kind!=='world');
    if(cardPlan.length){j.state='card';await storage('journal:'+name,j);await writeChecked('保存角色卡及更新器',()=>editCard(name,card=>{for(const [k,d]of cardPlan)M.apply(card,d,files[k]);return card;},s),async()=>{const read=await api('getCharacter')(name);return cardPlan.every(([k,d])=>installed(read,d))},s);}
    j.state='complete';await storage('journal:'+name,j);await storage('installed:'+name,{release:m.release});
    try{host.localStorage.setItem('xzs_notes',String(m.notes||''));}catch(_){}
    status('done','更新完成：'+m.release+'\n本次选定组件均已保存并回读验证。\n备份已保留，可刷新页面继续。'+(f&&!plan.some(([k,d])=>d.kind==='fields')?'\n已按你的选择保留自定义字段。':''));
  }
  function check(manual=true){if(R.busy){panel();return R.promise;}R.busy=true;R.cancelled=false;
    const work=async()=>{try{await execute(manual);}catch(e){status(R.cancelled?'cancelled':'error',(R.cancelled?'已取消。':'更新未完成：')+e.message+'\n已保存的备份会保留；可重试检查或恢复备份。');}finally{R.busy=false;panel();}};
    R.promise=host.navigator?.locks?host.navigator.locks.request('xzs-updater-write17',{ifAvailable:true},lock=>{if(!lock){R.busy=false;status('error','其他页面正在更新，请稍后重试');return;}return work();}):work();return R.promise;
  }
  async function currentJournal(){const c=await api('getCharacter')('current');const name=String(c.avatar||'').replace(/\.png$/,'');const j=await storage('journal:'+name);if(!j)throw Error('当前角色卡没有本地备份');return j;}
  async function exportBackup(){try{const j=await currentJournal(),history=[],seen=new Set();let key=j.previousBackupKey;while(key){if(seen.has(key))throw Error('历史备份链重复');seen.add(key);const prior=await storage(key);if(!prior)throw Error('历史备份缺失');history.push(prior);key=prior.previousBackupKey;}const blob=new host.Blob([M.encode(history.length?{...j,previousBackups:history}:j)],{type:'application/json'});const u=host.URL.createObjectURL(blob),a=host.document.createElement('a');a.href=u;a.download='新中市更新备份-'+j.release+'.json';a.click();timer(()=>host.URL.revokeObjectURL(u),1000);}catch(e){status('error','导出失败：'+e.message);}}
  function recover(){if(R.busy)return R.promise;R.busy=true;
    R.promise=host.navigator?.locks?host.navigator.locks.request('xzs-updater-write17',{ifAvailable:true},lock=>{if(!lock){R.busy=false;status('error','其他页面正在更新或恢复，请稍后重试');return;}return recoverWork();}):recoverWork();return R.promise;
  }
  async function recoverWork(){try{
    const j=await currentJournal();if(!host.confirm('恢复本角色卡最近一次更新前的组件和世界书？聊天消息不会被替换。'))return;
    const s={identity:identity(),binding:M.stable(binding()),name:j.name};j.state='restoring';await storage('journal:'+j.name,j);
    if(j.plan.some(x=>x.descriptor.kind==='world')&&j.beforeWorld){await writeChecked('恢复世界书',()=>api('replaceWorldbook')(j.book,M.clone(j.beforeWorld)),async()=>M.hash(M.world(await readWorld(j.book)))===M.hash(M.world(j.beforeWorld)),s);}
    await writeChecked('恢复角色卡组件',()=>editCard(j.name,card=>{
      guard(s);const e=M.ext(card),old=M.ext(j.beforeCard);e.tavern_helper=e.tavern_helper||{};
      const owned=new Set(j.plan.flatMap(x=>M.ownedNames(x.descriptor)));
      e.tavern_helper.scripts=M.scripts(card).filter(x=>!owned.has(x.name)).concat(M.scripts(j.beforeCard).filter(x=>owned.has(x.name)).map(M.clone));
      const regexNames=new Set(j.plan.filter(x=>x.descriptor.kind==='regex').flatMap(x=>x.descriptor.items.map(i=>i.name)));
      if(regexNames.size)e.regex_scripts=(e.regex_scripts||[]).filter(x=>!regexNames.has(M.rxName(x))).concat((old.regex_scripts||[]).filter(x=>regexNames.has(M.rxName(x))).map(M.clone));
      if(j.plan.some(x=>x.descriptor.kind==='fields'))for(const k of Object.keys(M.fields(j.beforeCard)))card[k]=M.clone(j.beforeCard[k]??(k==='first_messages'?[]:''));
      return card;
    },s),async()=>{
      const card=await api('getCharacter')(j.name);
      return j.plan.filter(x=>x.descriptor.kind!=='world').every(x=>{const d=x.descriptor;if(d.kind==='fields')return M.fieldsReadable(card)&&M.hash(M.canonicalFields(card))===M.hash(M.canonicalFields(j.beforeCard));if(d.kind==='regex'){const names=d.items.map(i=>i.name),owned=c=>(M.ext(c).regex_scripts||[]).filter(r=>names.includes(M.rxName(r)));return M.hash(owned(card))===M.hash(owned(j.beforeCard));}const names=M.ownedNames(d);return M.hash(M.scripts(card).filter(x=>names.includes(x.name)))===M.hash(M.scripts(j.beforeCard).filter(x=>names.includes(x.name)));});
    },s);
    // Only undo our added binding; never delete a book or revert unrelated global edits.
    if(j.addedBinding){guard(s);const now=binding();if(now.global.includes(j.book)){await waitWrite('恢复世界书绑定',()=>api('rebindGlobalWorldbooks')(now.global.filter(n=>n!==j.book)));if(binding().global.includes(j.book))throw Error('恢复世界书绑定未通过回读');s.binding=M.stable(binding());}}
    j.state='restored';await storage('journal:'+j.name,j);status('done','已恢复更新前的组件。新建的世界书文件保留，未删除聊天或存档。请刷新页面。');
  }catch(e){status('error','恢复未完成：'+e.message+'。备份仍保留。');}finally{R.busy=false;panel();}}
  R.api={check,recover,exportBackup,state:R,model:M};window.__xzsUpdater=R.api;
  R.autoTimer=timer(()=>check(false),CONFIG.auto);
  return R.api;
  }
})();
