
class Component extends DCLogic {
  state = {
    theme: 'honey', screen: 'login', view: 'home', hist: [], anim: 'scrIn',
    fdTab: 'overview', weather: 'sun', face: 'A',
    frames: { 1:true, 2:true, 3:true }, graphKind: 'weight', period: 'week',
    taskFilter: 'today', reportPeriod: 'month', reads: {},
    f: { loginEmail:'', loginPw:'', regName:'', regEmail:'', regPw:'', regFarm:'', frameMemo:'', aiMemo:'', taskType:'給餌', taskColony:'A-02', taskMemo:'', recType:'給餌', recColony:'A-02', recMemo:'' },
  };

  THEMES = {
    honey: { bg:'#FBF4E6', surface:'#FFFFFF', surfaceAlt:'#FFFBF1', primary:'#E8961B', primaryText:'#FFFFFF', primaryShadow:'rgba(232,150,27,.32)', accent:'#E8961B', text:'#3D2F17', textMuted:'#A38F6E', border:'#F0E4CA', ok:'#3E9D6B', warn:'#C98A00', warnBg:'#FCF1D6', danger:'#D9534F', dangerBg:'#FBE8E7', font:"'M PLUS Rounded 1c', system-ui, sans-serif", radius:20, statusBarDark:false, chipBg:'#FFF1D6', chipText:'#9A6B00', navBarBg:'#FFFFFF', homeBar:'rgba(0,0,0,.25)' },
    charcoal: { bg:'#15120C', surface:'#211C13', surfaceAlt:'#2A2417', primary:'#F5B72E', primaryText:'#1A1505', primaryShadow:'rgba(245,183,46,.3)', accent:'#F5B72E', text:'#F6F0E2', textMuted:'#A99D86', border:'#322B1E', ok:'#5CC98C', warn:'#F5B72E', warnBg:'rgba(245,183,46,.14)', danger:'#FF7A6E', dangerBg:'rgba(255,122,110,.14)', font:"'Noto Sans JP', system-ui, sans-serif", radius:18, statusBarDark:true, chipBg:'rgba(245,183,46,.16)', chipText:'#F5B72E', navBarBg:'#1B1710', homeBar:'rgba(255,255,255,.6)' },
    sage: { bg:'#EEF0E8', surface:'#FFFFFF', surfaceAlt:'#F5F7EF', primary:'#5E7C4E', primaryText:'#FFFFFF', primaryShadow:'rgba(94,124,78,.28)', accent:'#C58A1A', text:'#2B3024', textMuted:'#7C8470', border:'#DCE1D1', ok:'#5E7C4E', warn:'#C58A1A', warnBg:'#F6EBD4', danger:'#C2645B', dangerBg:'#F2E2DF', font:"'Zen Kaku Gothic New', system-ui, sans-serif", radius:14, statusBarDark:false, chipBg:'#E8EEE0', chipText:'#4A6440', navBarBg:'#FFFFFF', homeBar:'rgba(0,0,0,.22)' },
    kraft: { bg:'#EAE0CC', surface:'#F6EFDF', surfaceAlt:'#F0E7D2', primary:'#C2693B', primaryText:'#FBF5EA', primaryShadow:'rgba(194,105,59,.3)', accent:'#A8541F', text:'#3B2A1B', textMuted:'#917A5C', border:'#D8C9A8', ok:'#6E8B4A', warn:'#C28A1E', warnBg:'#EFE2BE', danger:'#B5502F', dangerBg:'#EBD6C4', font:"'Zen Kaku Gothic New', system-ui, sans-serif", radius:6, statusBarDark:false, chipBg:'#E6D6B6', chipText:'#8C5024', navBarBg:'#F0E7D2', homeBar:'rgba(0,0,0,.25)' },
    sky: { bg:'#F4F7FB', surface:'#FFFFFF', surfaceAlt:'#F7FAFF', primary:'#2D7FF0', primaryText:'#FFFFFF', primaryShadow:'rgba(45,127,240,.26)', accent:'#0E9F6E', text:'#1B2A41', textMuted:'#8896AB', border:'#E4EAF2', ok:'#0E9F6E', warn:'#E0962A', warnBg:'#FBEFD9', danger:'#E5484D', dangerBg:'#FBE3E4', font:"'Noto Sans JP', system-ui, sans-serif", radius:18, statusBarDark:false, chipBg:'#E5F0FE', chipText:'#1F66C7', navBarBg:'#FFFFFF', homeBar:'rgba(0,0,0,.2)' },
    blossom: { bg:'#FBF1F5', surface:'#FFFFFF', surfaceAlt:'#FFF6FA', primary:'#D86B96', primaryText:'#FFFFFF', primaryShadow:'rgba(216,107,150,.28)', accent:'#C98A2E', text:'#43293A', textMuted:'#A98AA0', border:'#F2DEE7', ok:'#5BA889', warn:'#D29A33', warnBg:'#FAEDD4', danger:'#D85A6E', dangerBg:'#FBE2E6', font:"'M PLUS Rounded 1c', system-ui, sans-serif", radius:24, statusBarDark:false, chipBg:'#FBE3EC', chipText:'#B84E78', navBarBg:'#FFFFFF', homeBar:'rgba(0,0,0,.2)' },
  };

