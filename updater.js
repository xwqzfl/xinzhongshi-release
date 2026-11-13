/*XZS_UPDATER:32*/
/* Shared canonical forms: browser updater and offline builder must agree. */
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
  const scriptRoots = c => (ext(c).tavern_helper||{}).scripts || [];
  function scripts(c) {const roots=scriptRoots(c);return roots.some(s=>s.type==='folder')?roots.flatMap(s=>s.type==='folder'?(s.scripts||[]):[s]):roots;}
  function removeScripts(c,names) {
    const roots=scriptRoots(c),lists=[roots,...roots.filter(s=>s.type==='folder').map(s=>s.scripts||[])];
    for(const list of lists)for(let i=list.length-1;i>=0;i--)if(list[i].type!=='folder'&&names.has(list[i].name))list.splice(i,1);
  }
  function restoreScripts(c,before,names) {
    removeScripts(c,names);const roots=scriptRoots(c);
    for(const old of scriptRoots(before)){
      if(old.type==='folder'){
        const children=(old.scripts||[]).filter(s=>names.has(s.name)).map(clone);if(!children.length)continue;
        const folder=roots.find(s=>s.type==='folder'&&s.id===old.id);
        if(folder)folder.scripts.push(...children);else roots.push({...clone(old),scripts:children});
      }else if(names.has(old.name))roots.push(clone(old));
    }
  }
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
    const found=scripts(c).filter(s=>s.name===item.name);
    if(found.length)found.forEach(s=>{s.content=item.content;if(item.button)s.button=clone(item.button);if(item.info)s.info=item.info;if(item.export_with)s.export_with=clone(item.export_with);});
    else ss.push({type:'script',name:item.name,content:item.content,enabled:!!enabled,id:item.id&&!scripts(c).some(s=>s.id===item.id)?item.id:'xzs-'+Date.now()+'-'+Math.random().toString(36).slice(2),info:item.info||'新中市组件',data:clone(item.data||{}),button:clone(item.button||{enabled:true,buttons:[]}),export_with:clone(item.export_with||{data:true,button:true})});
  }
  const ownedNames=d=>d.kind==='script'?[d.name]:d.kind==='pack'?d.items.flatMap(i=>[i.name,...(i.replaces||[])]):[];
  function apply(c,d,text) {
    if(d.kind==='script')putScript(c,{name:d.name,content:text},true);
    if(d.kind==='pack'){
      const items=JSON.parse(text).scripts, before=scripts(c).slice(), retired=new Set(items.filter(i=>i.retired).map(i=>i.name));
      for(const item of items)for(const n of item.replaces||[])retired.add(n);
      const e=ext(c);if(!c.extensions&&!c.data?.extensions)c.extensions=e;e.tavern_helper=e.tavern_helper||{};
      e.tavern_helper.scripts=e.tavern_helper.scripts||[];removeScripts(c,retired);
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

  const placements={user_input:1,ai_output:2,slash_command:3,world_info:5,reasoning:6};
  function helperRegex(r){
    if(r.script_name!==undefined)return clone(r);
    return {id:r.id,script_name:r.scriptName,enabled:!r.disabled,find_regex:r.findRegex||'',replace_string:r.replaceString||'',trim_strings:r.trimStrings||[],source:Object.fromEntries(Object.entries(placements).map(([k,v])=>[k,(r.placement||[]).includes(v)])),destination:{display:!!r.markdownOnly,prompt:!!r.promptOnly},run_on_edit:!!r.runOnEdit,min_depth:typeof r.minDepth==='number'?r.minDepth:null,max_depth:typeof r.maxDepth==='number'?r.maxDepth:null};
  }
  function serverRegex(r,old={}){
    return {...clone(old),id:r.id,scriptName:r.script_name,disabled:!r.enabled,findRegex:r.find_regex,replaceString:r.replace_string,trimStrings:r.trim_strings||[],placement:Object.entries(placements).filter(([k])=>r.source?.[k]).map(([,v])=>v),markdownOnly:!!r.destination?.display,promptOnly:!!r.destination?.prompt,runOnEdit:!!r.run_on_edit,minDepth:r.min_depth??null,maxDepth:r.max_depth??null,substituteRegex:old.substituteRegex??0};
  }
  function fromServer(raw,avatar){
    const d=raw?.data;if(!d||typeof d!=='object'||typeof d.name!=='string')throw Error('服务器角色卡格式无效，未把页面缓存当作保存结果');
    const extensions=clone(d.extensions||{});if(Array.isArray(extensions.tavern_helper))extensions.tavern_helper=Object.fromEntries(extensions.tavern_helper);
    if(extensions.regex_scripts)extensions.regex_scripts=extensions.regex_scripts.map(helperRegex);
    return {avatar,version:String(d.character_version||''),creator:String(d.creator||''),creator_notes:String(d.creator_notes||''),description:String(d.description||''),first_messages:[String(d.first_mes??raw.first_mes??''),...(d.alternate_greetings||[])],worldbook:d.extensions?.world||null,extensions};
  }
  function serverPatch(raw,before,after){
    const patch={avatar:before.avatar,data:{}},fieldsMap={version:'character_version',creator:'creator',creator_notes:'creator_notes',description:'description'};
    for(const[k,target]of Object.entries(fieldsMap))if(stable(before[k])!==stable(after[k])){patch.data[target]=clone(after[k]);if(k==='creator_notes')patch.creatorcomment=after[k];if(k==='description')patch.description=after[k];}
    if(stable(before.first_messages)!==stable(after.first_messages)){patch.first_mes=patch.data.first_mes=after.first_messages[0]||'';patch.data.alternate_greetings=clone(after.first_messages.slice(1));}
    const ex={};for(const k of Object.keys(after.extensions||{}))if(stable(before.extensions?.[k])!==stable(after.extensions[k])){
      ex[k]=k==='regex_scripts'?after.extensions[k].map(r=>serverRegex(r,(raw.data.extensions?.regex_scripts||[]).find(old=>old.id===r.id)||{})):clone(after.extensions[k]);
    }
    if(Object.keys(ex).length)patch.data.extensions=ex;return patch;
  }

  return {norm,fnv,clone,encode,decode,stable,hash,scriptHash,sha256Bytes,build,number,mark,ext,scriptRoots,scripts,restoreScripts,rxName,rx,fields,canonicalFields,fieldHashes,fieldDiff,fieldsReadable,worldEntry,world,want,apply,ownedNames,helperRegex,serverRegex,fromServer,serverPatch};
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
  const NAME='新中市更新器', WB_MARK='【系统】世界书版本', UPDATER_MARK=32;
  const OLD_WORLD="新中市个人删减版（更新）", NEW_WORLD="新中市整合版（更新）";
  const CONFIG={connect:8000,idle:45000,total:600000,writeNotice:20000,readNotice:8000,readTimeout:60000,auto:8000};
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
  const bases=[["https://fastly.jsdelivr.net/gh/xwqzfl/xinzhongshi-release@main/",""],["https://gh-proxy.com/https://raw.githubusercontent.com/xwqzfl/xinzhongshi-release/main/",""],["https://cdn.jsdelivr.net/gh/xwqzfl/xinzhongshi-release@main/",""],["https://raw.githubusercontent.com/xwqzfl/xinzhongshi-release/main/",""],["https://api.github.com/repos/xwqzfl/xinzhongshi-release/contents/","api"],["https://ghproxy.net/https://raw.githubusercontent.com/xwqzfl/xinzhongshi-release/main/",""]];
  function api(n,required=true){const f=host.TavernHelper?.[n]||window[n];if(typeof f==='function')return f.bind(host.TavernHelper||window);if(required)throw Error('酒馆助手缺少接口：'+n);return null;}
  function context(){try{return host.SillyTavern?.getContext?.()||{};}catch(_){return {};}}
  function identity(){const c=context();return JSON.stringify([api('getCurrentCharacterName',false)?.()||c.name2||'',c.getCurrentChatId?.()||c.chatId||c.chat_id||'',c.groupId??c.group_id??'',c.characters?.[c.characterId]?.avatar||'']);}
  function binding(){const ctx=context();let chat=ctx.chatMetadata?.world_info; if(chat===undefined&&!ctx.chatMetadata)chat=api('getChatWorldbookName',false)?.('current');return {global:api('getGlobalWorldbookNames',false)?.()||[],char:api('getCharWorldbookNames',false)?.('current')||{},chat:chat||''};}
  function guard(s){if(identity()!==s.identity||M.stable(binding())!==s.binding){const e=Error('角色、聊天或世界书绑定已改变。已停止继续写入，请回到原聊天检查。');e.local=true;throw e;}}
  function mb(n){return (n/1048576).toFixed(2)+' MiB';}
  function panel(){
    if(!R.showPanel)return null;
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
    const p=el.querySelector('progress');p.hidden=!R.busy&&R.stage!=='done';if(R.stage==='download'&&R.total>0)p.value=Math.min(100,R.loaded/R.total*100);else if(R.stage==='done')p.value=100;else p.removeAttribute('value');
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
  async function download(path,d,validate,latest=false){
    if(d&&R.cache.has(d.sha256)){R.loaded+=d.bytes;panel();return R.cache.get(d.sha256);}
    let last,best;const order=[...bases.keys()].sort((a,b)=>(a===R.goodSource?-1:b===R.goodSource?1:0));
    for(const i of order){if(R.failedSources?.has(i)||latest&&best&&i>=4)continue;stop();status(d?'download':'check',(d?'正在下载 '+d.label:'正在检查版本')+'\n更新源 '+(i+1)+'/'+bases.length+(last?' · 上个源：'+last:''));
      try{const t=await fetchOne(bases[i],path,d),value=validate?await validate(t):null;stop();
        if(latest){if(!best||M.number(value.release)>M.number(best.release))best={text:t,release:value.release,source:i};continue;}
        R.goodSource=i;if(d)R.cache.set(d.sha256,t);return t;}
      catch(e){stop();if(e.local)throw e;last=e.message;R.failedSources?.add(i);}
    }
    if(best){R.goodSource=best.source;return best.text;}
    throw Error('所有可用更新源失败：'+(last||'本轮源均已失败')+'；可重试检查，重新探测更新源');
  }
  const PRESET_NAME='新中市专属预设 v0.1';
  async function presetPost(endpoint,body){
    const headers=context().getRequestHeaders?.();if(!headers)throw Error('缺少酒馆原生请求接口，未写入预设');
    const response=await host.fetch(endpoint,{method:'POST',headers,body:JSON.stringify(body)});
    if(!response.ok)throw Error('预设接口失败：'+response.status);
    return endpoint.endsWith('/delete')?null:response.json();
  }
  async function readPreset(name){
    const all=await presetPost('/api/settings/get',{}),index=all.openai_setting_names?.indexOf(name);
    if(index==null||index<0)return null;
    const value=all.openai_settings[index];return typeof value==='string'?JSON.parse(value):value;
  }
  async function savePreset(name,preset,expected){
    if(expected!==undefined){const actual=await readPreset(name);if(M.stable(actual)!==M.stable(expected)&&M.stable(actual)!==M.stable(preset))throw Error('保存期间预设变化，请重新检查');}
    await presetPost('/api/presets/save',{name,preset:M.clone(preset),apiId:'openai'});
  }
  const presetVersionKey=name=>'preset-version:'+name;
  const presetRevision=d=>d.revision===undefined?d.sha256:d.revision;
  async function recordPresetVersion(d,source){
    const version={revision:presetRevision(d),sha256:d.sha256,source,recordedAt:Date.now()};
    await storage(presetVersionKey(d.name),version);
    if(M.stable(await storage(presetVersionKey(d.name)))!==M.stable(version))throw Error('预设版本记录回读失败');
  }
  async function initializePresetVersion(d,actual,journal){
    if(!actual)return;
    const recorded=await storage(presetVersionKey(d.name));
    const completed=journal?.state==='complete'&&journal.plan?.find(x=>x.descriptor?.kind==='preset'&&x.descriptor.name===d.name&&presetRevision(x.descriptor)===presetRevision(d));
    if(completed&&(!recorded||!recorded.recordedAt||Date.parse(journal.at)>recorded.recordedAt)){await recordPresetVersion(d,'previous-install');return;}
    if(recorded)return;
    // An interrupted preset install still needs to finish before recording its target.
    if(journal&&!['complete','restored','superseded'].includes(journal.state)&&journal.plan?.some(x=>x.descriptor?.kind==='preset'&&x.descriptor.name===d.name))return;
    const seen=new Set();let previous=journal;
    while(previous){
      const installed=previous.state==='complete'&&previous.plan?.find(x=>x.descriptor?.kind==='preset'&&x.descriptor.name===d.name)?.descriptor;
      if(installed){await recordPresetVersion(installed,'previous-install');return;}
      const key=previous.previousBackupKey;if(!key||seen.has(key))break;seen.add(key);previous=await storage(key);
    }
    // Existing presets without an older version receipt start observing this cloud
    // revision. Local option values and script content are never compared.
    await recordPresetVersion(d,'first-seen-cloud');
  }
  async function presetInstalled(d,actual){
    if(actual===undefined)actual=await readPreset(d.name);
    if(!actual)return false;
    const installed=await storage(presetVersionKey(d.name));
    return !!installed&&installed.revision===presetRevision(d);
  }
  // Official managed components replace the previous release after a verified backup.
  

  function manifest(text){
    const m=JSON.parse(text);if(m.optionalComponents){if(Object.keys(m.optionalComponents).some(k=>k!=='preset')||m.components?.preset)throw Error('可选组件格式无效');m.components={...m.components,...m.optionalComponents};}if(m.schema!==2||!M.number(m.release)||!m.worldbookName||!m.worldbookNamePrefix||!m.components)throw Error('不支持的更新清单，已停止');
    const names=new Set(),files=Object.values(m.components);if(!files.length)throw Error('清单没有组件');
    for(const d of files){if(!['script','world','pack','regex','fields','preset'].includes(d.kind)||!/^assets\/[a-f0-9]{64}\/[\w.-]+$/.test(d.path)||!Number.isSafeInteger(d.bytes)||d.bytes<=0||d.bytes>50000000||!/^[a-f0-9]{64}$/.test(d.sha256)||!d.label||!d.contentHash)throw Error('清单组件格式错误');
      if(d.kind==='preset'&&(d.name!==PRESET_NAME||d.apiId!=='openai'||d.autoSelect!==false))throw Error('预设目标或默认启用策略无效');
      if(d.kind==='preset'&&d.revision!==undefined&&(typeof d.revision!=='string'||!d.revision||d.revision.length>128))throw Error('预设组件版本无效');
      if(d.kind==='fields'&&d.fieldHashes){const keys=Object.keys(fieldLabels);if(Object.keys(d.fieldHashes).length!==keys.length||keys.some(k=>!/^[a-f0-9]{8}$/.test(d.fieldHashes[k])))throw Error('卡字段分项指纹格式错误');}
      if(d.path.split('/')[1]!==d.sha256)throw Error('清单文件地址与校验值不一致');
      if(d.kind==='script'){if(!d.name||names.has(d.name))throw Error('脚本名称冲突');names.add(d.name);}
      if(d.kind==='pack'||d.kind==='regex'){if(!Array.isArray(d.items)||!d.items.length)throw Error('清单条目缺失');const own=new Set();for(const i of d.items){if(!i.name||!i.contentHash||own.has(i.name))throw Error('重复或无效条目');own.add(i.name);if(d.kind==='pack'){if(names.has(i.name))throw Error('脚本名称冲突');names.add(i.name);}}}
    }
    // Validate pack/core conflicts independently of object order.
    const all=files.flatMap(d=>d.kind==='script'?[d.name]:d.kind==='pack'?d.items.map(i=>i.name):[]);if(new Set(all).size!==all.length)throw Error('脚本名称冲突');
    return m;
  }
  const matches=(hash,d)=>hash===d.contentHash;
  const fieldLabels={version:'卡片版本号',first_messages:'开场白',creator:'作者',creator_notes:'作者备注',description:'角色描述'};
  function installed(c,d){if(d.kind==='fields')return M.fieldsReadable(c)&&(d.fieldHashes?M.fieldDiff(c,d.fieldHashes).length===0:M.want(c,d));if(d.kind==='script'){const hits=M.scripts(c).filter(x=>x.name===d.name);return hits.length>0&&hits.every(x=>matches(M.scriptHash(x.content),d));}return M.want(c,d);}
  
  async function worldRequest(label,endpoint,body){
    const headers=context().getRequestHeaders?.();if(!headers)throw Error(label+'需要酒馆原生请求接口');
    const response=await host.fetch(endpoint,{method:'POST',headers,body:JSON.stringify(body),cache:'no-store'});
    if(!response.ok){const error=Error(label+'失败（HTTP '+response.status+'）');error.status=response.status;throw error;}
    return response.json();
  }
  const worldEntries=world=>Object.values(world.entries);
  const worldHash=world=>M.hash(M.world(worldEntries(world)));
  function readWorld(name){return waitRead('读取世界书',async()=>{
    const world=await worldRequest('读取世界书','/api/worldinfo/get',{name});
    if(!world?.entries||typeof world.entries!=='object'||Array.isArray(world.entries))throw Error('原生世界书回读格式无效');
    if(Object.keys(world.entries).length||Object.keys(world).length>1)return world;
    // The native GET returns an empty entries object for both missing and empty books.
    const {world_names}=await worldRequest('读取世界书列表','/api/settings/get',{});
    if(!Array.isArray(world_names))throw Error('原生世界书列表格式无效');
    return world_names.includes(name)?world:null;
  });}
  async function ensureWorldListed(name,s,module){
    const ctx=context(),names=ctx.getWorldInfoNames||api('getWorldbookNames');
    if(!names().includes(name)){
      const refresh=ctx.updateWorldInfoList||module?.updateWorldInfoList;
      if(!refresh)throw Error('世界书已保存，但酒馆缺少刷新世界书列表的接口；请整页刷新后重试检查');
      await refresh();guard(s);
      if(!names().includes(name))throw Error('世界书已保存，但列表刷新失败，请刷新页面后重试');
    }
  }
  async function refreshWorldView(name,world,s){
    let module;
    try{module=await import('/scripts/world-info.js');}catch(_){R.refreshNotes.push('世界书已回读验证；请整页刷新以加载页面缓存。');}
    guard(s);
    if(module?.worldInfoCache?.set)module.worldInfoCache.set(name,world);
    else if(module)R.refreshNotes.push('世界书已回读验证；当前酒馆需整页刷新才能更新缓存。');
    await ensureWorldListed(name,s,module);guard(s);
    const ctx=context();
    // Extension/editor listeners are notifications, not evidence of persistence.
    try{await ctx.reloadWorldInfoEditor?.(name);}catch(_){guard(s);R.refreshNotes.push('世界书编辑器刷新失败，请整页刷新；已保存的内容不受影响。');}
    guard(s);
    try{if(ctx.eventTypes?.WORLDINFO_UPDATED)await ctx.eventSource?.emit(ctx.eventTypes.WORLDINFO_UPDATED,name,world);}
    catch(_){guard(s);R.refreshNotes.push('其他扩展的世界书通知失败，请整页刷新；已保存的内容不受影响。');}
    guard(s);
  }
  async function importWorld(label,name,data){
    const headers=context().getRequestHeaders?.();if(!headers)throw Error(label+'需要酒馆原生请求接口');
    const uploadHeaders={...headers};for(const key of Object.keys(uploadHeaders))if(key.toLowerCase()==='content-type')delete uploadHeaders[key];
    // Extended filename keeps Chinese book names intact in Multer/Busboy.
    const boundary='xzs-world-'+Date.now().toString(36);uploadHeaders['Content-Type']='multipart/form-data; boundary='+boundary;
    const body=new host.Blob(['--'+boundary+'\r\nContent-Disposition: form-data; name="avatar"; filename="world.json"; filename*=UTF-8\'\''+encodeURIComponent(name+'.json')+'\r\nContent-Type: application/json\r\n\r\n',JSON.stringify(data),'\r\n--'+boundary+'--\r\n']);
    const response=await host.fetch('/api/worldinfo/import',{method:'POST',headers:uploadHeaders,body});
    if(!response.ok)throw Error(label+'文件导入失败（HTTP '+response.status+'）');
    if((await response.json()).name!==name)throw Error(label+'文件导入名称不一致，已停止');
  }
  async function writeWorld(label,name,data,s){
    let upload=false;
    await writeChecked(label,async()=>{
      if(upload)return importWorld(label,name,data);
      try{await worldRequest(label,'/api/worldinfo/edit',{name,data});}
      catch(error){if([413,404,405].includes(error.status))upload=true;throw error;}
    },async()=>{
      const persisted=await readWorld(name);guard(s);
      return !!persisted&&M.stable(persisted)===M.stable(data);
    },s);
    const persisted=await readWorld(name);guard(s);
    if(!persisted||M.stable(persisted)!==M.stable(data))throw Error(label+'回读不一致');
    await refreshWorldView(name,persisted,s);
  }
  function chooseBook(m,b){const names=[b.char.primary,...(b.char.additional||[]),b.chat,...b.global].filter(Boolean);if(names.includes(m.worldbookName))return m.worldbookName;return names.find(n=>n.startsWith(m.worldbookNamePrefix))||m.worldbookName;}
  function legacyBinding(b){return [b.char.primary,...(b.char.additional||[]),b.chat,...b.global].includes(OLD_WORLD);}
  async function bindSavedWorld(s,j){
    const b=binding(),book=j.book;
    if(book===NEW_WORLD&&legacyBinding(b)||[b.char.primary,...(b.char.additional||[]),b.chat,...b.global].includes(book))return;
    guard(s);j.addedBinding=true;await storage('journal:'+s.name,j);guard(s);
    await waitWrite('绑定世界书',()=>api('rebindGlobalWorldbooks')([...b.global,book]));
    const now=binding();
    if(identity()!==s.identity||!now.global.includes(book))throw Error('世界书已保存，但绑定未通过回读');
    s.binding=M.stable(now);
  }
  function renamedBinding(b){
    const names=list=>[...new Set(list.map(name=>name===OLD_WORLD?NEW_WORLD:name))];
    const primary=b.char.primary===OLD_WORLD?NEW_WORLD:b.char.primary;
    const charChanged=b.char.primary===OLD_WORLD||(b.char.additional||[]).includes(OLD_WORLD);
    const char=charChanged?{...b.char,primary,additional:names(b.char.additional||[]).filter(name=>name!==primary)}:b.char;
    return {global:b.global.includes(OLD_WORLD)?names(b.global):b.global,char,chat:b.chat===OLD_WORLD?NEW_WORLD:b.chat};
  }
  function renameKey(s,release){return 'world-name:'+s.name+':'+release+':'+s.identity;}
  async function writeBindingPart(s,key,next){
    guard(s);
    const expected={...binding(),[key]:next};
    if(key==='global')await waitWrite('迁移全局世界书绑定',()=>api('rebindGlobalWorldbooks')(next));
    if(key==='char')await waitWrite('迁移角色世界书绑定',()=>api('rebindCharWorldbooks')('current',next));
    if(key==='chat')await waitWrite('迁移本聊天世界书绑定',()=>api('rebindChatWorldbook')('current',next));
    const actual=binding();
    if(identity()!==s.identity||M.stable(actual)!==M.stable(expected))throw Error('世界书绑定迁移回读不一致，请在原聊天重试');
    s.binding=M.stable(actual);
  }
  async function migrateWorldName(s,m){
    const b=binding();
    if(m.worldbookName!==NEW_WORLD||!legacyBinding(b))return;
    const world=await readWorld(NEW_WORLD);guard(s);
    const descriptor=Object.values(m.components).find(d=>d.kind==='world');
    if(!world||!descriptor||!matches(worldHash(world),descriptor))throw Error('整合版世界书尚未通过回读，旧绑定保留');
    await ensureWorldListed(NEW_WORLD,s);guard(s);
    const key=renameKey(s,m.release), previous=await storage(key);guard(s);
    const next=renamedBinding(b), saved={parts:{...previous?.parts}};
    for(const part of ['global','char','chat'])if(M.stable(b[part])!==M.stable(next[part])){
      const method={global:'rebindGlobalWorldbooks',char:'rebindCharWorldbooks',chat:'rebindChatWorldbook'}[part];api(method);
      saved.parts[part]={before:b[part],after:next[part]};
    }
    await storage(key,saved);
    if(M.stable(await storage(key))!==M.stable(saved))throw Error('旧绑定备份回读失败，已停止迁移');
    for(const [part,change] of Object.entries(saved.parts)){
      guard(s);
      if(M.stable(binding()[part])===M.stable(change.before))await writeBindingPart(s,part,change.after);
    }
  }
  async function restoreWorldName(s,j){
    const key=renameKey(s,j.release), saved=await storage(key);guard(s);
    if(!saved?.parts)return;
    for(const [part,change] of Object.entries(saved.parts).reverse()){
      guard(s);
      if(M.stable(binding()[part])===M.stable(change.after))await writeBindingPart(s,part,change.before);
    }
  }
  
  async function waitWrite(label,fn){status('write',label);const t=timer(()=>status('uncertain',label+'\n保存耗时较长，结果尚未确认。请勿重复提交；可以保持页面等待，或重开后检查备份记录。'),CONFIG.writeNotice);try{return await fn();}finally{clear(t);}}
  async function waitRead(label,fn){
    let notice,limit;
    try{return await Promise.race([
      Promise.resolve().then(fn),
      new Promise((resolve,reject)=>{notice=timer(()=>status('verify','正在回读确认：'+label+'\n读取耗时较长，最多等待'+CONFIG.readTimeout/1000+'秒；不会因此重复写入。'),CONFIG.readNotice);limit=timer(()=>reject(Error(label+'回读超时，保存结果尚未确认。已停止后续操作，请整页刷新后检查更新')),CONFIG.readTimeout);})
    ]);}finally{clear(notice);clear(limit);}
  }
  async function cardRequest(label,endpoint,body){
    const headers=context().getRequestHeaders?.();if(!headers)throw Error(label+'缺少酒馆原生请求接口');
    const reading=endpoint.endsWith('/get');
    for(let attempt=0;;attempt++){
      try{
        const response=await host.fetch(endpoint,{method:'POST',headers,body:JSON.stringify(body),cache:'no-store'});
        if(!response.ok){const error=Error(label+'失败（HTTP '+response.status+'）');error.status=response.status;throw error;}
        return reading?await response.json():undefined;
      }catch(e){
        if(reading&&attempt<2&&(!e.status||e.status>=500)){await new Promise(r=>timer(r,250*(attempt+1)));continue;}
        const error=Error(e.status?e.message:label+'连接本地酒馆失败：'+e.message);error.status=e.status;error.local=true;throw error;
      }
    }
  }
  async function readCard(target='current',avatar){
    const ctx=context(),current=ctx.characters?.[ctx.characterId??ctx.this_chid];
    avatar=avatar||(target==='current'?current?.avatar:null);
    if(!avatar){const hint=await api('getCharacter')(target);avatar=hint.avatar;}
    if(typeof avatar!=='string'||!avatar.endsWith('.png'))throw Error('未能确定实际角色卡文件，已停止写入');
    const raw=await cardRequest('读取服务器角色卡','/api/characters/get',{avatar_url:avatar});
    return M.fromServer(raw,avatar);
  }
  async function syncCardView(avatar,raw,s){
    guard(s);const ctx=context(),index=ctx.characters?.findIndex(c=>c.avatar===avatar);
    if(index>=0)ctx.characters[index]=M.clone(raw);
    // Refresh script memory from verified server data, without regenerating chat messages.
    const replace=api('replaceScriptTrees',false),trees=raw.data?.extensions?.tavern_helper?.scripts;
    if(replace&&Array.isArray(trees)){try{replace(M.clone(trees),{type:'character'});}catch(_){R.refreshNotes.push('卡片已保存，请整页刷新以载入内置脚本。');}}
    const fields={'#character_version_textarea':raw.data.character_version,'#firstmessage_textarea':raw.data.first_mes,'#description_textarea':raw.data.description,'#creator_textarea':raw.data.creator,'#creator_notes_textarea':raw.data.creator_notes};
    for(const[id,value]of Object.entries(fields)){const el=host.document?.querySelector?.(id);if(el)el.value=value||'';}
    guard(s);
  }
  async function editCard(name,change,s){
    const avatar=s.avatar,raw=await cardRequest('读取待保存角色卡','/api/characters/get',{avatar_url:avatar});guard(s);
    const before=M.fromServer(raw,avatar),next=await change(M.clone(before));guard(s);
    const patch=M.serverPatch(raw,before,next);
    try{await cardRequest('保存角色卡','/api/characters/merge-attributes',patch);}
    catch(error){
      if(![404,405].includes(error.status))throw error;
      // Older compatible backends lack merge-attributes. The helper remains a transport fallback,
      // but verification always reads the native server endpoint below.
      const replace=api('replaceCharacter',false);if(!replace)throw error;
      await replace(name,next,{render:'none'});
    }
    const saved=await cardRequest('回读已保存角色卡','/api/characters/get',{avatar_url:avatar});guard(s);
    const actual=M.fromServer(saved,avatar);
    if(M.stable(M.fields(actual))===M.stable(M.fields(next))&&M.stable(actual.extensions)===M.stable(next.extensions))await syncCardView(avatar,saved,s);
  }
  async function writeChecked(label,write,verify,s,opts){
    const retries=opts?.retries||3,polls=opts?.polls||3,gap=opts?.gap||250,backoff=opts?.backoff||1500;
    let last;for(let i=0;i<retries;i++){
      guard(s);let thrown=null;try{const result=await waitWrite(retries>1?label+'（第'+(i+1)+'次）':label,write);if(result===false)thrown=Error(label+'返回失败');}catch(e){thrown=e;}
      guard(s);status('verify','正在回读确认：'+label);
      // A failed/unresolved read is not evidence of a failed write. Do not
      // automatically write a large card again unless a read proves mismatch.
      for(let poll=0;poll<polls;poll++){
        const verified=await waitRead(label,verify);guard(s);if(verified)return;
        if(poll<polls-1){
          status('verify','正在回读确认：'+label+'（'+(poll+1)+'/'+polls+'）\n保存尚未落盘，继续等待；不会重复写入。');
          await new Promise(r=>timer(r,gap));
        }
      }
      last=thrown||last||Error(label+'回读不一致');if(i<retries-1)await new Promise(r=>timer(r,backoff*(i+1)));
    }throw last;
  }
  function validatePayload(d,t){
    if(d.kind==='preset'){const p=JSON.parse(t);if(p.name!==d.name||!Array.isArray(p.prompts)||!Array.isArray(p.prompt_order)||M.hash(p)!==d.contentHash)throw Error('预设内容指纹或结构不一致');for(const s of p.extensions?.tavern_helper?.scripts||[])if(s.content)new Function(s.content);}
    if(d.kind==='script'){if(M.scriptHash(t)!==d.contentHash)throw Error('脚本内容指纹不一致');new Function(t);if(d.name===NAME&&M.mark(t)!==d.mark)throw Error('更新器标记不一致');}
    if(d.kind==='world'){const w=JSON.parse(t);if(!w.entries||M.hash(M.world(Object.values(w.entries)))!==d.contentHash)throw Error('世界书内容不一致');const ids=Object.values(w.entries).map(e=>e.uid);if(new Set(ids).size!==ids.length)throw Error('世界书条目UID重复');}
    if(d.kind==='fields'&&M.hash(M.fields(JSON.parse(t)))!==d.contentHash)throw Error('卡字段内容不一致');
    if(d.kind==='fields'&&d.fieldHashes&&M.stable(M.fieldHashes(JSON.parse(t)))!==M.stable(d.fieldHashes))throw Error('卡字段分项指纹不一致');
    if(d.kind==='pack'||d.kind==='regex'){const p=JSON.parse(t);if(!Array.isArray(p.scripts)||p.scripts.length!==d.items.length)throw Error('脚本包条目不一致');const names=new Set();for(let i=0;i<p.scripts.length;i++){const v=p.scripts[i],n=d.kind==='pack'?v.name:M.rxName(v);const expected=d.items.find(x=>x.name===n);if(names.has(n)||!expected||(d.kind==='pack'?M.scriptHash(v.content):M.hash(M.rx(v)))!==expected.contentHash)throw Error('脚本包内容不一致');if(d.kind==='pack'&&(!!v.retired!==!!expected.retired||M.stable(v.replaces||[])!==M.stable(expected.replaces||[])))throw Error('脚本迁移规则不一致');names.add(n);if(d.kind==='pack')new Function(v.content);}}
  }
  async function execute(manual){
    R.refreshNotes=[];R.failedSources=new Set();
    status('check','正在读取角色卡');const ctx=context();if((ctx.groupId??ctx.group_id)!=null&&String(ctx.groupId??ctx.group_id)!=='')throw Error('群聊中不能确定要更新哪张角色卡，请从对应角色卡检查更新');
    const s={identity:identity(),binding:M.stable(binding())};const c=await waitRead('读取角色卡',()=>readCard('current'));guard(s);
    if(!String(c.avatar||'').includes('新中市人间世'))throw Error('当前不是新中市角色卡');
    const name=String(c.avatar).replace(/\.png$/,'');s.name=name;s.avatar=c.avatar;
    const localRelease=await storage('installed:'+name);
    const b=binding();let book,world,m,olderUpdaterSource=false,compatibleUpdaterSource=false;
    // A successful HTTP response may still contain a stale CDN manifest. Validate
    // it inside the source loop so a rejected source cannot stop later mirrors.
    const checkedWorlds=new Map();
    async function checkedWorld(name){if(!checkedWorlds.has(name))checkedWorlds.set(name,await readWorld(name));return checkedWorlds.get(name);}
    const minimumMark=Math.max(UPDATER_MARK,...M.scripts(c).filter(x=>x.name===NAME).map(x=>M.mark(x.content)));
    try{
      m=manifest(await download('manifest.v2.json',null,async text=>{
        const candidate=manifest(text);guard(s);
        const updater=Object.values(candidate.components).find(d=>d.kind==='script'&&d.name===NAME);
        if(!updater||!Number.isSafeInteger(updater.mark))throw Error('此源更新器版本无效');
        if(updater.mark<minimumMark){olderUpdaterSource=true;throw Error('此源更新器版本较旧，正在尝试其他更新源');}
        compatibleUpdaterSource=true;
        const target=chooseBook(candidate,b),w=await checkedWorld(target);guard(s);
        const wbMark=w&&worldEntries(w).find(e=>e.comment===WB_MARK)?.content;
        const oldWorld=target===NEW_WORLD&&legacyBinding(b)?await checkedWorld(OLD_WORLD):null;guard(s);
        const oldMark=oldWorld&&worldEntries(oldWorld).find(e=>e.comment===WB_MARK)?.content;
        const highest=Math.max(M.number(localRelease?.release),M.number(wbMark),M.number(oldMark),...M.scripts(c).map(x=>M.number(M.build(x.content))));
        if(M.number(candidate.release)<highest)throw Error('此源仍是旧构建，已阻止降级并尝试其他更新源');
        return candidate;
      },true));
      book=chooseBook(m,b);world=await checkedWorld(book);
    }catch(e){
      guard(s);
      if(R.cancelled||!olderUpdaterSource||compatibleUpdaterSource)throw e;
      status('done','本地更新器为第 '+minimumMark+' 版，已读到的云端更新器版本较旧。');return;
    }guard(s);
    if(Object.values(m.components).some(d=>d.kind==='fields')&&!M.fieldsReadable(c))throw Error('角色卡字段未完整读出，暂不判断开场白与描述需要更新。请等待卡片加载后重试');
    const presetsBefore={},presetVersionsBefore={};
    const old=await storage('journal:'+name);
    for(const d of Object.values(m.components).filter(d=>d.kind==='preset')){presetsBefore[d.name]=await readPreset(d.name);guard(s);await initializePresetVersion(d,presetsBefore[d.name],old);presetVersionsBefore[d.name]=await storage(presetVersionKey(d.name));guard(s);}
    let plan=[];
    for(const [key,d]of Object.entries(m.components)){
      const present=d.kind==='world'?!!world&&matches(worldHash(world),d):d.kind==='preset'?await presetInstalled(d,presetsBefore[d.name]):installed(c,d);guard(s);
      if(!present)plan.push([key,d]);
    }
    // Older manifests lack per-field hashes. Verify their payload before classifying a difference.
    const fieldEntry=plan.find(([k,d])=>d.kind==='fields');
    if(fieldEntry&&!fieldEntry[1].fieldHashes){const [k,d]=fieldEntry;R.total=d.bytes;R.loaded=0;const t=await download(d.path,d);validatePayload(d,t);d.fieldHashes=M.fieldHashes(JSON.parse(t));if(installed(c,d))plan=plan.filter(([key])=>key!==k);}
    // Never install a numerically older updater even if a stale manifest has a newer release label.
    for(const [k,d]of plan)if(d.kind==='script'&&d.name===NAME&&M.scripts(c).some(x=>x.name===NAME&&M.mark(x.content)>d.mark))throw Error('清单中的更新器版本较旧，已停止');
    if(old&&old.state!=='complete'&&old.state!=='restored'&&old.release!==m.release){
      // A previous iframe may have died after all writes succeeded. Reconcile
      // its exact descriptors before allowing a later release to proceed.
      const current=await waitRead('核对上次角色卡',()=>readCard(name,s.avatar));guard(s);
      if(M.encode(current)!==M.encode(c))throw Error('核对上次更新期间角色卡已改变，请重新检查');
      const newestUpdater=Object.values(m.components).find(d=>d.kind==='script'&&d.name===NAME);
      let confirmed=['prepared','world','presets','card','updater'].includes(old.state)&&old.book===book&&Array.isArray(old.plan)&&old.plan.length>0;
      for(const item of old.plan||[]){
        const d=item.descriptor;let hit=false;
        if(d.kind==='world'){const w=await readWorld(old.book);hit=!!w&&matches(worldHash(w),d);}
        else{hit=d.kind==='preset'?await presetInstalled(d):installed(c,d);
          // A manually installed recovery updater may already supersede the
          // interrupted target. Accept only the current validated manifest code.
          if(!hit&&d.kind==='script'&&d.name===NAME&&newestUpdater&&newestUpdater.mark>=d.mark)hit=installed(c,newestUpdater);
          if(!hit&&d.kind==='pack')hit=d.items.every(i=>{const hits=M.scripts(c).filter(s=>s.name===i.name);return (i.retired||hits.length>0)&&hits.every(s=>M.scriptHash(s.content)===i.contentHash)});
        }
        confirmed=confirmed&&hit;
      }
      guard(s);if(!['prepared','world','presets','card','updater'].includes(old.state)||!old.beforeCard||!Array.isArray(old.plan)||!old.plan.length)throw Error('上次更新备份结构无效，已停止写入；请先导出备份检查');
      const archive='history:'+name+':'+old.release+':'+(old.at||'unknown');
      const completed={...old,state:confirmed?'complete':'superseded',confirmedAgainstRelease:confirmed?m.release:undefined,supersededBy:confirmed?undefined:m.release};
      await storage(archive,completed);if(M.encode(await storage(archive))!==M.encode(completed))throw Error('上次备份归档回读失败，已停止');
      Object.assign(old,completed,{archivedKey:archive});
      // Keep the active journal untouched until the player confirms and the new backup is committed.
    }
    // v17/18 can download the replacement but cannot remove retired entries. Finish only
    // that already-approved, byte-identical migration, retaining its original before-image.
    const resumeMigration=old?.state==='complete'&&old.release===m.release&&plan.length===1&&plan[0][1].kind==='pack'&&
      old.plan?.some(x=>x.descriptor.sha256===plan[0][1].sha256)&&plan[0][1].items.some(i=>i.retired&&M.scripts(c).some(s=>s.name===i.name))&&
      plan[0][1].items.every(i=>{const hits=M.scripts(c).filter(s=>s.name===i.name);return (i.retired||hits.length>0)&&hits.every(s=>M.scriptHash(s.content)===i.contentHash)});
    const resumeSavedWorld=old?.state==='world'&&old.release===m.release&&old.book===book&&old.plan.some(x=>x.descriptor.kind==='world');
    if(!plan.length){
      if(resumeSavedWorld&&world){await refreshWorldView(book,world,s);await bindSavedWorld(s,old);}
      await migrateWorldName(s,m);await verifyRelease(s,m,book);
      if(old&&old.state!=='complete'&&old.state!=='restored'){old.state='complete';await storage('journal:'+name,old);}
      await storage('installed:'+name,{release:m.release});status('done','所有官方组件版本已检查：'+m.release+'\n'+R.versionSummary);return;
    }
    R.showPanel=true;panel();
    R.total=plan.reduce((n,[k,d])=>n+d.bytes,0);R.loaded=0;
    const message='本次更新：\n'+plan.map(([k,d])=>d.label+(d.kind==='fields'?'（差异：'+M.fieldDiff(c,d.fieldHashes).map(k=>fieldLabels[k]).join('、')+'）':'')+' · '+mb(d.bytes)).join('\n')+(plan.some(([k,d])=>d.kind==='preset')?'\n专属预设仅安装/更新，不自动选择；原预设与连接保持当前选择。':'')+'\n总下载量：'+mb(R.total)+'\n将先保存备份，再逐项写入并验证。\n现在更新吗？';
    if(!resumeMigration&&!host.confirm(message)){status('cancelled','已取消更新，未写入。');return;}
    const files={};R.total=plan.reduce((n,[k,d])=>n+d.bytes,0);
    for(const [k,d]of plan){guard(s);const t=await download(d.path,d);status('verify','正在校验：'+d.label);validatePayload(d,t);files[k]=t;}
    stop();guard(s);
    const presetWrites={};
    for(const[key,d]of plan)if(d.kind==='preset')presetWrites[d.name]={applied:JSON.parse(files[key]),descriptor:d};
    // Persist full before-images once. Quota failure aborts before any host mutation.
    const resumeBookRename=old?.state==='complete'&&old.release===m.release&&old.book===book&&book===NEW_WORLD&&legacyBinding(b);
    let j=resumeMigration||resumeBookRename||old&&old.state!=='complete'&&old.state!=='restored'&&old.state!=='superseded'?old:{state:'prepared',release:m.release,name,book,binding:b,beforeCard:M.clone(c),beforeWorld:world?M.clone(world):null,beforePresets:M.clone(presetsBefore),beforePresetVersions:M.clone(presetVersionsBefore),previousBackupKey:old?.archivedKey||old?.previousBackupKey||null,plan:plan.map(([k,d])=>({key:k,descriptor:d})),at:new Date().toISOString()};
    if(j.book!==book)throw Error('恢复记录的世界书目标不一致');
    j.beforePresets=j.beforePresets||{};
    j.beforePresetVersions=j.beforePresetVersions||{};
    for(const [presetName,version]of Object.entries(presetVersionsBefore))if(!Object.hasOwn(j.beforePresetVersions,presetName))j.beforePresetVersions[presetName]=M.clone(version);
    for(const [k,d]of plan)if(d.kind==='preset'&&!Object.hasOwn(j.beforePresets,d.name)){
      if(j.plan.some(x=>x.key===k))throw Error('既有预设备份缺失，未写入');
      j.beforePresets[d.name]=M.clone(presetsBefore[d.name]);
    }
    for(const [k,d]of plan)if(!j.plan.some(x=>x.key===k))j.plan.push({key:k,descriptor:d});
    await storage('journal:'+name,j);const saved=await storage('journal:'+name);if(M.encode(saved)!==M.encode(j))throw Error('备份回读失败，已取消写入');
    const changed=await waitRead('核对下载期间角色卡',()=>readCard(name,s.avatar));if(M.encode(changed)!==M.encode(c))throw Error('下载期间角色卡已改变，已停止写入，请重新检查');guard(s);
    if(plan.some(([k,d])=>d.kind==='world')){const now=await readWorld(book);if(M.stable(now)!==M.stable(world))throw Error('下载期间世界书已改变，已停止写入，请重新检查');guard(s);}
    for(const [presetName,write]of Object.entries(presetWrites)){
      const fresh=await readPreset(presetName);guard(s);
      if(M.stable(fresh)!==M.stable(presetsBefore[presetName]))throw Error('下载期间预设已改变，已停止写入，请重新检查');
      if(!j.beforePresets||!Object.hasOwn(j.beforePresets,presetName))throw Error('预设备份缺失，未写入');
    }
    // The transaction now survives iframe replacement in the parent realm.
    const wd=plan.find(([k,d])=>d.kind==='world');
    if(wd){const [k]=wd;j.state='world';await storage('journal:'+name,j);
      await writeWorld('保存世界书',book,JSON.parse(files[k]),s);
      await bindSavedWorld(s,j);
    }else if(resumeSavedWorld&&world){
      await refreshWorldView(book,world,s);
      await bindSavedWorld(s,j);
    }
    for(const [presetName,write]of Object.entries(presetWrites)){
      j.state='presets';await storage('journal:'+name,j);
      await writeChecked('保存专属预设（不切换）',()=>savePreset(presetName,write.applied,presetsBefore[presetName]),async()=>M.hash(await readPreset(presetName))===M.hash(write.applied),s);
      await recordPresetVersion(write.descriptor,'installed-and-readback');

    }
    const cardPlan=plan.filter(([k,d])=>!['world','preset'].includes(d.kind));
    if(cardPlan.length){j.state='card';await storage('journal:'+name,j);await writeChecked('保存角色卡及更新器',()=>editCard(name,card=>{for(const [k,d]of cardPlan)M.apply(card,d,files[k]);return card;},s),async()=>{const read=await readCard(name,s.avatar);return cardPlan.every(([k,d])=>installed(read,d))},s);}
    await migrateWorldName(s,m);
    await verifyRelease(s,m,book);
    j.state='complete';await storage('journal:'+name,j);await storage('installed:'+name,{release:m.release});
    try{host.localStorage.setItem('xzs_notes',String(m.notes||''));}catch(_){}
    status('done','更新完成：'+m.release+'\n全部官方组件已保存并从服务器回读验证。\n'+R.versionSummary+'\n备份已保留，请整页刷新。'+(R.refreshNotes.length?'\n'+[...new Set(R.refreshNotes)].join('\n'):''));
  }

  async function verifyRelease(s,m,book){
    status('verify','正在逐项回读全部官方组件');const card=await readCard(s.name,s.avatar);guard(s);
    const failed=[];let world=null;
    for(const d of Object.values(m.components)){
      let ok;if(d.kind==='world'){world=await readWorld(book);ok=!!world&&worldHash(world)===d.contentHash;}
      else if(d.kind==='preset')ok=await presetInstalled(d);else ok=installed(card,d);
      guard(s);if(!ok)failed.push(d.label);
    }
    if(failed.length)throw Error('以下组件尚未保存完整：'+failed.join('、')+'；已停止报告完成，请重试检查');
    const wb=world&&worldEntries(world).find(e=>e.comment===WB_MARK)?.content;
    R.versionSummary='安装包版本：'+m.release+'\n卡片版本：'+card.version+'\n世界书构建：'+(wb||m.release)+'\n更新器：第'+Math.max(...M.scripts(card).filter(s=>s.name===NAME).map(s=>M.mark(s.content)))+'版'+(Object.values(m.components).some(d=>d.kind==='preset')?'\n专属预设：云端版本已登记（保持当前预设选择）':'');
  }

  function check(manual=true){if(R.busy){R.showPanel=true;panel();return R.promise;}R.busy=true;R.cancelled=false;R.showPanel=manual;
    const work=async()=>{try{await execute(manual);}catch(e){R.showPanel=true;status(R.cancelled?'cancelled':'error',(R.cancelled?'已取消。':'更新未完成：')+e.message+'\n可重试检查；若已有备份，可按需导出或恢复。');}finally{R.busy=false;panel();}};
    R.promise=withLock(work);return R.promise;
  }
  async function currentJournal(){const ctx=context();if((ctx.groupId??ctx.group_id)!=null&&String(ctx.groupId??ctx.group_id)!=='')throw Error('请从对应角色卡读取更新备份');const s={identity:identity(),binding:M.stable(binding())};const c=await waitRead('读取备份角色卡',()=>readCard('current'));guard(s);const name=String(c.avatar||'').replace(/\.png$/,'');const j=await storage('journal:'+name);guard(s);if(!j)throw Error('当前角色卡没有本地备份');if(j.name!==name||!j.beforeCard||typeof j.beforeCard!=='object'||j.beforeCard.avatar&&j.beforeCard.avatar!==c.avatar||!Array.isArray(j.plan)||!j.plan.length||j.plan.some(x=>!x||!x.descriptor||!['world','script','pack','regex','fields','preset'].includes(x.descriptor.kind)))throw Error('备份目标或组件记录无效，已停止恢复');s.name=name;s.avatar=c.avatar;return {journal:j,scope:s};}
  async function exportBackup(){try{const {journal:j}=await currentJournal(),history=[],seen=new Set();let key=j.previousBackupKey;while(key){if(seen.has(key))throw Error('历史备份链重复');seen.add(key);const prior=await storage(key);if(!prior)throw Error('历史备份缺失');history.push(prior);key=prior.previousBackupKey;}const blob=new host.Blob([M.encode(history.length?{...j,previousBackups:history}:j)],{type:'application/json'});const u=host.URL.createObjectURL(blob),a=host.document.createElement('a');a.href=u;a.download='新中市更新备份-'+j.release+'.json';a.click();timer(()=>host.URL.revokeObjectURL(u),1000);}catch(e){status('error','导出失败：'+e.message);}}
  function recover(){if(R.busy)return R.promise;R.busy=true;
    R.promise=withLock(recoverWork);return R.promise;
  }
  function withLock(work){return Promise.resolve().then(()=>host.navigator?.locks?host.navigator.locks.request('xzs-updater-write17',{ifAvailable:true},lock=>{if(!lock)throw Error('其他页面正在更新或恢复，请稍后重试');return work();}):work()).catch(e=>{R.busy=false;status('error','更新操作未完成：'+(e?.message||e));});}
  async function recoverWork(){try{
    R.refreshNotes=[];
    const {journal:j,scope:s}=await currentJournal();if(!host.confirm('恢复本角色卡最近一次更新前的组件和世界书？聊天消息不会被替换。'))return;
    for(const item of j.plan.filter(x=>x.descriptor.kind==='preset')){
      if(!j.beforePresets||!Object.hasOwn(j.beforePresets,item.descriptor.name))throw Error('预设备份缺失，未恢复');
      if(j.beforePresets[item.descriptor.name]===null&&context().getPresetManager?.('openai')?.getSelectedPresetName()===item.descriptor.name)throw Error('请先手动切换到其他预设，再恢复本次新增预设');
    }
    guard(s);j.state='restoring';await storage('journal:'+j.name,j);
    if(j.plan.some(x=>x.descriptor.kind==='world')&&j.beforeWorld){
      if(Array.isArray(j.beforeWorld)){
        // Older journals stored the helper projection rather than the raw server file.
        const expected=M.hash(M.world(j.beforeWorld));let persisted;
        await writeChecked('恢复世界书',async()=>{
          const createOrReplace=api('createOrReplaceWorldbook',false);
          if(createOrReplace)return createOrReplace(j.book,M.clone(j.beforeWorld),{render:'immediate'});
          if(!await readWorld(j.book)){await writeWorld('重建待恢复世界书',j.book,{entries:{}},s);}
          return api('replaceWorldbook')(j.book,M.clone(j.beforeWorld));
        },async()=>{
          persisted=await readWorld(j.book);return !!persisted&&worldHash(persisted)===expected;
        },s,{retries:1,polls:24,gap:2000});
        await refreshWorldView(j.book,persisted,s);
      }else await writeWorld('恢复世界书',j.book,j.beforeWorld,s);
    }
    for(const item of j.plan.filter(x=>x.descriptor.kind==='preset')){
      const presetName=item.descriptor.name,before=j.beforePresets[presetName];
      await writeChecked('恢复专属预设备份',()=>before===null?presetPost('/api/presets/delete',{name:presetName,apiId:'openai'}):savePreset(presetName,before),async()=>M.stable(await readPreset(presetName))===M.stable(before),s);
      await storage('preset-base:'+presetName,j.beforePresetBases?.[presetName]||null);
      const versionBefore=j.beforePresetVersions?.[presetName];
      await storage(presetVersionKey(presetName),versionBefore?{...versionBefore,recordedAt:Date.now()}:null);
    }
    await writeChecked('恢复角色卡组件',()=>editCard(j.name,card=>{
      guard(s);const e=M.ext(card),old=M.ext(j.beforeCard);e.tavern_helper=e.tavern_helper||{};
      const owned=new Set(j.plan.flatMap(x=>M.ownedNames(x.descriptor)));
      M.restoreScripts(card,j.beforeCard,owned);
      const regexNames=new Set(j.plan.filter(x=>x.descriptor.kind==='regex').flatMap(x=>x.descriptor.items.map(i=>i.name)));
      if(regexNames.size)e.regex_scripts=(e.regex_scripts||[]).filter(x=>!regexNames.has(M.rxName(x))).concat((old.regex_scripts||[]).filter(x=>regexNames.has(M.rxName(x))).map(M.clone));
      if(j.plan.some(x=>x.descriptor.kind==='fields'))for(const k of Object.keys(M.fields(j.beforeCard)))card[k]=M.clone(j.beforeCard[k]??(k==='first_messages'?[]:''));
      return card;
    },s),async()=>{
      const card=await readCard(j.name,s.avatar);
      return j.plan.filter(x=>!['world','preset'].includes(x.descriptor.kind)).every(x=>{const d=x.descriptor;if(d.kind==='fields')return M.fieldsReadable(card)&&M.hash(M.canonicalFields(card))===M.hash(M.canonicalFields(j.beforeCard));if(d.kind==='regex'){const names=d.items.map(i=>i.name),owned=c=>(M.ext(c).regex_scripts||[]).filter(r=>names.includes(M.rxName(r)));return M.hash(owned(card))===M.hash(owned(j.beforeCard));}const names=M.ownedNames(d),owned=c=>M.scripts(c).filter(x=>names.includes(x.name)).sort((a,b)=>String(a.id).localeCompare(String(b.id)));return M.hash(owned(card))===M.hash(owned(j.beforeCard));});
    },s);
    await restoreWorldName(s,j);
    // Only undo our added binding; never delete a book or revert unrelated global edits.
    if(j.addedBinding){guard(s);const now=binding();if(now.global.includes(j.book)){await waitWrite('恢复世界书绑定',()=>api('rebindGlobalWorldbooks')(now.global.filter(n=>n!==j.book)));if(binding().global.includes(j.book))throw Error('恢复世界书绑定未通过回读');s.binding=M.stable(binding());}}
    j.state='restored';await storage('journal:'+j.name,j);status('done','已恢复更新前的组件。'+(j.beforeWorld?'':'备份时目标世界书尚不存在，无旧世界书需要恢复。')+'新建的世界书文件保留，未删除聊天或存档。请刷新页面。'+(R.refreshNotes.length?'\n'+[...new Set(R.refreshNotes)].join('\n'):''));
  }catch(e){status('error','恢复未完成：'+e.message+'。备份仍保留。');}finally{R.busy=false;panel();}}
  R.api={check,recover,exportBackup,state:R,model:M};window.__xzsUpdater=R.api;
  R.autoTimer=timer(()=>check(false),CONFIG.auto);
  return R.api;
  }
})();
