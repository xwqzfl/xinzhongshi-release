/*XZS_UPDATER:12*/
// 新中市自动更新器 —— 本脚本默认**永不改动**，只做一件事：把卡内脚本与世界书换成云端最新版。
// 为什么单独放一条脚本：更新器是整套东西里唯一「不能坏」的组件。它只改别的脚本的内容，
// 默认不改自己，所以任何一次坏发布都锁不死玩家（要给更新器加新能力时，才在发布时带 --updater）。
// 玩家端：进卡自动检查 → 弹确认 → 应用 → 重载页面；也可以点脚本按钮「检查更新」手动触发。
(function () {
  // ⚠ 2026-10-09：取源不再写死单点。raw.githubusercontent.com 国内经常不通，
  //   玩家没代理就永远收不到更新（实测直连只有 jsDelivr 系可用）。现在按序回退，
  //   哪条通了就记住它，后续文件都走它，不必每个文件都把死源重试一遍。
  var RAW_MIRRORS = [
    { u: 'https://raw.githubusercontent.com/xwqzfl/xinzhongshi-release/main/', k: '' },
    { u: 'https://api.github.com/repos/xwqzfl/xinzhongshi-release/contents/', k: 'ghapi' },
    { u: 'https://fastly.jsdelivr.net/gh/xwqzfl/xinzhongshi-release@main/', k: '' },
    { u: 'https://cdn.jsdelivr.net/gh/xwqzfl/xinzhongshi-release@main/', k: '' },
    { u: 'https://ghproxy.net/https://raw.githubusercontent.com/xwqzfl/xinzhongshi-release/main/', k: '' },
    { u: 'https://gh-proxy.com/https://raw.githubusercontent.com/xwqzfl/xinzhongshi-release/main/', k: '' }
  ];
  var RAW_IDX = 0;
  var RAW = RAW_MIRRORS[0].u;
  var APP = '新中市通讯 · 验证版 1.0';      // 被更新的目标脚本
  var SONG = '唱歌 · 音频直链';              // 另一个被更新的卡内脚本（歌曲/演奏/演出标记→内联播放器）
  var CARD_MATCH = '新中市人间世';           // 只在自家卡上工作
  var BUILD_RE = /\/\*XZS_BUILD:([\w.\-]+)\*\//;
  var LS_BACKUP = 'xzs_updater_backup';
  var LS_CF = 'xzs_cf_hash';        // 已应用的卡字段哈希（卡字段写在卡里，删不掉；这条标记够用）
  var LS_NOTES = 'xzs_notes';       // 最近一次更新的更新日志（app 的修复页会读它显示「本版更新」）
  var UPDATER_NAME = '新中市更新器';   // 我自己这条脚本的名字（自更新时用）
  var WB_MARK = '【系统】世界书版本';   // 发布时烤进世界书的**禁用条目**，玩家端读它做完整性检查
  // 自更新的版本标记：卡里的脚本会被酒馆重新序列化（换行等），所以**不能拿内容哈希比**，
  // 用源码首行的这个标记比才稳。改更新器时把它 +1，并在发布时带 --updater。
  var MARK_RE = /\/\*XZS_UPDATER:(\d+)\*\//;
  // 唱歌脚本同理：它没有 build 标记，用自己的版本标记比对（清单里的 songMark）
  var SONG_MARK_RE = /\/\*XZS_SONG:(\d+)\*\//;
var JB_NAMES = ['加强破限A', '加强破限B'];   // 两条卡内破限脚本（随更新包分发，玩家可自行启用/停用）
var JB_MARK_RE = /\/\*XZS_JB:(\d+)\*\//;
  var CHECK_DELAY = 8000;

  // 脚本 iframe 里这些是全局函数；退化时从父页 TavernHelper 拿一份
  function api(name) {
    try { if (typeof window[name] === 'function') return window[name].bind(window); } catch (e) {}
    try { var T = window.parent.TavernHelper; if (T && typeof T[name] === 'function') return T[name].bind(T); } catch (e) {}
    return null;
  }
  function say(kind, msg) {
    try { console.log('[新中市更新] ' + kind + ' | ' + msg); } catch (e) {}
    try { var t = window.toastr; if (t && typeof t[kind] === 'function') t[kind](msg, '新中市更新', { timeOut: kind === 'error' ? 15000 : 6000 }); } catch (e) {}
  }
  function cfFp(fm) {
    return fnv1a(fm.map(function (x) { return String(x).replace(/\r\n?/g, '\n'); }).join('\u0001'));
  }

  function fnv1a(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }
// 失败重试：fn 返回 Promise；失败后等 ms 再试，共 tries 次。写卡这种大请求靠它扛瞬时抖动。
  function withRetry(fn, tries, ms) {
    tries = tries || 3;
    return fn().catch(function (e) {
      if (tries <= 1) throw e;
      return new Promise(function (r) { setTimeout(r, ms || 1500); })
        .then(function () { return withRetry(fn, tries - 1, (ms || 1500) * 2); });
    });
  }
  function lsGet(k) { try { return window.localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  var TRY_TIMEOUT = 15000;   // 单个源最多等 15 秒；不通的源若是「挂住」而不是「秒失败」，
                             // 没有这条就会一直等下去（国内 raw 常见这种表现）
  // contents 接口的地址与普通 raw 不同：要 ?ref=main，并带 Accept 头才返回原文
  function urlOf(base, path) {
    return base.k === 'ghapi' ? (base.u + path + '?ref=main') : (base.u + path);
  }
  function fetchOne(base, path) {
    var opt = { cache: 'no-store' };
    if (base.k === 'ghapi') opt.headers = { 'Accept': 'application/vnd.github.raw' };
    return new Promise(function (resolve, reject) {
      var ac = (typeof AbortController === 'function') ? new AbortController() : null;
      opt.signal = ac ? ac.signal : undefined;
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        try { if (ac) ac.abort(); } catch (e) {}
        reject(new Error('超时'));
      }, TRY_TIMEOUT);
      fetch(urlOf(base, path), opt).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      }).then(function (t) {
        if (done) return;
        done = true; clearTimeout(timer); resolve(t);
      }).catch(function (e) {
        if (done) return;
        done = true; clearTimeout(timer); reject(e);
      });
    });
  }
  // 传**相对文件名**（如 'manifest.json'），按 RAW_MIRRORS 顺序试；通了就把它设为当前源。
  function fetchText(path) {
    var i = RAW_IDX;
    function next() {
      if (i >= RAW_MIRRORS.length) {
        RAW_IDX = 0;
        return Promise.reject(new Error('所有更新源都取不到 ' + path + '（请检查网络或代理）'));
      }
      var base = RAW_MIRRORS[i];
      return fetchOne(base, path).then(function (t) {
        RAW_IDX = i; RAW = base.u;
        return t;
      }).catch(function () { i++; return next(); });
    }
    return next();
  }
  // ⚠ getCharacter 返回的是**扁平化**的 Character：extensions 在顶层（不在 data 下），
  //   而且**没有 name 字段** —— 卡名藏在 avatar（'<卡名>.png'）里。这两点都踩过。
  function scriptsOf(ch) {
    try { return (ch.extensions.tavern_helper.scripts) || []; } catch (e) {}
    try { return (ch.data.extensions.tavern_helper.scripts) || []; } catch (e) {}   // 兼容旧形状
    return [];
  }
  function appScriptOf(ch) {
    var ss = scriptsOf(ch);
    for (var i = 0; i < ss.length; i++) if (ss[i].name === APP) return ss[i];
    return null;
  }
  // 取**真实卡名**，用于 updateCharacterWith / replaceCharacter。
  // ⚠ 必须验证候选名**真的存在**：fromCharacterToPayload 用 `名字 + '.png'` 当 avatar_url 写回文件，
  //   名字错了会把卡写到别的文件、或直接抛「角色卡 'X' 不存在」。
  //   （2026-09-15 踩过：优先用的 ctx.characters[characterId].avatar 回了一个不存在的旧卡名，
  //    更新在最后一步失败。）所以这里**逐个候选拿 getCharacter 验一遍**，能取到才算数。
  function resolveCardName(ch) {
    var cands = [];
    function push(x) { x = String(x || '').replace(/\.png$/, ''); if (x && cands.indexOf(x) < 0) cands.push(x); }
    try { var g = api('getCurrentCharacterName'); if (g) push(g()); } catch (e) {}
    try { if (ch && ch.avatar) push(ch.avatar); } catch (e) {}
    try {
      var ctx = (window.SillyTavern && window.SillyTavern.getContext) ? window.SillyTavern.getContext() : null;
      if (ctx && ctx.name2) push(ctx.name2);
    } catch (e) {}
    if (!cands.length) return Promise.resolve('');
    var gc = api('getCharacter');
    if (!gc) return Promise.resolve(cands[0]);
    var i = 0;
    function next() {
      if (i >= cands.length) return Promise.resolve('');
      var nm = cands[i++];
      return Promise.resolve(gc(nm)).then(function () { return nm; }, function () { return next(); });
    }
    return Promise.resolve(next());
  }
  function buildOf(text) { var m = BUILD_RE.exec(text || ''); return m ? m[1] : ''; }
  // 构建号末段是 14 位时间戳（YYYYMMDDHHmmss）。版本比对**只认它** —— 别拿整个构建号做字符串比较。
  function buildNum(b) { var m = /(\d{14})\s*$/.exec(String(b || '')); return m ? Number(m[1]) : 0; }
  function isOurCard(ch) {
    var s = '';
    try { s = String(ch.avatar || ''); } catch (e) {}
    if (!s) { try { s = String(ch.name || ''); } catch (e) {} }
    return s.indexOf(CARD_MATCH) >= 0;
  }

  // 找到玩家当前那本新中市世界书（先精确匹配清单声明的名字、再按前缀匹配）；找不到返回 ''
  function findWbName(names, mf) {
    var i;
    for (i = 0; i < names.length; i++) if (String(names[i]) === mf.worldbookName) return String(names[i]);
    for (i = 0; i < names.length; i++) if (String(names[i]).indexOf(mf.worldbookNamePrefix) === 0) return String(names[i]);
    return '';
  }
  // 所有可能挂载世界书的地方都问一遍：全局激活 + 角色卡绑定 + 聊天绑定
  function allWbNames() {
    var out = [], i, v;
    function add(x) { if (x && out.indexOf(String(x)) < 0) out.push(String(x)); }
    try { var g = api('getGlobalWorldbookNames'); if (g) (g() || []).forEach(add); } catch (e) {}
    try {
      var c = api('getCharWorldbookNames');
      if (c) { v = c('current') || {}; add(v.primary); (v.additional || []).forEach(add); }
    } catch (e) {}
    try { var q = api('getChatWorldbookName'); if (q) add(q('current')); } catch (e) {}
    return out;
  }
  // 世界书的**真实状态**：当前那本叫什么、书里记的版本号是什么。书没了 → name 为空。
  function wbState(mf) {
    var gw = api('getWorldbook');
    if (!gw) return Promise.resolve({ name: '', build: '' });
    var name = findWbName(allWbNames(), mf);
    if (!name) return Promise.resolve({ name: '', build: '' });
    return Promise.resolve(gw(name)).then(function (eb) {
      var b = '';
      try {
        for (var i = 0; i < (eb || []).length; i++) {
          var nm = String(eb[i].name || eb[i].comment || '');
          if (nm === WB_MARK) { b = String(eb[i].content || ''); break; }
        }
      } catch (e) {}
      return { name: name, build: b };
    }).catch(function () { return { name: name, build: '' }; });
  }

  // 世界书：写进玩家**当前已经激活**的那本（名字带不带版本号都认，按前缀匹配）；
  // 没有匹配的才用清单里声明的名字，并把它追加进全局激活（保留其它书）。
  function syncWorldbook(mf, wbText) {
    // 必须用 importRawWorldbook：它直接吃**原始文件格式**（{entries:{...}}）。
    // createOrReplaceWorldbook 吃的是另一种条目形状，拿原始文本喂它会写坏书 —— 所以不做降级。
    var imp = api('importRawWorldbook');
    if (!imp) return Promise.resolve('跳过世界书（本机酒馆助手不支持 importRawWorldbook）');
    var names = allWbNames();
    var target = findWbName(names, mf);
    var needsBind = false;
    if (!target) { target = mf.worldbookName; needsBind = true; }
    return Promise.resolve(imp(target, wbText)).then(function () {
      if (!needsBind) return '世界书已更新：' + target;
      try {
        var rb = api('rebindGlobalWorldbooks');
        if (!rb) return '世界书已写入 ' + target + '（但没能自动激活，请在世界书界面手动勾选一次）';
        return Promise.resolve(rb(names.concat([target]))).then(function () { return '世界书已更新并激活：' + target; });
      } catch (e) { return '世界书已写入 ' + target + '（激活失败，请手动勾选一次）'; }
    });
  }

  function check(manual) {
    var getChar = api('getCharacter'), updChar = api('updateCharacterWith');
    if (!getChar || !updChar) { if (manual) say('error', '酒馆助手接口不可用，无法检查更新'); return Promise.resolve(); }
    var mf = null, wbSt = { name: '', build: '' }, chRef = null, nm = '';
    // 顺序：当前卡（顺便定出**真实卡名**）→ 清单 → 世界书真实状态。全程扁平，不嵌套。
    return Promise.resolve(getChar('current')).then(function (ch) {
      chRef = ch;
      return resolveCardName(ch);
    }).then(function (n) {
      nm = n;
      return fetchText('manifest.json');
    }).then(function (txt) {
      mf = JSON.parse(txt);
      if (!mf || !mf.build || !mf.payloads) throw new Error('清单格式不对');
      return wbState(mf);
    }).then(function (st) {
      wbSt = st || { name: '', build: '' };
      var ch = chRef;
      if (!isOurCard(ch)) { if (manual) say('warning', '当前不是新中市的角色卡'); return; }
      var app = appScriptOf(ch);
      if (!app) { if (manual) say('error', '这张卡里找不到「' + APP + '」脚本'); return; }
      var local = buildOf(app.content);
      // 三样东西**各自独立**判断，任何一样缺了/落后都要补。
      // ⚠ 用**时间戳**比，别拿整个构建号做字符串比较 ——「2026.10.2-…」在字符串上**小于**「2026.9.30-…」
      //   （逐字符比到第 6 位 '1' < '9'），月份跨到两位数后线上永远被判成「不比本地新」，
      //   玩家从此再也收不到脚本更新（2026-10-02 用户报：更新框说 10.2、小手机里还是 9.30，
      //   钱包/信用贷/FX 三个新应用一个都不见）。版本号那部分是独立判断，所以它照常更新了。
      var needScript = !(local && buildNum(local) > 0 && buildNum(mf.build) <= buildNum(local));   // 只升不降：raw 有几分钟 CDN 缓存，可能取到旧清单
      // 世界书：**实检** —— 书不存在（玩家删了 / 新玩家还没有）或书里的版本标记对不上 → 补。
      // 绝不能用 localStorage 记"我应用过"：玩家把书删了标记还在，就会误判成不用更新（2026-09-15 实测踩到）。
      var needWb = (!wbSt.name) || (wbSt.build !== mf.build);
      // 卡字段：**实检** —— 跟清单里记的开场白条数/首楼长度对不上就补（玩家导入旧卡也能发现）
      // 卡版本号：**独立于卡字段**同步。以前它跟着卡字段一起写，开场白/首楼没变时连它一起跳过
      //   → 玩家看到「更新到 10.2」、卡里却还写着 9.30，以为更新失败（2026-10-02 用户报）。
      var myVer = (ch && ch.version != null) ? String(ch.version) : '';
      var needVer = !!(mf.cardVersion && String(mf.cardVersion) !== myVer);
      var needCf = false;
      if (mf.payloads['cardfields.json']) {
        var fm = null; try { fm = ch.first_messages || null; } catch (e) {}
        var cfi = mf.cardFields || {};
        var myGreet = fm ? (fm.length - 1) : -1;
        var myFirst = (fm && fm[0]) ? String(fm[0]).length : -1;
        // ⚠ 这里**绝不能**依赖 localStorage 标记：标记一旦写不进去（隐私模式 / 存储被清 / 沙箱），
        //   条件就永远为真 → 玩家无限弹「需要更新」（2026-09-16 实测踩到：改了卡内版本号后，
        //   首楼内容变了但条数与长度没变，前两个条件检测不到，全靠标记 → 全员循环）。
        //   改为比对「卡里真实内容的指纹」：归一换行后对 首楼+全部开场白 求 fnv1a，纯函数、可自愈。
        var cfKey = String(mf.build || '') + '|' + String(mf.payloads['cardfields.json'].hash || '');
        // ⚠ 2026-10-09 实测修：**整条都要 !!fm 守卫**。原来只有第三条有，前两条没有 ——
          //   读不到 first_messages 时 myGreet/myFirst 被置成 -1，于是必然 != 清单值，
          //   卡片还没 hydrate 的那一刻就被判成「卡字段不一样」，玩家看到「检测到卡字段更新」
          //   而版本号明明一致（用户报：新建聊天时概率弹出）。
          //   读不到就当作**未知**，不当作**不同**：这次跳过，下次读到再判，不会漏更新。
          var cfDiff = !!fm && ((cfi.greetings !== undefined && myGreet !== cfi.greetings) ||
                                (cfi.firstMesLen !== undefined && myFirst !== cfi.firstMesLen) ||
                                (cfi.fp !== undefined && cfFp(fm) !== cfi.fp));
        // 这一版的卡字段**已经成功写入过**就不再提示：只在写成功后记，写失败不记 → 仍会重试，
        // 不会退化成死循环（2026-09-16 那次教训是「标记写不进去 → 条件永远为真」，
        // 这里是反方向：标记只用来**抑制**提示，写不进去最多是继续提示，不会卡死）。
        // 用途：兜住「同一个 build 反复提示卡字段」的一切未知成因
        //（用户报：回到上一版本的聊天记录继续玩，又弹「本次更新：卡字段（开场白等）」）。
        var cfApplied = (lsGet(LS_CF) === cfKey);
        needCf = cfDiff && !cfApplied;
        if (cfDiff) {
          try {
            console.log('[更新器] 卡字段核对', { build: mf.build, myGreet: myGreet, wantGreet: cfi.greetings,
              myFirst: myFirst, wantFirst: cfi.firstMesLen, myFp: fm ? cfFp(fm) : '', wantFp: cfi.fp,
              appliedBefore: cfApplied });
          } catch (e) {}
        }
      }
      // 更新器自己：**默认永远不动**（清单里 updateUpdater 不开就绝不碰它 —— 它是唯一不能坏的组件）。
      // 我需要修更新器时，在发布时打开这个开关，它就会连自己一起换；靠源码首行的标记号比对。
      var needUpdater = false;
      if (mf.updateUpdater && mf.payloads['updater.js']) {
        var mine = null, sss = scriptsOf(ch);
        for (var q = 0; q < sss.length; q++) if (String(sss[q].name) === UPDATER_NAME) mine = sss[q];
        var myMark = mine ? (MARK_RE.exec(String(mine.content || '')) || [])[1] : '';
        needUpdater = String(myMark || '') !== String(mf.updaterMark || '');
      }
      // 唱歌脚本（歌曲/演奏/演出标记 → 内联播放器）：与更新器同样用**源码首行的标记号**比对，
      // 不能拿内容哈希比（卡里的脚本会被酒馆重新序列化）。清单里没这个包时跳过。
      var needSong = false;
      if (mf.payloads['songscript.js']) {
        var songScr = null, sss2 = scriptsOf(ch);
        for (var q2 = 0; q2 < sss2.length; q2++) if (String(sss2[q2].name) === SONG) songScr = sss2[q2];
        var songMark = songScr ? (SONG_MARK_RE.exec(String(songScr.content || '')) || [])[1] : '';
        needSong = String(songMark || '') !== String(mf.songMark || '');
      }
      // 破限脚本：同上，用源码首行的标记号比对
      var needJb = false;
      if (mf.payloads['jailbreaks.json']) {
        var jbScr = null, sss3 = scriptsOf(ch);
        for (var q3 = 0; q3 < sss3.length; q3++) if (String(sss3[q3].name) === JB_NAMES[0]) jbScr = sss3[q3];
        var jbMark = jbScr ? (JB_MARK_RE.exec(String(jbScr.content || '')) || [])[1] : '';
        needJb = String(jbMark || '') !== String(mf.jbMark || '');
      }
      if (!needScript && !needWb && !needCf && !needVer && !needUpdater && !needSong && !needJb) { if (manual) say('info', '已是最新版本（' + local + '）'); return; }
      var todo = [];
      if (needScript) todo.push('卡内脚本');
      if (needSong) todo.push('唱歌播放器');
      if (needJb) todo.push('破限脚本');
      if (needWb) todo.push('世界书');
      if (needCf) todo.push('卡字段（开场白等）');
      if (needVer) todo.push('卡版本号');
      if (needUpdater) todo.push('更新器本身');
      var notes = String(mf.notes || '').trim();
      var ok = window.confirm(
        '检测到需要更新！\n\n当前版本：' + (local || '（未标记）') + '\n最新版本：' + mf.build +
        '\n\n本次会更新：' + todo.join(' + ') +
        '\n\n本次更新内容请在手机 App「版本回顾」里查看。' +
        '\n更新后自动重载页面。\n现在更新吗？'
      );
      if (!ok) { say('info', '已取消更新'); return; }

      say('info', '正在下载：' + todo.join('、') + '…');
      var shellText = '', wbText = '', cfText = '', updText = '', songText = '', jbText = '';
      var chain = Promise.resolve();
      if (needScript) chain = chain.then(function () {
        return fetchText('shell.js').then(function (t) {
          shellText = t;
          if (fnv1a(t) !== mf.payloads['shell.js'].hash) throw new Error('脚本校验失败（可能是刚发布、缓存还没刷新，过几分钟再试）');
          if (buildOf(t) !== mf.build) throw new Error('脚本里的版本标记与清单不一致');
        });
      });
      if (needWb) chain = chain.then(function () {
        return fetchText('worldbook.json').then(function (t) {
          wbText = t;
          if (fnv1a(t) !== mf.payloads['worldbook.json'].hash) throw new Error('世界书校验失败（缓存没过期？过几分钟再试）');
          if (!JSON.parse(t).entries) throw new Error('世界书里没有 entries');
        });
      });
      if (needCf) chain = chain.then(function () {
        return fetchText('cardfields.json').then(function (t) {
          cfText = t;
          if (fnv1a(t) !== mf.payloads['cardfields.json'].hash) throw new Error('卡字段校验失败（缓存没过期？过几分钟再试）');
        });
      });
      if (needUpdater) chain = chain.then(function () {
        return fetchText('updater.js').then(function (t) {
          updText = t;
          if (fnv1a(t) !== mf.payloads['updater.js'].hash) throw new Error('更新器校验失败（缓存没过期？过几分钟再试）');
          var mk = (MARK_RE.exec(t) || [])[1];
          if (String(mk || '') !== String(mf.updaterMark || '')) throw new Error('更新器的版本标记与清单不一致');
        });
      });
      if (needSong) chain = chain.then(function () {
        return fetchText('songscript.js').then(function (t) {
          songText = t;
          if (fnv1a(t) !== mf.payloads['songscript.js'].hash) throw new Error('唱歌播放器校验失败（缓存没过期？过几分钟再试）');
          var sk = (SONG_MARK_RE.exec(t) || [])[1];
          if (String(sk || '') !== String(mf.songMark || '')) throw new Error('唱歌播放器的版本标记与清单不一致');
        });
      });
      if (needJb) chain = chain.then(function () {
        return fetchText('jailbreaks.json').then(function (t) {
          jbText = t;
          if (fnv1a(t) !== mf.payloads['jailbreaks.json'].hash) throw new Error('破限脚本校验失败（缓存没过期？过几分钟再试）');
        });
      });
      return chain.then(function () {
        if (needScript) lsSet(LS_BACKUP + '|' + mf.build, app.content);   // 旧脚本内容留档，出问题可回滚
        return wbText ? syncWorldbook(mf, wbText) : '世界书无需更新';
      }).then(function (wbMsg) {
        if (!needScript && !needCf && !needVer && !needUpdater && !needSong && !needJb) return wbMsg;   // 只更新世界书时不用写卡
        if (!nm) throw new Error('读不到真实卡名，放弃写入（避免写坏卡）');
        var cf = null;
        if (cfText) { try { cf = JSON.parse(cfText); } catch (e) { cf = null; } }
        // 卡内脚本 + 卡字段 +（偶尔）更新器自己 —— **一次写完**，分两次写会有竞态
        // ⚠ 2026-10-09：写卡本身容易瞬时失败（要写 8.8MB 的卡）。以前失败即抛，玩家得反复点
          //   「检查更新」——而每次点击都要把约 10MB 的包重下一遍，所以才「要多点几遍」。
          //   这里对写卡单独重试 3 次（1.5s / 3s 退避），绝大多数瞬时失败一次就过去了。
          return withRetry(function () { return updChar(nm, function (c) {
          var ss = scriptsOf(c), i;
          if (needScript) { for (i = 0; i < ss.length; i++) if (ss[i].name === APP) ss[i].content = shellText; }
          if (needUpdater) {
            for (i = 0; i < ss.length; i++) if (String(ss[i].name) === UPDATER_NAME) {
              lsSet(LS_BACKUP + '|updater|' + mf.build, ss[i].content);   // 旧更新器留档，出问题能在控制台回滚
              ss[i].content = updText;
            }
          }
          if (needSong) {
            for (i = 0; i < ss.length; i++) if (String(ss[i].name) === SONG) {
              lsSet(LS_BACKUP + '|song|' + mf.build, ss[i].content);   // 旧唱歌脚本留档，出问题能在控制台回滚
              ss[i].content = songText;
            }
          }
          if (needJb && jbText) {
            var jbPack = null; try { jbPack = JSON.parse(jbText); } catch (e) {}
            if (jbPack && jbPack.scripts) jbPack.scripts.forEach(function (it) {
              var hit = null;
              for (var j = 0; j < ss.length; j++) if (String(ss[j].name) === it.name) hit = ss[j];
              if (hit) {
                lsSet(LS_BACKUP + '|jb|' + it.name, hit.content);   // 旧的留档
                hit.content = it.content;                          // ⚠ 只换内容，**保留玩家设的 enabled**
              } else {
                ss.push({
                  type: 'script', enabled: false, name: it.name,
                  id: String(Date.now()) + '-' + Math.round(Math.random() * 1e9),
                  content: it.content,
                  info: '破限注入（injectPrompts，对酒馆所有生成生效）。与另一条共用开关，后运行的覆盖前一个。',
                  button: { enabled: true, buttons: [] }, data: {}, export_with: { data: true, button: true },
                });
              }
            });
          }
          if (cf) {
            // first_messages = [首楼, ...开场白]，扩展会按同样顺序拆回 first_mes / alternate_greetings，
            // 所以玩家那套「按序号指开场白」不会错位。
            if (cf.first_messages && cf.first_messages.length) c.first_messages = cf.first_messages;
            if (cf.version != null) c.version = cf.version;
            if (cf.creator != null) c.creator = cf.creator;
            if (cf.creator_notes != null) c.creator_notes = cf.creator_notes;
            if (cf.description != null) c.description = cf.description;
          }
          // 版本号单独同步：卡字段没变时也要写（见上面 needVer 的说明）
          if (needVer && mf.cardVersion) c.version = String(mf.cardVersion);
          return c;
        }); }, 3, 1500).then(function () {
          // 记下已应用的卡字段哈希（世界书不用记：版本标记就写在书里，删书即失效）
          if (needCf) lsSet(LS_CF, String(mf.build || '') + '|' + String(mf.payloads['cardfields.json'].hash || ''));
          if (notes) lsSet(LS_NOTES, notes);        // 供 app 的修复页显示「本版更新」
          if (cf && cf.first_messages) wbMsg += '｜卡字段已更新（开场白 ' + Math.max(0, cf.first_messages.length - 1) + ' 条）';
          if (needSong) wbMsg += '｜唱歌播放器已更新';
          if (needVer) wbMsg += '｜卡版本号已同步为 ' + mf.cardVersion;
          if (needJb) wbMsg += '｜破限脚本已更新';
          if (needUpdater) wbMsg += '｜更新器已更新（重载后生效）';
          return wbMsg;
        });
      }).then(function (wbMsg) {
        say('success', '更新完成（' + mf.build + '）｜' + wbMsg + '｜即将重载页面');
        setTimeout(function () { try { window.parent.location.reload(); } catch (e) { location.reload(); } }, 2000);
      });
    }).catch(function (e) {
      var m = (e && e.message) ? String(e.message) : String(e);
      // 网络波动 / 服务端返回非 2xx 时，扩展抛的是它自己的技术文案（形如「修改角色卡 'X' 失败: (404)」），
      // 玩家看了会以为卡坏了。换成一句人话，并说明会自动重试。
      // 之所以能自愈：卡字段/世界书的「已应用」标记只在**写成功之后**才记录，失败那次不会被当成已完成。
      // ⚠ 2026-10-09 实测修：以前这里把**下载失败**也一并写成「卡没写进去」，玩家以为卡坏了；
      //   而且文案说「已下载的内容不会丢」——代码里并没有下载缓存，每次都要重下。
      //   现在按失败发生在**哪一步**分开说。
      if (/所有更新源都取不到/.test(m)) {
        m = '连不上任何一个更新源（raw / api.github.com / jsDelivr / 备用镜像都试过了）。请检查网络或代理，稍后再点一次。';
      } else if (/超时/.test(m)) {
        m = '更新源响应超时（网络慢或被挡）。稍后再点一次「检查更新」；换条网络会更快。';
      } else if (/校验失败|缓存没过期|标记与清单不一致|清单格式不对/.test(m)) {
        m = m + '（多半是镜像缓存还没刷新，过几分钟再试）';
      } else if (/失败: \(\d+\)/.test(m)) {
        m = '内容已下载好，但**写回角色卡时被酒馆挡了**（' + m.replace(/\s+/g, ' ').slice(0, 50) + '）。已自动重试 3 次仍未成功 —— 稍等几秒再点一次「检查更新」即可。';
      } else if (/Failed to fetch|NetworkError|Load failed/i.test(m)) {
        m = '网络中断。稍后再点一次「检查更新」（每次都会重新下载，请保持网络通畅）。';
      } else if (/读不到真实卡名/.test(m)) {
        m = '读不到这张卡的名称，为避免写坏卡已放弃。请在酒馆里重新选中本卡再试。';
      }
      say('error', '更新失败：' + m);
    });
  }

  // 手动入口：酒馆助手面板里出现一个「检查更新」按钮
  try {
    var btn = api('replaceScriptButtons');
    if (btn) { btn([{ name: '检查更新', visible: true }]); }
    var onBtn = api('eventOnButton');
    if (onBtn) { onBtn('检查更新', function () { check(true); }); }
  } catch (e) {}

  // 排障用的钩子：在酒馆控制台里可以直接 __xzsUpdater.check(true) / __xzsUpdater.isOurCard(getCharacterSync…)
  try {
    window.__xzsUpdater = {
      check: check, isOurCard: isOurCard, scriptsOf: scriptsOf, appScriptOf: appScriptOf,
      buildOf: buildOf, resolveCardName: resolveCardName, syncWorldbook: syncWorldbook, RAW: RAW,
    };
  } catch (e) {}

  // 进卡自动检查
  setTimeout(function () { try { check(false); } catch (e) {} }, CHECK_DELAY);
})();