  NOTIFS = [
    { id:'n1', tag:'A-02', text:'分蜂予兆が検出されました', time:'10分前', kind:'danger', icon:'⚠️', unreadDefault:true },
    { id:'n2', tag:'A-08', text:'重量の急激な変化を検出しました', time:'1時間前', kind:'warn', icon:'📈', unreadDefault:true },
    { id:'n3', tag:'A-05', text:'温度が高くなりすぎています', time:'2時間前', kind:'warn', icon:'🌡️', unreadDefault:true },
    { id:'n4', tag:'A-03', text:'内検の時間間隔です', time:'10時間前', kind:'info', icon:'🔍', unreadDefault:false },
    { id:'n5', tag:'レポート', text:'本日の作業レポートが生成されました', time:'昨日', kind:'info', icon:'📄', unreadDefault:false },
  ];
  FARMS = [
    { id:'f1', name:'第一養蜂場', colonies:12, yield:245, delta:'+15%', up:true },
    { id:'f2', name:'第二養蜂場', colonies:6, yield:158, delta:'安定', up:null },
    { id:'f3', name:'第三養蜂場', colonies:4, yield:55, delta:'+4%', up:true },
  ];
  COLONY_STATUS = ['ok','ok','warn','ok','ok','ok','ok','danger','ok','ok','ok','ok'];
  TASKS = [
    { id:'t1', colony:'A-02', type:'給餌', icon:'🍼', when:'今日 09:00', status:'未着手', sk:'todo', scope:'today' },
    { id:'t2', colony:'A-03', type:'内検', icon:'🔍', when:'今日 10:00', status:'未着手', sk:'todo', scope:'today' },
    { id:'t3', colony:'A-05', type:'採蜜', icon:'🍯', when:'今日 13:00', status:'完了', sk:'done', scope:'today' },
    { id:'t4', colony:'A-07', type:'内検', icon:'🔍', when:'明日 09:00', status:'予定', sk:'plan', scope:'week' },
    { id:'t5', colony:'A-04', type:'治療', icon:'💊', when:'6/11 11:00', status:'予定', sk:'plan', scope:'week' },
  ];
  AI_RESULTS = [
    { icon:'🍯', label:'封蓋率', value:'72%', conf:'高' }, { icon:'🟩', label:'育児域面積比', value:'58%', conf:'高' },
    { icon:'🌸', label:'花粉の有無', value:'あり', conf:'高' }, { icon:'🍯', label:'蜜域面積比', value:'21%', conf:'中' },
    { icon:'🥚', label:'卵の有無', value:'あり', conf:'高' }, { icon:'🐛', label:'幼虫の有無', value:'あり', conf:'高' },
    { icon:'🦠', label:'ヴァロア検出', value:'なし', conf:'高' }, { icon:'👑', label:'女王確認', value:'不明', conf:'中' },
    { icon:'💯', label:'健康スコア', value:'85/100', conf:'高' },
  ];
  REC_ACTIONS = [
    { num:1, title:'王台の除去', tag:'今すぐ実施を推奨', urgency:'high' },
    { num:2, title:'箱の整備', tag:'分蜂に備えて事前に実施', urgency:'mid' },
    { num:3, title:'給餌の確認', tag:'経過観察（2週間後）', urgency:'low' },
  ];
  WORK_HIST = [
    { date:'2026/05/12', type:'給餌', detail:'砂糖水 2L 給餌' },
    { date:'2026/05/08', type:'内検', detail:'異常なし・健康スコア 82' },
    { date:'2026/05/01', type:'採蜜', detail:'採蜜量：12.5kg' },
    { date:'2026/04/25', type:'給餌', detail:'砂糖水 2L 給餌' },
  ];
  REPORT_FARMS = [ { name:'第一養蜂場', kg:245 }, { name:'第二養蜂場', kg:158 }, { name:'第三養蜂場', kg:55 } ];
  SETTINGS = [
    { icon:'🏡', label:'養蜂場の管理' }, { icon:'📡', label:'センサー・デバイス' }, { icon:'🔔', label:'通知設定' },
    { icon:'👥', label:'メンバー管理' }, { icon:'🔒', label:'アカウント' },
  ];
  GRAPH = {
    weight: { title:'重量グラフ（A-01）', value:'38.5', unit:'kg', color:'#E8961B',
      day:{ data:[36.8,37.1,37.0,37.6,38.0,38.2,38.5], labels:['0時','4時','8時','12時','16時','20時','現在'], stat:'前日比 +1.2 kg ↑' },
      week:{ data:[34.2,35.1,35.8,36.4,37.2,37.9,38.5], labels:['月','火','水','木','金','土','日'], stat:'前週比 +4.3 kg ↑' },
      month:{ data:[30,31.5,33,34.6,36,37.4,38.5], labels:['第1週','','','','','','現在'], stat:'前月比 +8.5 kg ↑' },
      year:{ data:[22,26,31,29,34,37,38.5], labels:['1月','3月','5月','7月','9月','11月','現在'], stat:'年間 +16.5 kg ↑' } },
    temp: { title:'温度グラフ（A-01）', value:'35.2', unit:'℃', color:'#E0762A',
      day:{ data:[31.5,30.8,32.4,34.8,35.6,34.2,35.2], labels:['0時','4時','8時','12時','16時','20時','現在'], stat:'平均 32.1 ℃' },
      week:{ data:[32.1,33.0,31.6,34.2,33.8,34.9,35.2], labels:['月','火','水','木','金','土','日'], stat:'平均 33.5 ℃' },
      month:{ data:[30,31,32.5,33,34,34.8,35.2], labels:['第1週','','','','','','現在'], stat:'平均 32.8 ℃' },
      year:{ data:[18,22,28,35,33,26,35.2], labels:['1月','3月','5月','7月','9月','11月','現在'], stat:'年間平均 28.4 ℃' } },
    humid: { title:'湿度グラフ（A-01）', value:'58', unit:'%', color:'#2D9FB8',
      day:{ data:[62,60,59,55,54,57,58], labels:['0時','4時','8時','12時','16時','20時','現在'], stat:'平均 56 %' },
      week:{ data:[55,57,60,58,56,59,58], labels:['月','火','水','木','金','土','日'], stat:'平均 57 %' },
      month:{ data:[52,54,56,57,58,57,58], labels:['第1週','','','','','','現在'], stat:'平均 55 %' },
      year:{ data:[48,52,58,64,60,54,58], labels:['1月','3月','5月','7月','9月','11月','現在'], stat:'年間平均 56 %' } },
  };

