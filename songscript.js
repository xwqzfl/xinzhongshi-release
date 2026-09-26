/*XZS_SONG:1*/
// ===== 新中市 · 唱歌音频直链（内联嵌入正文）=====
// 监听 AI 消息，解析 【歌曲：歌名】 标记，映射到 R2 音频直链。
// 音频播放器内联嵌入正文唱歌处（不 append 到消息末尾）：
//   - mes.mes            = 干净正文（删标记，AI 上下文不受 <audio> 污染）
//   - mes.extra.display_text = 正文 + 内联 <audio>（渲染用，DOMPurify 默认允许 audio/controls/src）
(function () {
    var ST = window.SillyTavern;
    if (!ST || typeof ST.updateMessageBlock !== 'function' || typeof eventOn !== 'function') return;

    var R2 = 'https://pub-96a085a109d24429a081d583b161aee8.r2.dev/';

    // ===== 公共歌库：不绑定特定角色的歌（清唱/日常女声/演出主唱），任何符合条件的角色触发即唱；
    // 具体性别/场合限制（清唱 vs 有配乐日常 vs 演出）由世界书规则约束，脚本只做歌名→URL 映射 =====
    var COMMON_SONGS = {
        // 通用
        '小星星': R2 + 'song_xiaoxingxing.wav',
        // 女声清唱（女角色日常哼唱，无配乐）
        '失眠': R2 + '公共库，女声，清唱：失眠.mp3',
        '牵丝戏': R2 + '公共库，女声，清唱：牵丝戏.mp3',
        // 女声日常（有配乐）
        '打火机': R2 + '公共库，女声：打火机.mp3',
        '游東京': R2 + '公共库，女声：游東京.mp3',
        '莫愁乡': R2 + '公共库，女声：莫愁乡.mp3',
        'DaDaDa': R2 + '公共库，女声：DaDaDa.mp3',
        '夏天的风': R2 + '公共库，女声：夏天的风.mp3',
        // 演出女声主唱（路演/演出/表演，有配乐）
        '曾经我也想过一了百了': R2 + '公共库，演出，女声主唱：曾经我也想过一了百了.mp3',
        '青鸟': R2 + '公共库，演出，女声主唱：青鸟.mp3',
        '骑在银龙的背上': R2 + '公共库，演出，女声主唱：骑在银龙的背上.mp3',
        // 演出男声主唱（男角色演出场合，有配乐）
        '直到世界的尽头': R2 + '公共库，演出，男声主唱：直到世界的尽头.mp3',
    };

    // ===== 单人歌库：仅某角色独唱（触发时从自己的列表里挑）=====
    // 键 = 角色本名（仅脚本内部分组用，实际匹配看歌名是否全局唯一）
    var CHAR_SONGS = {
        '林羽桃': {
            '一只螃蟹八只脚': R2 + '林羽桃：一只螃蟹八只脚.mp3',
            '咕咕嘎嘎': R2 + '林羽桃：咕咕嘎嘎.mp3',
            '寂寞的人伤心的歌': R2 + '林羽桃、林羽绿：寂寞的人伤心的歌.mp3',
        },
        '林羽绿': {
            '寂寞的人伤心的歌': R2 + '林羽桃、林羽绿：寂寞的人伤心的歌.mp3',
            '十夏之花': R2 + '林羽绿：十夏之花.mp3',
            '单相思': R2 + '林羽绿：单相思.mp3',
        },
        '宇崎花': {
            '你若三冬来': R2 + '宇崎花：你若三冬来.mp3',
            '哎呦小情郎你莫愁': R2 + '宇崎花：哎呦小情郎你莫愁.mp3',
            '基米说': R2 + '宇崎花：基米说.mp3',
            '神曼波': R2 + '宇崎花：神曼波.mp3',
        },
        '后藤一里': {
            '捆绑梦想': R2 + '后藤一里：捆绑梦想.mp3',
        },
        '伊地知虹夏': {
            'UNITE': R2 + '伊地知虹夏：UNITE.mp3',
        },
        '山田凉': {
            '行星': R2 + '山田凉：行星.mp3',
        },
        '喜多郁代': {
            'milky way': R2 + '喜多郁代：milky way.mp3',
        },
        '星野爱': {
            'アイドル': R2 + '星野爱：アイドル.mp3',
            'HEART\'s♡KISS': R2 + '星野爱：HEART\'s♡KISS.mp3',
            'STAR☆T☆RAIN': R2 + '星野爱：STAR☆T☆RAIN.mp3',
        },
        '有马加奈': {
            '满月': R2 + '有马加奈：满月.mp3',
        },
        '林心美': {
            '天使之翼': R2 + '林心美：天使之翼.mp3',
        },
        '林雪乃': {
            'ダイヤモンドの純度': R2 + '林雪乃：ダイヤモンドの純度.mp3',
            '青花瓷': R2 + '林雪乃：青花瓷.mp3',
            '萌芽之雨': R2 + '林雪乃钢琴弹唱：萌芽之雨.mp3',
            '雪融': R2 + '林雪乃钢琴弹唱：雪融.mp3',
        },
        '林麻衣': {
            '不可思議のカルテ': R2 + '林麻衣：不可思議のカルテ.mp3',
        },
        '橘万里花': {
            'Promise with you promise with me': R2 + '橘万里花：Promise with you promise with me.mp3',
        },
        '初音未来': {
            '梦与叶樱': R2 + '初音未来：梦与叶樱.mp3',
            '深海少女': R2 + '初音未来：深海少女.mp3',
            '胧月': R2 + '初音未来：胧月.mp3',
        },
        '由比滨结衣': {
            'エブリデイワールド': R2 + '由比滨结衣钢琴弹唱：エブリデイワールド.mp3',
            '由比滨结衣：ダイヤモンドの純度': R2 + '由比滨结衣钢琴弹唱：ダイヤモンドの純度.mp3',
        },
        '绫耀': {
            '知我': R2 + '绫耀、陈平安：知我.mp3',
        },
        '陈平安': {
            '知我': R2 + '绫耀、陈平安：知我.mp3',
        },
        '三浦优美子': {
            'Letting Go': R2 + '三浦优美子：Letting Go.mp3',
        },
        '严小希': {
            '没有人心疼我': R2 + '严小希：没有人心疼我.mp3',
        },
        '叶山隼人': {
            '簇拥烈日的花': R2 + '叶山隼人：簇拥烈日的花.mp3',
        },
        '曹茗瑜': {
            '却扛不住 对你的喜欢': R2 + '曹茗瑜：却扛不住 对你的喜欢.mp3',
            '回马枪': R2 + '曹茗瑜：回马枪.mp3',
            '忘川彼岸': R2 + '曹茗瑜：忘川彼岸.mp3',
            '说了再见': R2 + '曹茗瑜：说了再见.mp3',
        },
        '林雨涵': {
            '我我': R2 + '林雨涵：我我.mp3',
        },
        '楚凌龄': {
            '是否': R2 + '楚凌龄：是否.mp3',
        },
        '耿燕': {
            '520AM': R2 + '耿燕：520AM.mp3',
        },
        '刘华强': {
            '刘华强见宋老虎': R2 + '刘华强：刘华强见宋老虎.mp3',
        },
    };

    // ===== 团队歌库：需多人在场（乐队/社团训练、演奏、表演）才触发的歌 =====
    // 结束乐队（新中市国立学校音乐部）五人合奏曲目
    var BAND_SONGS = {
        '孤独与蓝色星球': R2 + '结束乐队：孤独与蓝色星球.mp3',
        '平凡亦熠': R2 + '结束乐队：平凡亦熠.mp3',
        '绝对不会忘记': R2 + '结束乐队：绝对不会忘记.mp3',
        '若能化作星座': R2 + '结束乐队：若能化作星座.mp3',
        '那个乐队': R2 + '结束乐队：那个乐队.mp3',
        // TOGENASHI TOGEARI（音乐部）：井芹仁菜/河原木桃香/安和昴/海老冢智/RUPA
        '声なき魚': R2 + 'TOGENASHI TOGEARI：声なき魚.mp3',
        '皆无其名': R2 + 'TOGENASHI TOGEARI：皆无其名.mp3',
        '空の箱': R2 + 'TOGENASHI TOGEARI：空の箱.mp3',
        '視界の隅 朽ちる音': R2 + 'TOGENASHI TOGEARI：視界の隅 朽ちる音.mp3',
        // 放学后TEA TIME（轻音部）：平泽唯/秋山澪/田井中律/琴吹䌷/中野梓
        'U&I': R2 + '放学后TEA TIME：U&I.mp3',
        '咖喱后米饭': R2 + '放学后TEA TIME：咖喱后米饭.mp3',
        '我的爱是订书机': R2 + '放学后TEA TIME：我的爱是订书机.mp3',
        '毛笔~圆珠笔~': R2 + '放学后TEA TIME：毛笔~圆珠笔~.mp3',
        '相遇天使': R2 + '放学后TEA TIME：相遇天使.mp3',
        '米饭是菜': R2 + '放学后TEA TIME：米饭是菜.mp3',
        '纯纯的心': R2 + '放学后TEA TIME：纯纯的心.mp3',
        '给我一双翅膀': R2 + '放学后TEA TIME：给我一双翅膀.mp3',
        '轻飘飘的时间': R2 + '放学后TEA TIME：轻飘飘的时间.mp3',
        'Don\'t say lazy': R2 + '放学后TEA TIME：Don\'t say lazy.mp3',
        // B小町（亩苟影视偶像女团）：星野爱/有马加奈/星野露比等
        '暗号是B': R2 + 'B小町：暗号是B.mp3',
        'Bのリベンジ': R2 + 'B小町：Bのリベンジ.mp3',
        // 同名歌团体版（带「B小町：」前缀，区分星野爱 solo 的无前缀版）
        'B小町：HEART\'s♡KISS': R2 + 'B小町：HEART\'s♡KISS.mp3',
        'B小町：STAR☆T☆RAIN': R2 + 'B小町：STAR☆T☆RAIN.mp3',
        // 侍奉部（社团）：林雪乃/比企谷八幡/由比滨结衣/四条真妃
        'Bitter Bitter Sweet': R2 + '侍奉部：Bitter Bitter Sweet .mp3',
        // LOVE女团/KDA女团（多团体共享，含 knight 女团）
        'POP STARS': R2 + 'LOVE女团，KDA女团：POP STARS.mp3',
        'THE BADDEST': R2 + 'LOVE女团，KDA女团：THE BADDEST.mp3',
        'VILLAIN': R2 + 'LOVE女团，KDA女团：VILLAIN.mp3',
        // SOS团（凉宫春日主唱，乐队伴奏）
        'God Knows': R2 + 'SOS团演奏，凉宫春日主唱：God Knows.mp3',
        // 偶像研究部 μ's女团（高坂穗乃果/南小鸟/园田海未/东条希/绚濑绘里/西木野真姬/小泉花阳/星空凛/矢泽妮可）
        'HEART to HEART！': R2 + '偶像研究部，μ\'s女团：HEART to HEART！.mp3',
        'Music S.T.A.R.T!!': R2 + '偶像研究部，μ\'s女团：Music S.T.A.R.T!!.mp3',
        'START：DASH!!': R2 + '偶像研究部，μ\'s女团：START：DASH!!.mp3',
        'それは僕たちの奇跡': R2 + '偶像研究部，μ\'s女团：それは僕たちの奇跡.mp3',
        '愛してるばんざーい!': R2 + '偶像研究部，μ\'s女团：愛してるばんざーい!.mp3',
        // 戏剧部（舞台少女）：Fly Me to the Star / 星のダイアローグ
        'Fly Me to the Star': R2 + '戏剧部：Fly Me to the Star.mp3',
        '星のダイアローグ': R2 + '戏剧部：星のダイアローグ.mp3',
        // 教堂、修女会唱诗班圣咏（"降临"教堂 / 学校修女会社团）
        'you have to choose your future': R2 + '教堂、修女会唱诗班圣咏：you have to choose your future.mp3',
    };

    // ===== 乐器演奏库：纯器乐、无歌唱（区别于唱歌，触发时表现为「弹奏」而非「唱」）=====
    // 独奏按「乐器：曲目」区分（公共，任何角色用该乐器独奏均可触发，不区分具体演奏者）；
    // 合奏按曲目名区分。值为数组 = 同名多版本，随机选一。
    var SOLO_SONGS = {
        // 独奏（按「乐器：曲目」；单曲且无正式曲目名的乐器用纯乐器名）
        '吉他': R2 + '后藤一里吉他solo.mp3',
        '钢琴：前前前世': R2 + '公共库，钢琴曲：前前前世.mp3',
        '小号：利兹与青鸟': R2 + '高坂丽奈乐器：莉兹与青鸟.mp3',
        '小号：自新大陆': R2 + '高坂丽奈小号：自新大陆.mp3',
        '长笛：自新大陆': R2 + '伞木希美长笛：自新大陆.mp3',
        '双簧管：利兹与青鸟': R2 + '铠冢霙双簧管：利兹与青鸟.mp3',
        '低音提琴：爱的礼赞': R2 + '川岛绿辉与月永求低音提琴合奏：爱的礼赞.mp3',
        // 上低音号《吹响！上低音号》：未指明演奏者时随机；指明黄前久美子/田中明日香时用专属版本
        '上低音号：吹响！上低音号': [
            R2 + '黄前久美子乐器：吹响！上低音号.mp3',
            R2 + '田中明日香上低音号：吹响！上低音号.mp3',
        ],
        '黄前久美子：吹响！上低音号': R2 + '黄前久美子乐器：吹响！上低音号.mp3',
        '田中明日香：吹响！上低音号': R2 + '田中明日香上低音号：吹响！上低音号.mp3',
        // 双人合奏（跨乐器，按曲目名）
        '找到了爱的地方': R2 + '黄前久美子与高坂丽奈乐器合奏：找到了爱的地方.mp3',
        // 吹奏乐部（社团合奏，纯器乐）
        '一年之诗': R2 + '吹奏乐部：一年之诗.mp3',
        '三日月の舞': R2 + '吹奏乐部：三日月の舞.mp3',
        '利兹与青鸟第一乐章': R2 + '吹奏乐部：利兹与青鸟第一乐章.mp3',
        '利兹与青鸟第三乐章': R2 + '吹奏乐部：利兹与青鸟第三乐章.mp3',
        '利兹与青鸟第四乐章': R2 + '吹奏乐部：利兹与青鸟第四乐章.mp3',
        '普罗旺斯的风': R2 + '吹奏乐部：普罗旺斯的风.mp3',
    };

    // ===== 情景剧演出库：舞台剧演绎（不是合唱、不是纯器乐）=====
    // 戏剧部《Starlight》核心剧目（每年校园祭压轴）中演绎的曲目，表现为「演绎」而非「唱」
    // 注：世界书规则把「剧目」对应到剧名《Starlight》，AI 可能输出【演出：Starlight】而非【演出：星摘みの歌】，
    // 故额外收录 'Starlight' 作别名兜底，指向同一唱段音频。
    var STAGE_SONGS = {
        '星摘みの歌': R2 + '戏剧部情景剧：星摘みの歌.mp3',
        'Starlight': R2 + '戏剧部情景剧：星摘みの歌.mp3',
    };

    // 合并全部歌名/曲目 → 直链。注意：本游戏是「上帝视角」，无固定 {{char}}/{{user}}，
    // 角色卡名固定为「新中市人间世…」，不能用 name2 判断当前唱歌角色；
    // 歌名/曲目标签全局唯一，故直接合并所有单人歌 + 团队歌 + 独奏曲 + 情景剧，脚本按名查 URL。
    function buildSongMap() {
        var map = {};
        Object.keys(COMMON_SONGS).forEach(function (k) { map[k] = COMMON_SONGS[k]; });
        Object.keys(CHAR_SONGS).forEach(function (ch) {
            var songs = CHAR_SONGS[ch] || {};
            Object.keys(songs).forEach(function (k) { map[k] = songs[k]; });
        });
        Object.keys(BAND_SONGS).forEach(function (k) { map[k] = BAND_SONGS[k]; });
        Object.keys(SOLO_SONGS).forEach(function (k) { map[k] = pickUrl(SOLO_SONGS[k]); });
        Object.keys(STAGE_SONGS).forEach(function (k) { map[k] = STAGE_SONGS[k]; });
        return map;
    }

    var DONE = '__song_audio_done';

    function normName(raw) {
        return (raw || '').trim().replace(/^《+|》+$/g, '').replace(/^【+|】+$/g, '').trim();
    }

    function audioHtml(url, name, icon) {
        return '<span style="display:inline-flex;align-items:center;gap:8px;vertical-align:middle;margin:2px 0;">' +
            '<span style="color:#10a37f;font-weight:600;">' + (icon || '🎵') + ' ' + name + '</span>' +
            '<audio controls preload="none" title="' + name + '" src="' + url + '" style="height:34px;"></audio>' +
            '</span>';
    }

    // 取值：字符串（单 URL）原样返回；数组（同名多版本）随机选一
    function pickUrl(v) {
        if (!v) return null;
        return Array.isArray(v) ? v[Math.floor(Math.random() * v.length)] : v;
    }

    // 匹配三种标记，一次扫描完成（避免二次 replace 误处理生成的 <audio>）：
    //   唱歌：【歌曲：歌名】（全角方括号）；
    //   演奏：【演奏：曲目】（纯乐器无歌唱，渲染/上下文用「弹奏」而非「唱」）；
    //   演出：【演出：剧目】（情景剧/舞台剧演绎，非合唱非演奏）；
    //   退化兜底（曲名）（全角/半角圆括号）——仅命中歌库才替换，其余保留原样
    var RE_SONG = /【歌曲：\s*([^】]+?)\s*】|【演奏：\s*([^】]+?)\s*】|【演出：\s*([^】]+?)\s*】|（\s*([^）]+?)\s*）|\(\s*([^)]+?)\s*\)/g;

    function inject(message_id) {
        var mes = ST.chat[message_id];
        if (!mes || mes.is_user || mes.is_system) return;
        // ⚠ 防重标记只在「渲染版还在」时才算完成：酒馆在**翻页 / 重新生成**时会调 clearMessageData()
        //    删掉 extra.display_text，却不会动我们自己的标记 —— 若只认标记，翻到带歌曲的那一页
        //    就永远不出播放器了（2026-09-25 用户报：「开局的播放器变成了文字」）。
        if (mes.extra && mes.extra[DONE] && mes.extra.display_text) return;

        var text = mes.mes || '';
        // 历史消息修复：翻页时酒馆清掉了 display_text，而 mes 早已被本脚本改成干净正文（标记没了）——
        // 但 swipes 里留着那一页的原始文本，用它把播放器找回来（玩家不必手动翻回去）。
        // 玩家手动编辑过的消息，酒馆会同步回 swipes，所以这里不会覆盖玩家的改动。
        if (!mes.extra || !mes.extra.display_text) {
            var sw = (mes.swipes && typeof mes.swipe_id === 'number') ? mes.swipes[mes.swipe_id] : null;
            if (typeof sw === 'string' && /【歌曲：|【演奏：|【演出：/.test(sw) && !/【歌曲：|【演奏：|【演出：/.test(text)) text = sw;
        }
        var SONG_MAP = buildSongMap();
        var SOLO_MAP = SOLO_SONGS;
        var STAGE_MAP = STAGE_SONGS;

        // 渲染：命中唱歌歌名 → 🎵+唱；命中独奏曲目 → 🎼+弹奏；命中情景剧 → 🎭+演绎
        function render(full, songName, soloName, stageName, parenFull, parenHalf) {
            if (songName) {
                var n = normName(songName);
                var u = SONG_MAP[n];
                return u ? audioHtml(u, n, '🎵') : full;
            }
            if (soloName) {
                var s = normName(soloName);
                var su = pickUrl(SOLO_MAP[s]);
                return su ? audioHtml(su, s, '🎼') : full;
            }
            if (stageName) {
                var st = normName(stageName);
                var stu = STAGE_MAP[st];
                return stu ? audioHtml(stu, st, '🎭') : full;
            }
            // 圆括号兜底：先当独奏曲目查，再当情景剧查，最后当唱歌歌名查
            var p = normName(parenFull || parenHalf);
            var sp = pickUrl(SOLO_MAP[p]);
            if (sp) return audioHtml(sp, p, '🎼');
            if (STAGE_MAP[p]) return audioHtml(STAGE_MAP[p], p, '🎭');
            var pu = SONG_MAP[p];
            return pu ? audioHtml(pu, p, '🎵') : full;
        }
        // 上下文：唱歌标记 → 「（唱了《歌名》）」；演奏标记 → 「（弹奏了《曲目》）」；演出标记 → 「（演绎了《剧目》）」
        function cleanUp(full, songName, soloName, stageName, parenFull, parenHalf) {
            if (songName) {
                var n = normName(songName);
                return SONG_MAP[n] ? '（唱了《' + n + '》）' : full;
            }
            if (soloName) {
                var s = normName(soloName);
                return SOLO_MAP[s] ? '（弹奏了《' + s + '》）' : full;
            }
            if (stageName) {
                var st = normName(stageName);
                return STAGE_MAP[st] ? '（演绎了《' + st + '》）' : full;
            }
            var p = normName(parenFull || parenHalf);
            if (SOLO_MAP[p]) return '（弹奏了《' + p + '》）';
            if (STAGE_MAP[p]) return '（演绎了《' + p + '》）';
            return SONG_MAP[p] ? '（唱了《' + p + '》）' : full;
        }

        var display = text.replace(RE_SONG, render);
        // 没匹配到任何已收录歌/曲 → 不改动、也不设 DONE（保持可重试，避免流式早期提前锁定）
        if (display.indexOf('<audio') === -1) return;

        var clean = text.replace(RE_SONG, cleanUp);

        if (!mes.extra) mes.extra = {};
        mes.extra[DONE] = true;
        mes.mes = clean;
        mes.extra.display_text = display;

        ST.updateMessageBlock(message_id, mes);
        if (typeof ST.saveChat === 'function') ST.saveChat();
    }

    function schedule(id) {
        var mid = parseInt(id, 10);
        if (isNaN(mid)) return;
        setTimeout(function () { inject(mid); }, 400);
    }

    // 多事件兜底：inject 内部有 DONE 防重 + 未匹配不设 DONE，重复触发安全
    eventOn(tavern_events.MESSAGE_RECEIVED, schedule);
    eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, schedule);
    eventOn(tavern_events.MESSAGE_UPDATED, schedule);

    // 兜底修复：翻页 / 重新生成 / 切回旧聊天时，把被酒馆清掉 display_text 的消息补回来
    function scan(n) {
        var arr = ST.chat || [];
        var from = Math.max(0, arr.length - (n || 30));
        for (var i = from; i < arr.length; i++) inject(i);
    }
    try { eventOn(tavern_events.MESSAGE_SWIPED, function () { setTimeout(function () { scan(3); }, 500); }); } catch (e) {}
    try { eventOn('chat_id_changed', function () { setTimeout(function () { scan(30); }, 1500); }); } catch (e) {}
})();