  GROUP = {
    home:'home', notif:'home',
    farms:'farms', farmDetail:'farms', farmMap:'farms', sensor:'farms', weight:'farms', temp:'farms', humid:'farms', camera:'farms', aiDiagnosis:'farms', aiRecommend:'farms',
    tasks:'tasks', taskCreate:'tasks', workRecord:'tasks', workHistory:'tasks', inspStart:'tasks', inspCapture:'tasks', inspFrame:'tasks', inspAI:'tasks', inspSummary:'tasks', inspHistory:'tasks',
    report:'analytics', settings:'settings',
  };

  go(screen) { this.setState({ screen, anim: 'scrIn' }); }
  nav(view) { this.setState(s => ({ screen:'app', view, hist:[...s.hist, s.view], anim:'scrIn' })); }
  back() { this.setState(s => { const h=[...s.hist]; const prev=h.pop()||'home'; return { hist:h, view:prev, anim:'scrInBack' }; }); }
  tab(view) { this.setState({ screen:'app', view, hist:[], anim:'scrIn' }); }
  jump(view) { this.setState({ screen:'app', view, hist:[], anim:'scrIn' }); }
  setTheme(theme) { this.setState({ theme }); }
  field(k) { return (e) => { const v=e.target.value; this.setState(s => ({ f:{ ...s.f, [k]:v } })); }; }
  toggleFrame(n) { this.setState(s => { const fr={...s.frames}; if(fr[n]) delete fr[n]; else fr[n]=true; return { frames:fr }; }); }
  selectAll() { const fr={}; for(let i=1;i<=10;i++) fr[i]=true; this.setState({ frames:fr }); }
  markAllRead() { const r={...this.state.reads}; this.NOTIFS.forEach(n=>{ r[n.id]=true; }); this.setState({ reads:r }); }
  logout() { this.setState({ screen:'login', view:'home', hist:[], anim:'scrInBack', reads:{} }); }

  linePath(vals, w, h, pad, close) {
    const max=Math.max(...vals), min=Math.min(...vals); const rng=(max-min)||1; const n=vals.length;
    const pts=vals.map((v,i)=>{ const x=pad+(w-2*pad)*i/(n-1); const y=h-pad-(h-2*pad)*(v-min)/rng; return [x,y]; });
    let d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
    if(close) d+=' L'+pts[n-1][0].toFixed(1)+','+h+' L'+pts[0][0].toFixed(1)+','+h+' Z';
    return { d, last: pts[n-1] };
  }
  polyPts(vals, w, h, pad) {
    const max=Math.max(...vals), min=Math.min(...vals); const rng=(max-min)||1; const n=vals.length;
    return vals.map((v,i)=>{ const x=pad+(w-2*pad)*i/(n-1); const y=h-pad-(h-2*pad)*(v-min)/rng; return [x,y]; });
  }

  renderVals() {
    const t = this.THEMES[this.state.theme] || this.THEMES.honey;
    const s = this.state; const v = s.view; const sc = s.screen; const app = sc==='app';
    const grp = app ? (this.GROUP[v]||'home') : null;
    const nc = { home:grp==='home'?t.primary:t.textMuted, farms:grp==='farms'?t.primary:t.textMuted, tasks:grp==='tasks'?t.primary:t.textMuted, analytics:grp==='analytics'?t.primary:t.textMuted, settings:grp==='settings'?t.primary:t.textMuted };

    const seg = (active) => 'display:flex; align-items:center; gap:7px; padding:8px 14px; border:none; border-radius:999px; cursor:pointer; font-size:13px; font-weight:700; font-family:inherit; background:'+(active?'#2A2520':'transparent')+'; color:'+(active?'#fff':'#8a8276')+';';
    const pill = (active) => 'flex:1; padding:9px; border:none; border-radius:9px; cursor:pointer; font-size:13px; font-weight:700; font-family:'+t.font+'; background:'+(active?t.surface:'transparent')+'; color:'+(active?t.text:t.textMuted)+'; box-shadow:'+(active?'0 1px 3px rgba(0,0,0,.1)':'none')+';';
    const wxBtn = (active) => 'flex:1; padding:12px; border-radius:12px; cursor:pointer; font-size:14px; font-weight:700; font-family:'+t.font+'; background:'+(active?t.chipBg:t.surface)+'; color:'+(active?t.chipText:t.textMuted)+'; border:1.5px solid '+(active?t.primary:t.border)+';';

    const confColor = (c) => c==='高' ? t.ok : t.warn;
    const confBg = (c) => c==='高' ? t.chipBg : t.warnBg;

    // notifs
    const kindMap = { danger:{color:t.danger,bg:t.dangerBg}, warn:{color:t.warn,bg:t.warnBg}, info:{color:t.primary,bg:t.chipBg} };
    const notifs = this.NOTIFS.map(n=>{ const unread=n.unreadDefault && !s.reads[n.id]; const km=kindMap[n.kind]; return {...n, unread, color:km.color, bg:km.bg, opacity:unread?1:0.62}; });
    const hasUnread = notifs.some(n=>n.unread);

    // farms
    const farms = this.FARMS.map(fm=>({ ...fm, deltaColor:fm.up===null?t.textMuted:t.accent, deltaBg:fm.up===null?t.surfaceAlt:t.chipBg, open:()=>this.nav('farmDetail') }));

    // colony cells + map pins
    const stColor = { ok:t.ok, warn:t.warn, danger:t.danger };
    const stCellBg = { ok:t.surface, warn:t.warnBg, danger:t.dangerBg };
    const colonies = this.COLONY_STATUS.map((st,i)=>{ const id='A-'+String(i+1).padStart(2,'0'); return { id, bg:stCellBg[st], border:st==='ok'?t.border:stColor[st], fg:t.text, dot:stColor[st], open:()=>this.nav('sensor') }; });
    const mapXY = [[18,40],[38,32],[58,38],[78,30],[28,58],[50,55],[70,60],[86,48],[22,76],[44,74],[64,78],[82,70]];
    const mapPins = this.COLONY_STATUS.map((st,i)=>({ id:'A-'+String(i+1).padStart(2,'0'), x:mapXY[i][0], y:mapXY[i][1], color:stColor[st], open:()=>this.nav('sensor') }));

    // inspection frames
    const frameChips = []; for(let i=1;i<=10;i++){ const on=!!s.frames[i]; frameChips.push({ n:i, toggle:()=>this.toggleFrame(i), bg:on?t.primary:t.surface, fg:on?t.primaryText:t.textMuted, border:on?t.primary:t.border }); }
    const selectedCount = Object.keys(s.frames).length;
    const aiResults = this.AI_RESULTS.map(r=>({ ...r, confColor:confColor(r.conf), confBg:confBg(r.conf) }));

    // summary score cells
    const scoreVals = [85,78,90,72,88,80,68,82,91,76];
    const scoreColor = (n)=> n>=85?t.ok : n>=75?t.warn : t.danger;
    const scoreCells = scoreVals.map((sv,i)=>({ n:i+1, score:sv, bg:scoreColor(sv), fg:'#fff' }));

    // calendar June 2026 (starts Monday=1). June 1 2026 is Monday. Build 35 cells.
    const inspectionDays = { 8:true, 15:true, 22:true, 28:true };
    const calCells = [];
    // June 2026: 1st is Monday -> offset 1 (Sun col empty)
    for(let i=0;i<1;i++) calCells.push({ label:'', bg:'transparent', fg:t.textMuted, weight:400 });
    for(let d=1;d<=30;d++){ const ins=inspectionDays[d]; calCells.push({ label:String(d), bg:ins?t.primary:'transparent', fg:ins?'#fff':t.text, weight:ins?800:400 }); }

    // health trend
    const healthVals=[68,72,78,80,85];
    const htPts=this.polyPts(healthVals,300,110,12);
    const healthTrendPts = htPts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
    const healthDots = htPts.map(p=>({ x:p[0].toFixed(1), y:p[1].toFixed(1) }));

    // heatmap
    const heat = [ {label:'枠1',v:[80,84,88]}, {label:'枠2',v:[70,74,80]}, {label:'枠5',v:[60,52,48]}, {label:'枠7',v:[75,68,62]} ];
    const heatColor = (n)=>{ if(n>=80) return t.ok; if(n>=65) return t.warn; return t.danger; };
    const heatRows = heat.map(h=>({ label:h.label, c0:heatColor(h.v[0]), c1:heatColor(h.v[1]), c2:heatColor(h.v[2]) }));

    // sensor mini chart
    const sm=this.linePath([37.6,37.8,37.7,38.0,38.1,38.3,38.2,38.5],300,90,8,false);
    const sma=this.linePath([37.6,37.8,37.7,38.0,38.1,38.3,38.2,38.5],300,90,8,true);

    // graph (period-driven)
    const gk=this.GRAPH[s.graphKind]; const gd=gk[s.period];
    const gl=this.linePath(gd.data,300,150,12,false); const ga=this.linePath(gd.data,300,150,12,true);

    // report trend
    const rt=this.linePath([72,75,78,80,82,84,86],300,110,12,false); const rta=this.linePath([72,75,78,80,82,84,86],300,110,12,true);
    const maxKg=Math.max(...this.REPORT_FARMS.map(r=>r.kg));
    const reportFarms=this.REPORT_FARMS.map(r=>({ ...r, pct:Math.round(r.kg/maxKg*100) }));

    // tasks filtered
    const skMap = { todo:{c:t.warn,b:t.warnBg}, done:{c:t.ok,b:t.chipBg}, plan:{c:t.textMuted,b:t.surfaceAlt} };
    const tasksView = this.TASKS.filter(tk=> s.taskFilter==='all' ? true : s.taskFilter==='week' ? true : tk.scope==='today').map(tk=>({ ...tk, iconBg:t.chipBg, statusColor:skMap[tk.sk].c, statusBg:skMap[tk.sk].b, open:()=>this.nav('workRecord') }));

    const recActions = this.REC_ACTIONS.map(ra=>{ const cmap={high:{bar:t.danger,tag:t.danger},mid:{bar:t.warn,tag:t.warn},low:{bar:t.ok,tag:t.textMuted}}; return { ...ra, barColor:cmap[ra.urgency].bar, tagColor:cmap[ra.urgency].tag }; });

    const backBtn = 'width:34px; height:34px; border-radius:50%; background:'+t.surface+'; border:1px solid '+t.border+'; display:flex; align-items:center; justify-content:center; cursor:pointer; color:'+t.text+'; flex-shrink:0;';
    const chip = 'padding:8px 12px; background:#fff; border:1px solid #d8d3c8; border-radius:999px; font-size:12px; color:#5c564a; font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap;';

    return {
      t, anim:s.anim, statusColor: t.statusBarDark ? '#FFFFFF' : '#1d1d1f', f:s.f, backBtn, chip, noop:()=>{},
      h: { loginEmail:this.field('loginEmail'), loginPw:this.field('loginPw'), regName:this.field('regName'), regEmail:this.field('regEmail'), regPw:this.field('regPw'), regFarm:this.field('regFarm'), frameMemo:this.field('frameMemo'), aiMemo:this.field('aiMemo'), taskType:this.field('taskType'), taskColony:this.field('taskColony'), taskMemo:this.field('taskMemo'), recType:this.field('recType'), recColony:this.field('recColony'), recMemo:this.field('recMemo') },
      // screen flags
      scLogin:sc==='login', scRegister:sc==='register', scOb1:sc==='ob1', scOb2:sc==='ob2', scOb3:sc==='ob3', scApp:app,
      vHome:app&&v==='home', vNotif:app&&v==='notif', vFarms:app&&v==='farms', vFarmDetail:app&&v==='farmDetail', vFarmMap:app&&v==='farmMap',
      vInspStart:app&&v==='inspStart', vInspCapture:app&&v==='inspCapture', vInspFrame:app&&v==='inspFrame', vInspAI:app&&v==='inspAI', vInspSummary:app&&v==='inspSummary', vInspHistory:app&&v==='inspHistory',
      vSensor:app&&v==='sensor', vGraph:app&&(v==='weight'||v==='temp'||v==='humid'), vCamera:app&&v==='camera', vAiDiagnosis:app&&v==='aiDiagnosis', vAiRecommend:app&&v==='aiRecommend',
      vTasks:app&&v==='tasks', vTaskCreate:app&&v==='taskCreate', vWorkRecord:app&&v==='workRecord', vWorkHistory:app&&v==='workHistory', vReport:app&&v==='report', vSettings:app&&v==='settings',
      nc, notifs, hasUnread, farms, colonies, mapPins, frameChips, selectedCount, aiResults, scoreCells, calCells, healthTrendPts, healthDots, heatRows, tasksView, recActions, reportFarms,
      workHist:this.WORK_HIST, settingsRows:this.SETTINGS,
      sensorLine:sm.d, sensorArea:sma.d,
      faceLabel: s.face==='A'?'表面 A':'裏面 B',
      // graph
      graphTitle:gk.title, graphValue:gk.value, graphUnit:gk.unit, graphColor:gk.color, graphStat:gd.stat, graphLabels:gd.labels, graphLine:gl.d, graphArea:ga.d, graphLastX:gl.last[0].toFixed(1), graphLastY:gl.last[1].toFixed(1),
      reportLine:rt.d, reportArea:rta.d,
      // theme segs
      segHoney:seg(s.theme==='honey'), segCharcoal:seg(s.theme==='charcoal'), segSage:seg(s.theme==='sage'), segKraft:seg(s.theme==='kraft'), segSky:seg(s.theme==='sky'), segBlossom:seg(s.theme==='blossom'),
      thHoney:()=>this.setTheme('honey'), thCharcoal:()=>this.setTheme('charcoal'), thSage:()=>this.setTheme('sage'), thKraft:()=>this.setTheme('kraft'), thSky:()=>this.setTheme('sky'), thBlossom:()=>this.setTheme('blossom'),
      // farm detail tabs
      fdSegOverview:pill(s.fdTab==='overview'), fdSegStats:pill(s.fdTab==='stats'), fdSegMembers:pill(s.fdTab==='members'),
      segTabOverview:()=>this.setState({fdTab:'overview'}), segTabStats:()=>this.setState({fdTab:'stats'}), segTabMembers:()=>this.setState({fdTab:'members'}),
      // weather + face
      wxSun:wxBtn(s.weather==='sun'), wxCloud:wxBtn(s.weather==='cloud'), wxRain:wxBtn(s.weather==='rain'),
      wSun:()=>this.setState({weather:'sun'}), wCloud:()=>this.setState({weather:'cloud'}), wRain:()=>this.setState({weather:'rain'}),
      segFaceA:pill(s.face==='A'), segFaceB:pill(s.face==='B'), faceA:()=>this.setState({face:'A'}), faceB:()=>this.setState({face:'B'}),
      selectAllFrames:()=>this.selectAll(),
      // period segs
      segDay:pill(s.period==='day'), segWeek:pill(s.period==='week'), segMonth:pill(s.period==='month'), segYear:pill(s.period==='year'),
      pDay:()=>this.setState({period:'day'}), pWeek:()=>this.setState({period:'week'}), pMonth:()=>this.setState({period:'month'}), pYear:()=>this.setState({period:'year'}),
      // task filter
      taskSegToday:pill(s.taskFilter==='today'), taskSegWeek:pill(s.taskFilter==='week'), taskSegAll:pill(s.taskFilter==='all'),
      tfToday:()=>this.setState({taskFilter:'today'}), tfWeek:()=>this.setState({taskFilter:'week'}), tfAll:()=>this.setState({taskFilter:'all'}),
      // report period
      repSegMonth:pill(s.reportPeriod==='month'), repSegWeek:pill(s.reportPeriod==='week'), repSegYear:pill(s.reportPeriod==='year'),
      rMonth:()=>this.setState({reportPeriod:'month'}), rWeek:()=>this.setState({reportPeriod:'week'}), rYear:()=>this.setState({reportPeriod:'year'}),
      // auth nav
      goRegister:()=>this.go('register'), goLogin:()=>this.go('login'),
      submitLogin:()=>this.tab('home'), submitRegister:()=>this.go('ob1'),
      goOb2:()=>this.go('ob2'), goOb3:()=>this.go('ob3'), skipOb:()=>this.tab('home'), startApp:()=>this.tab('home'),
      // in-app nav
      back:()=>this.back(),
      goNotif:()=>this.nav('notif'), markAllRead:()=>this.markAllRead(),
      goFarmDetail:()=>this.nav('farmDetail'), goFarmMap:()=>this.nav('farmMap'),
      goInspStart:()=>this.nav('inspStart'), goInspCapture:()=>this.nav('inspCapture'), goInspFrame:()=>this.nav('inspFrame'), goInspAI:()=>this.nav('inspAI'), goInspSummary:()=>this.nav('inspSummary'), goInspHistory:()=>this.tab('tasks'),
      goWeight:()=>this.navGraph('weight'), goTemp:()=>this.navGraph('temp'), goHumid:()=>this.navGraph('humid'),
      goAiDiagnosis:()=>this.nav('aiDiagnosis'), goAiRecommend:()=>this.nav('aiRecommend'),
      goReport:()=>this.tab('report'), goTasks:()=>this.tab('tasks'), goTaskCreate:()=>this.nav('taskCreate'), goWorkRecord:()=>this.nav('workRecord'), goWorkHistory:()=>this.nav('workHistory'),
      // tabs
      tabHome:()=>this.tab('home'), tabFarms:()=>this.tab('farms'), tabTasks:()=>this.tab('tasks'), tabReport:()=>this.tab('report'), tabSettings:()=>this.tab('settings'),
      logout:()=>this.logout(),
      // jump chips
      jLogin:()=>this.go('login'), jRegister:()=>this.go('register'), jOb1:()=>this.go('ob1'), jOb2:()=>this.go('ob2'), jOb3:()=>this.go('ob3'),
      jDash:()=>this.jump('home'), jNotif:()=>this.jump('notif'), jFarms:()=>this.jump('farms'), jFarmDetail:()=>this.jump('farmDetail'), jFarmMap:()=>this.jump('farmMap'),
      jInspStart:()=>this.jump('inspStart'), jInspCapture:()=>this.jump('inspCapture'), jInspFrame:()=>this.jump('inspFrame'), jInspAI:()=>this.jump('inspAI'), jInspSummary:()=>this.jump('inspSummary'), jInspHistory:()=>this.jump('inspHistory'),
      jSensor:()=>this.jump('sensor'), jWeight:()=>this.jumpGraph('weight'), jTemp:()=>this.jumpGraph('temp'), jHumid:()=>this.jumpGraph('humid'), jCamera:()=>this.jump('camera'), jAiDiagnosis:()=>this.jump('aiDiagnosis'), jAiRecommend:()=>this.jump('aiRecommend'),
      jTasks:()=>this.jump('tasks'), jTaskCreate:()=>this.jump('taskCreate'), jWorkRecord:()=>this.jump('workRecord'), jWorkHistory:()=>this.jump('workHistory'), jReport:()=>this.jump('report'),
    };
  }
  navGraph(kind) { this.setState(s=>({ screen:'app', graphKind:kind, view:kind, hist:[...s.hist, s.view], anim:'scrIn' })); }
  jumpGraph(kind) { this.setState({ screen:'app', graphKind:kind, view:kind, hist:[], anim:'scrIn' }); }
}

window._ComponentClass = Component;