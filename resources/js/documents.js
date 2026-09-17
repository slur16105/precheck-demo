// Adapted from the team vendor-document mockup; see docs/vendor-documents.md.
(async function(){
var $=function(i){return document.getElementById(i);};
var esc=function(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
var TODAY=new Date('2026-09-16T00:00:00'); // Fixed date for the source's demonstration scenarios.
var submissionVendor = null, submissionScope = null;
var database = null, drafts = {}, storageReady = false;

/* ===== 서류 원장 ===== */
var MASTER={
 1:{name:"회사소개서 및 사업자등록증",kind:"발급",hint:"국세청 홈택스에서 받으실 수 있습니다",form:"회사소개서_양식",
   how:["국세청 홈택스(hometax.go.kr)에 접속합니다","민원증명 메뉴에서 사업자등록증명을 신청합니다","발급된 PDF 파일을 그대로 올려 주십시오","회사소개서는 양식을 받아 채워 주십시오"],
   tip:"회사소개서에는 <b>공사명, 공사기간, 공사금액, 작업인원, 주요 작업내용, 대표이사 성함</b>이 들어가면 됩니다.",file:"사업자등록증명.pdf"},
 2:{name:"안전관리 조직도",kind:"작성",hint:"다섯 분의 성함과 전화번호만 적으시면 됩니다",form:"안전관리조직도_양식",
   how:["공사감독관 성함과 전화번호","현장대리인(작업감독자) 성함과 전화번호","차량유도자 성함과 전화번호","화재감시자 성함과 전화번호","작업자 성함과 전화번호"],
   tip:"해당되는 분이 없으면 <b>해당없음</b>이라고 적으시면 됩니다. 작업감독자는 작업 중 현장에 계셔야 합니다.",file:"안전관리조직도.jpg"},
 3:{name:"공사감독지정서",kind:"작성",hint:"현장대리인 한 분의 정보를 적습니다",form:"공사감독지정서_양식",
   how:["공사명, 착공일, 준공예정일을 적습니다","현장대리인의 성함, 소속, 생년월일, 전화번호를 적습니다","기술분야와 자격 또는 기술등급을 적습니다","대표자 도장을 찍어 주십시오"],
   tip:"현장에 상주하실 분을 적으시면 됩니다.",file:"공사감독지정서.jpg"},
 4:{name:"공정별 인력 및 장비 투입 현황",kind:"작성",hint:"작업 일자별로 표를 채웁니다",form:"공정별투입현황_양식",
   how:["작업 구분을 적습니다 (준비작업 / 본작업 / 정리작업)","각 구분의 세부 작업 내용을 적습니다","그날 들어오는 인원 수를 적습니다","투입하는 장비를 적습니다 (용접기, 그라인더 등)","위험작업에 해당하는지 표시합니다 (화기작업 등)"],
   tip:"작업이 이틀이면 이틀치를 나눠 적으시면 됩니다.",file:"공정표.csv"},
 5:{name:"비상 시 보고 체계",kind:"작성",hint:"업체 연락처 두 개만 적으시면 됩니다",form:"비상시보고체계_양식",
   how:["관리 책임자 성함과 전화번호","현장 대리인 성함과 전화번호"],
   tip:"소방서, 병원, 노동지청 같은 <b>유관기관 연락처는 양식에 이미 채워져 있습니다.</b> 업체 쪽 연락처만 적으시면 됩니다.",file:"비상연락망.jpg"},
 6:{name:"착공 전 현장 사진",kind:"사진",hint:"휴대폰으로 두 장 찍어 올리시면 됩니다",form:null,
   how:["현장 전체가 보이도록 한 장","작업하실 설비가 보이도록 한 장"],
   tip:"휴대폰으로 찍으신 사진을 그대로 올리시면 됩니다. 따로 편집하지 않으셔도 됩니다. <b>사진은 양식이 없습니다.</b>",file:"현장사진_2장.jpg"},
 7:{name:"최근 3년간 산업재해 발생 현황",kind:"발급",hint:"안전보건공단 자료가 필요합니다",form:"산업재해현황_양식",
   how:["안전보건공단에서 재해 현황 자료를 발급받습니다","양식을 받아 연도별 재해자 수를 적습니다","부상 정도를 적습니다 (사망 / 3~7일 / 8~30일 / 1~3개월 / 3개월 이상)","재해 구분을 적습니다 (추락 / 넘어짐 / 끼임 / 베임 / 감전 / 충돌)"],
   tip:"재해가 없으셨으면 <b>전부 0으로 적으시면 됩니다.</b>",file:"재해현황_공단자료.pdf"},
 8:{name:"산재 · 근재보험 증권",kind:"발급",hint:"가입하신 보험사에서 받으시면 됩니다",form:null,
   how:["가입하신 보험사에 증권 사본을 요청합니다","산재보험과 근재보험 두 가지가 모두 필요합니다","증권번호와 만료일이 보이게 올려 주십시오"],
   tip:"보장금액 기준이 있습니다. <b>인당 5억 원 이상, 사고당 10억 원 이상</b>입니다. <b>보험사에서 발급하는 증권이라 양식이 없습니다.</b>",file:"보험증권.pdf"},
 9:{name:"안전교육 현황 및 자격이수 현황",kind:"작성",hint:"교육 서명지와 자격증 사본을 올립니다",form:"안전교육현황_양식",
   how:["안전교육 서명지를 올립니다","보유하신 자격증 사본을 올립니다"],
   tip:"법정 교육 기준입니다. 정기교육은 전 근로자 <b>매월 2시간 이상 또는 분기 6시간</b>, 관리감독자는 <b>반기 8시간 이상 또는 연간 16시간 이상</b>입니다.",file:"교육서명지.pdf"},
 10:{name:"그 밖의 안전 관련 서류",kind:"선택",hint:"해당되는 것만 올리시면 됩니다",form:"기타안전서류_양식모음",
   how:["건설안전 진단 결과지","안전교육 계획","현장 순찰 계획","일일 작업종료 후 점검사항","안전보호구 지급 기준과 지급 대장","폐기물 처리 계획","작업 위험요인에 대한 대책 방안"],
   tip:"이 항목은 <b>선택</b>입니다. 없으셔도 제출하실 수 있습니다.",file:"기타서류.pdf"},
 11:{name:"화학물질 안전보건자료",kind:"발급",hint:"취급하시는 화학물질의 물질안전보건자료가 필요합니다",form:"화학물질자료_양식",
   how:["취급 예정인 화학물질 목록을 적습니다","물질별 물질안전보건자료를 첨부합니다","보관 장소와 취급량을 적습니다"],
   tip:"화학공장이 있는 사업장에서만 받는 서류입니다.",file:"MSDS.pdf"}
};

/* ===== 사업장 ===== */
function mkSt(ids,pattern){var o={};ids.forEach(function(id,i){o[id]=pattern[i]!==undefined?pattern[i]:1;});return o;}
var SITES={
 "제1사업장":{docIds:[1,2,3,4,5,6,7,8,9,10],vendors:[
   {nm:"(주)한빛산업",biz:"기계설비",tel:"010-0000-0001",mail:"hanbit@example.com",last:"2026-01-12",
    why:"2천만원 이상 공사",cause:"1호기 배관 보수공사 3,200만원 등록",scope:[8,4],dd:-2,need:true,r:"r2",
    st:mkSt([1,2,3,4,5,6,7,8,9,10],[1,1,1,1,1,1,1,1,1,0]),
    logs:[{d:"2026-09-14",t:"1차 요청 발송 (문자·메일)"},{d:"2026-09-16",t:"2차 요청 발송 (문자)"}]},
   {nm:"정우플랜트",biz:"배관공사",tel:"010-0000-0002",mail:"jw-plant@example.com",last:"2026-02-03",
    why:"작성 미흡 보완",cause:"보험 보장금액이 인당 3억으로 기준에 못 미침",scope:[8],dd:-1,need:true,over:true,r:"r3",
    st:mkSt([1,2,3,4,5,6,7,8,9,10],[1,1,1,1,1,1,1,2,1,1]),
    note:{8:"보장금액 인당 3억 — 기준 5억에 못 미칩니다"},
    logs:[{d:"2026-09-15",t:"1차 보완 요청 발송 (메일)"}]},
   {nm:"대성엔지니어링",biz:"냉각탑 정비",tel:"010-0000-0003",mail:"daesung@example.com",last:"2025-09-20",
    why:"연 1회 갱신",cause:"제출한 지 1년이 지났습니다",scope:"all",dd:5,need:true,r:"r1",
    st:mkSt([1,2,3,4,5,6,7,8,9,10],[1,1,1,1,1,1,1,1,1,1]),logs:[]},
   {nm:"세림기공",biz:"배관공사",tel:"010-0000-0004",mail:"serim@example.com",last:"2026-09-16",dd:7,need:false,
    review:'pending', st:mkSt([1,2,3,4,5,6,7,8,9,10],[1,1,1,1,1,1,1,1,1,0]),
    logs:[{d:"2026-09-10",t:"등록 요청 발송 (메일)"},{d:"2026-09-16",t:"업체가 서류를 제출함"}]},
   {nm:"삼양기공",biz:"보온재",tel:"010-0000-0005",mail:"samyang@example.com",last:"2026-02-11",dd:148,need:false,
    st:mkSt([1,2,3,4,5,6,7,8,9,10],[1,1,1,1,1,1,1,1,1,1]),logs:[{d:"2026-02-04",t:"등록 요청 발송 (메일)"}]},
   {nm:"신한테크",biz:"전기공사",tel:"010-0000-0006",mail:"shinhan-t@example.com",last:"2026-03-04",dd:169,need:false,
    st:mkSt([1,2,3,4,5,6,7,8,9,10],[1,1,1,1,1,1,1,1,1,0]),logs:[]},
   {nm:"동방설비",biz:"소방설비",tel:"010-0000-0007",mail:"dongbang@example.com",last:"2026-04-22",dd:218,need:false,
    st:mkSt([1,2,3,4,5,6,7,8,9,10],[1,1,1,1,1,1,1,1,1,1]),logs:[]},
   {nm:"우진산업",biz:"철골",tel:"010-0000-0008",mail:"woojin@example.com",last:"2026-05-08",dd:234,need:false,
    st:mkSt([1,2,3,4,5,6,7,8,9,10],[1,1,1,1,1,1,1,1,1,0]),logs:[]},
   {nm:"태경이엔지",biz:"계장",tel:"010-0000-0009",mail:"taekyung@example.com",last:"2026-06-15",dd:272,need:false,
    st:mkSt([1,2,3,4,5,6,7,8,9,10],[1,1,1,1,1,1,1,1,1,1]),logs:[]}
 ]},
 "제2사업장":{docIds:[1,2,3,4,5,7,8,9],vendors:[
   {nm:"해성중공업",biz:"압력용기",tel:"010-0000-0010",mail:"haesung@example.com",last:"2025-10-02",
    why:"연 1회 갱신",cause:"제출한 지 1년이 다 되었습니다",scope:"all",dd:3,need:true,r:"r1",
    st:mkSt([1,2,3,4,5,7,8,9],[1,1,1,1,1,1,1,1]),logs:[]},
   {nm:"유진플랜트",biz:"덕트",tel:"010-0000-0011",mail:"yujin@example.com",last:"2026-03-18",dd:183,need:false,
    st:mkSt([1,2,3,4,5,7,8,9],[1,1,1,1,1,1,1,1]),logs:[]},
   {nm:"세아기전",biz:"전기",tel:"010-0000-0012",mail:"seah@example.com",last:"2026-05-30",dd:256,need:false,
    st:mkSt([1,2,3,4,5,7,8,9],[1,1,1,1,1,1,1,0]),logs:[]}
 ]},
 "제3사업장":{docIds:[1,2,3,4,5,6,7,8,9,10,11],vendors:[
   {nm:"한울케미칼",biz:"화학설비",tel:"010-0000-0013",mail:"hanul@example.com",last:"2026-01-28",
    why:"작성 미흡 보완",cause:"화학물질 안전보건자료가 일부만 제출됨",scope:[11],dd:1,need:true,r:"r3",
    st:mkSt([1,2,3,4,5,6,7,8,9,10,11],[1,1,1,1,1,1,1,1,1,1,2]),
    note:{11:"취급 물질 6종 중 2종만 자료가 있습니다"},logs:[{d:"2026-09-15",t:"1차 보완 요청 발송 (메일)"}]},
   {nm:"대륙산업",biz:"배관",tel:"010-0000-0014",mail:"daeryuk@example.com",last:"2026-04-09",dd:205,need:false,
    st:mkSt([1,2,3,4,5,6,7,8,9,10,11],[1,1,1,1,1,1,1,1,1,1,1]),logs:[]}
 ]}
};

// The first site's shared companies follow the existing worker-history fixture.
(window.mockData?.companies || []).forEach(function(company, i) {
  if (SITES['제1사업장'].vendors[i]) {
    SITES['제1사업장'].vendors[i].nm = company.name;
    SITES['제1사업장'].vendors[i].companyId = company.id;
  }
});
Object.entries(SITES).forEach(function(entry, siteIndex) {
  entry[1].vendors.forEach(function(v, i) { v.id = 'site-' + siteIndex + '-vendor-' + i; });
});

var S={auth:false, view:'submit', site:'제1사업장', filter:'all', cur:null, sel:{}};

/* ===== 공통 ===== */
function submissionIds(){
  return submissionScope || SITES[S.site].docIds;
}
function docsOf(){ return submissionIds().map(function(id){var d=Object.create(MASTER[id]); d.id=id; return d;}); }
function vlist(){ return SITES[S.site].vendors; }
function reqIds(){ return submissionIds().filter(function(id){ return MASTER[id].kind!=='선택'; }); }
function fmtK(s){ return s.replace(/-/g,'.'); }
function fmtLong(s){ var p=s.split('-'); return p[0]+'년 '+(+p[1])+'월 '+(+p[2])+'일'; }
function addDays(n){ var d=new Date(TODAY.getTime()); d.setDate(d.getDate()+n); return d; }
function isoOf(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function dueISO(){ return isoOf(addDays(7)); }
function ddText(d){
  if(d<0) return '<span class="p_dd p_r">'+Math.abs(d)+'일 지남</span>';
  if(d<=7) return '<span class="p_dd p_y">D-'+d+'</span>';
  return '<span class="p_dd p_g">D-'+d+'</span>';
}
function copyText(txt){
  if(navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
  return new Promise(function(res,rej){
    try{ var ta=document.createElement('textarea'); ta.value=txt; ta.setAttribute('readonly','');
      ta.className='a11y_hidden'; document.body.appendChild(ta); ta.select();
      var ok=document.execCommand('copy'); ta.remove(); ok?res():rej();
    }catch(e){ rej(e); }
  });
}
function flash(id,msg){ var el=$(id); el.textContent=msg; setTimeout(function(){ if(el.textContent===msg) el.textContent=''; },4000); }
function hyphenTel(v){
  var n=v.replace(/[^0-9]/g,'').slice(0,11);
  if(n.length<4) return n;
  if(n.length<8) return n.slice(0,3)+'-'+n.slice(3);
  return n.slice(0,3)+'-'+n.slice(3,7)+'-'+n.slice(7);
}

/* ===== 화면 전환 ===== */
function renderAuth(){
  $('authbar').innerHTML=S.auth
    ? '<span class="p_who">안전환경팀 담당자</span><button class="btn m_ghost m_small" id="doLogout">로그아웃</button>'
    : '<button class="btn m_small" id="toLogin">관리자 로그인</button>';
  if(S.auth) $('doLogout').addEventListener('click',function(){ S.auth=false; S.sel={}; go('submit'); });
  else $('toLogin').addEventListener('click',function(){ go('login'); });
}
$('site').addEventListener('change',function(){
  S.site=this.value; S.sel={}; S.cur=null; submissionVendor=null; submissionScope=null; picked={}; filled={}; $('vName').readOnly=false; $('vName').value=''; $('vTel').value='';
  $('vSite').textContent=this.value;
  buildDocs(); renderList(); go('list');
});
var PANELS={login:'pLogin',list:'pList',det:'pDet',req:'pReq',add:'pAdd',submit:'pSubmit'};
function go(v){
  if(!S.auth && v!=='submit' && v!=='login') v='login';
  S.view=v;
  Object.keys(PANELS).forEach(function(k){ $(PANELS[k]).hidden = (k!==v); });
  $('tabs').hidden=!S.auth;
  $('documentControls').hidden=!S.auth;
  $('documentWorkspace').dataset.state=S.auth?'admin':'standalone';
  $('site').value=S.site;
  syncSelection();
  $('pvNote').hidden=!S.auth;
  $('pvHead').hidden=S.auth;
  $('t3').setAttribute('aria-pressed', (v==='list'||v==='det'||v==='req'||v==='add')?'true':'false');
  $('t1').setAttribute('aria-pressed', v==='submit'?'true':'false');
  renderAuth();
  var behavior=matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
  if(S.auth && $('documentWorkspace').clientWidth<=780 && v!=='list') $(PANELS[v]).scrollIntoView({block:'start',behavior:behavior});
  else window.scrollTo({top:0,behavior:behavior});
}
$('doLogin').addEventListener('click',function(){ S.auth=true; renderList(); go('list'); });
$('lpw').addEventListener('keydown',function(e){ if(e.key==='Enter'){ S.auth=true; renderList(); go('list'); } });
$('t3').addEventListener('click',function(){ go('list'); });
$('t1').addEventListener('click',function(){ submissionVendor=null; submissionScope=null; $('vName').readOnly=false; $('vName').value=''; $('vTel').value=''; $('subForm').hidden=false; $('subDone').hidden=true; picked={}; filled={}; buildDocs(); go('submit'); });
$('detBack').addEventListener('click',function(){ go('list'); });
$('reqBack').addEventListener('click',function(){ go(S.cur!==null?'det':'list'); });
$('addBack').addEventListener('click',function(){ go('list'); });

/* ===== 서류 현황 ===== */
function dotsOf(v){
  var ids=SITES[S.site].docIds;
  return '<span class="p_dots">'+ids.map(function(id){
    var s=v.st[id]||0;
    var word=(s===1?'제출됨':(s===2?'보완 필요':'미제출'));
    return '<i data-state="'+(s===1?'complete':s===2?'needs-review':'missing')+'" title="'+esc(id+'. '+MASTER[id].name+' — '+word)+'"></i>';
  }).join('')+'</span>';
}
function lastLog(v){ return v.logs && v.logs.length ? v.logs.length+'회 · '+fmtK(v.logs[v.logs.length-1].d) : '없음'; }
function vendorStatus(v){
  return v.review==='pending' ? {label:'검토 대기',tone:'m_brand'} : v.need ? {label:v.dd<0?'기한 지남':'재제출 필요',tone:v.dd<0?'m_danger':'m_warning'} : {label:'유효',tone:'m_success'};
}
function syncSelection(){
  document.querySelectorAll('[data-vendor-id]').forEach(function(button){
    button.setAttribute('aria-pressed',String(S.view==='det' && +button.dataset.vendorId===S.cur));
  });
}
function rowHTML(v,i,mode){
  var checked=S.sel[v.nm]?' checked':'', status=vendorStatus(v);
  var count=SITES[S.site].docIds.filter(function(id){return v.st[id]===1;}).length;
  var action=mode===true ? '<button class="btn m_small" data-go="'+i+'">요청 보내기</button>' : '<button class="btn m_small" data-det="'+i+'">'+(mode==='review'?'서류 검토':'서류 보기')+'</button>';
  return '<tr class="p_row" data-i="'+i+'" tabindex="0">'+
    '<td class="p_ck"><input type="checkbox" data-sel="'+i+'"'+checked+' aria-label="'+esc(v.nm)+' 선택"></td>'+
    '<td class="p_nm">'+esc(v.nm)+'<small>'+esc(v.biz)+'</small><small class="p_mono">'+esc(v.tel)+'</small></td>'+
    '<td>'+dotsOf(v)+'<span class="p_cell_meta">'+count+' / '+SITES[S.site].docIds.length+'종 제출</span></td>'+
    '<td class="p_status_cell"><span class="badge '+status.tone+'">'+status.label+'</span>'+
      (mode===true ? '<span class="p_cell_meta">'+esc(v.why)+'</span><span class="p_cell_meta">'+esc(v.cause)+'</span>' : '')+
      (mode==='review'?'':'<span class="p_cell_meta">'+ddText(v.dd)+'</span>')+'</td>'+
    '<td class="p_mono">'+fmtK(v.last)+'<span class="p_cell_meta">요청 '+lastLog(v)+'</span></td>'+
    '<td>'+action+'</td></tr>';
}
function renderList(){
  var f=(($('q')||{}).value||'').trim(), rev=[], need=[], ok=[];
  vlist().forEach(function(v,i){
    if(f && v.nm.indexOf(f)<0 && v.biz.indexOf(f)<0) return;
    if(S.filter==='review' && v.review!=='pending') return;
    if(S.filter==='need' && !(v.need && v.review!=='pending')) return;
    if(S.filter==='over' && !(v.dd<0)) return;
    if(S.filter==='ok' && (v.need || v.review==='pending')) return;
    if(v.review==='pending') rev.push({v:v,i:i});
    else (v.need?need:ok).push({v:v,i:i});
  });
  $('tbNew').innerHTML = rev.length ? rev.map(function(o){return rowHTML(o.v,o.i,'review');}).join('')
    : '<tr><td colspan="6" class="p_empty">검토를 기다리는 제출이 없습니다</td></tr>';
  $('n0').textContent=rev.length+'곳';
  $('tbNeed').innerHTML = need.length ? need.map(function(o){return rowHTML(o.v,o.i,true);}).join('')
    : '<tr><td colspan="6" class="p_empty">해당하는 업체가 없습니다</td></tr>';
  $('tbOk').innerHTML = ok.length ? ok.map(function(o){return rowHTML(o.v,o.i,false);}).join('')
    : '<tr><td colspan="6" class="p_empty">해당하는 업체가 없습니다</td></tr>';
  $('n1').textContent=need.length+'곳'; $('n2').textContent=ok.length+'곳';
  var matches=[...rev,...need,...ok], ids=SITES[S.site].docIds;
  $('qcnt').textContent='검색 결과 '+matches.length+'곳';
  $('metricTotal').textContent=matches.length+'곳'; $('metricReview').textContent=rev.length+'곳'; $('metricNeed').textContent=need.length+'곳'; $('metricValid').textContent=ok.length+'곳';
  $('overviewSite').textContent=S.site;
  $('overviewDescription').textContent='현재 검색 결과 기준 · 업체를 선택해 서류를 검토합니다.';
  $('siteSummary').textContent=S.site+'에서 제출받는 서류입니다.';
  $('requiredCount').textContent=ids.filter(function(id){return MASTER[id].kind!=='선택';}).length+'종';
  $('optionalCount').textContent=ids.filter(function(id){return MASTER[id].kind==='선택';}).length+'종';
  $('vendorResults').innerHTML=matches.length ? matches.map(function(item){
    var v=item.v, status=vendorStatus(v);
    return '<li><button class="result_card" type="button" data-vendor-id="'+item.i+'" aria-pressed="false" aria-controls="pDet"><span class="i_top"><span class="i_name">'+esc(v.nm)+'</span><span class="badge '+status.tone+'">'+status.label+'</span></span><span class="i_meta">'+esc(v.biz)+' · 최근 제출 '+fmtK(v.last)+'</span></button></li>';
  }).join('') : '<li class="empty_state">일치하는 업체가 없습니다.</li>';
  syncSelection();

  [].slice.call(document.querySelectorAll('[data-go]')).forEach(function(b){
    b.addEventListener('click',function(e){ e.stopPropagation(); openReq(+b.dataset.go); }); });
  [].slice.call(document.querySelectorAll('[data-det]')).forEach(function(b){
    b.addEventListener('click',function(e){ e.stopPropagation(); openDet(+b.dataset.det); }); });
  [].slice.call(document.querySelectorAll('[data-sel]')).forEach(function(c){
    c.addEventListener('click',function(e){ e.stopPropagation(); });
    c.addEventListener('change',function(){
      var v=vlist()[+c.dataset.sel];
      if(c.checked) S.sel[v.nm]=true; else delete S.sel[v.nm];
      renderBulk();
    });
  });
  [].slice.call(document.querySelectorAll('tr.p_row')).forEach(function(r){
    r.addEventListener('click',function(){ openDet(+r.dataset.i); });
    r.addEventListener('keydown',function(e){ if(e.key==='Enter' && e.target===r) openDet(+r.dataset.i); });
  });
  renderBulk();
}
function renderBulk(){
  var n=Object.keys(S.sel).length;
  $('bulkbar').hidden = n===0;
  $('bulkTxt').textContent = n+'곳을 선택했습니다';
}
$('vendorResults').addEventListener('click',function(event){ var button=event.target.closest('[data-vendor-id]'); if(button) openDet(+button.dataset.vendorId); });
$('q').addEventListener('input',function(){ renderList(); if(S.view!=='list') go('list'); });
[].slice.call(document.querySelectorAll('#filters button')).forEach(function(b){
  b.addEventListener('click',function(){
    S.filter=b.dataset.f;
    [].slice.call(document.querySelectorAll('#filters button')).forEach(function(x){
      x.setAttribute('aria-pressed', x===b ? 'true':'false'); });
    renderList(); if(S.view!=='list') go('list');
  });
});
$('bulkClear').addEventListener('click',function(){ S.sel={}; renderList(); });
$('bulkSend').addEventListener('click',function(){
  var names=Object.keys(S.sel), today=isoOf(TODAY);
  vlist().forEach(function(v){ if(S.sel[v.nm]) v.logs.push({d:today,t:'일괄 요청 발송 기록 (시연)'}); });
  S.sel={}; renderList();
  flash('bulkMsg', names.length+'곳의 요청 이력을 기록했습니다 (시연)');
  setTimeout(function(){ $('bulkbar').hidden=false; $('bulkTxt').textContent='기록 완료'; },0);
});

/* ===== 업체 상세 ===== */
function openDet(i){
  S.cur=i; var v=vlist()[i];
  $('detName').textContent=v.nm;
  $('detAvatar').textContent=v.nm.replace(/^\(주\)/,'').charAt(0);
  var status=vendorStatus(v); $('detStatus').textContent=status.label; $('detStatus').className='badge '+status.tone;
  $('detSub').textContent=v.biz+' · 최근 제출 '+fmtLong(v.last)+(v.need?' · '+v.why:v.review==='pending'?' · 검토 대기':' · 서류가 유효합니다');
  var ids=SITES[S.site].docIds, done=0, bad=0;
  ids.forEach(function(id){ if(v.st[id]===1) done++; if(v.st[id]===2) bad++; });
  $('detSubmitted').textContent=done+' / '+ids.length+'종';
  $('detIssues').textContent=bad+'건';
  $('detDue').textContent=v.dd<0?Math.abs(v.dd)+'일 지남':'D-'+v.dd;
  $('detRequests').textContent=(v.logs?.length || 0)+'회';
  $('detCount').textContent=done+' / '+ids.length+' 제출'+(bad?' · 보완 '+bad+'건':'');
  $('detDocs').querySelectorAll('[data-url]').forEach(function(box){ URL.revokeObjectURL(box.dataset.url); });
  $('detDocs').innerHTML=ids.map(function(id){
    var s=v.st[id]||0, d=MASTER[id];
    var mark=(s===1?'<span class="p_dmark p_ok">✓</span>':(s===2?'<span class="p_dmark p_bad">!</span>':'<span class="p_dmark">'+id+'</span>'));
    var sub;
    if(s===1){
      var real=filesFor(v,id)[0];
      var fname=real ? real.name + (filesFor(v,id).length > 1 ? ' 외 '+(filesFor(v,id).length-1)+'개' : '') : d.file;
      var canPv=real && (/^image\//.test(real.type) || real.type==='application/pdf');
      sub='<p class="p_s"><button class="p_fl" data-dl="'+id+'" title="눌러서 내려받기">'+esc(fname)+'</button> · '+fmtK(v.last)+' 제출'+
          (canPv?' · <button class="p_fl" data-pv="'+id+'">미리보기</button>':'')+
          '<span class="p_dlmsg" id="dm'+id+'"></span></p>'+
          '<div class="p_pvbox" id="pv'+id+'" hidden></div>';
    }
    else if(s===2) sub='<p class="p_s p_warn">보완 필요 — '+esc((v.note&&v.note[id])||'작성 상태가 미흡합니다')+'</p>';
    else sub='<p class="p_s">'+(d.kind==='선택'?'선택 항목입니다':'아직 제출되지 않았습니다')+'</p>';
    var btn = s===1 ? '<button class="btn m_small" data-mark="'+id+'">보완 요청</button>'
            : (s===2 ? '<button class="btn m_small" data-unmark="'+id+'">보완 해제</button>' : '');
    var form='';
    if(s===1||s===2){
      form='<div class="p_badform" id="bf'+id+'" hidden>'+
        '<label for="bt'+id+'">보완 사유를 적어 주십시오. 업체에 그대로 전달됩니다.</label>'+
        '<div class="p_presets">'+PRESETS.map(function(x,k){
          return '<button type="button" data-ps="'+id+'|'+k+'">'+esc(x)+'</button>';}).join('')+'</div>'+
        '<textarea class="input_text m_textarea" id="bt'+id+'" placeholder="예) 보장금액이 인당 3억으로 기준 5억에 못 미칩니다"></textarea>'+
        '<div class="p_row"><button class="btn m_primary m_small" data-okbad="'+id+'">보완 요청 보내기</button>'+
        '<button class="btn m_ghost m_small" data-nobad="'+id+'">취소</button>'+
        '<span class="p_warn" id="bw'+id+'"></span></div></div>';
    }
    return '<li data-state="'+(s===2?'needs-review':'normal')+'"'+'>'+mark+
      '<div class="p_dinfo"><p class="p_t">'+id+'. '+esc(d.name)+'</p>'+sub+form+'</div>'+
      '<div class="p_dbtn">'+btn+'</div></li>';
  }).join('');
  $('detInfo').innerHTML='<dt>업종</dt><dd>'+esc(v.biz)+'</dd>'+
    '<dt>휴대전화</dt><dd class="p_mono">'+esc(v.tel)+'</dd>'+
    '<dt>메일</dt><dd class="p_break">'+esc(v.mail)+'</dd>'+
    '<dt>최근 제출</dt><dd>'+fmtLong(v.last)+'</dd>'+
    '<dt>상태</dt><dd>'+(v.review==='pending'?'검토 대기':v.need?esc(v.why):'유효')+'</dd>';
  $('detLogN').textContent=(v.logs?v.logs.length:0)+'회';
  $('detLogs').innerHTML = (v.logs&&v.logs.length)
    ? v.logs.slice().reverse().map(function(l){ return '<li><b>'+fmtK(l.d)+'</b> '+esc(l.t)+'</li>'; }).join('')
    : '<li class="p_muted">아직 보낸 요청이 없습니다</li>';
  [].slice.call($('detDocs').querySelectorAll('[data-pv]')).forEach(function(b){
    b.addEventListener('click',function(){ preview(+b.dataset.pv); }); });
  [].slice.call($('detDocs').querySelectorAll('[data-dl]')).forEach(function(b){
    b.addEventListener('click',function(){ download(+b.dataset.dl); }); });
  [].slice.call($('detDocs').querySelectorAll('[data-ps]')).forEach(function(b){
    b.addEventListener('click',function(){
      var a=b.dataset.ps.split('|'); $('bt'+a[0]).value=PRESETS[+a[1]]; $('bt'+a[0]).focus(); }); });
  [].slice.call($('detDocs').querySelectorAll('[data-okbad]')).forEach(function(b){
    b.addEventListener('click',function(){ confirmBad(+b.dataset.okbad); }); });
  [].slice.call($('detDocs').querySelectorAll('[data-nobad]')).forEach(function(b){
    b.addEventListener('click',function(){ $('bf'+b.dataset.nobad).hidden=true; }); });
  var pend = v.review==='pending';
  $('approveBox').hidden=!pend;
  if(pend){
    $('approveTxt').textContent = bad
      ? '보완이 필요한 항목이 '+bad+'건 있습니다. 보완 요청을 보내거나, 문제가 없다면 그대로 승인하실 수 있습니다.'
      : '서류를 모두 확인하셨으면 등록을 승인하십시오. 승인하면 유효 목록으로 옮겨집니다.';
  }
  [].slice.call($('detDocs').querySelectorAll('[data-mark]')).forEach(function(b){
    b.addEventListener('click',function(){ markBad(+b.dataset.mark); }); });
  [].slice.call($('detDocs').querySelectorAll('[data-unmark]')).forEach(function(b){
    b.addEventListener('click',function(){ unmarkBad(+b.dataset.unmark); }); });
  ids.forEach(function(id) {
    var files=filesFor(v,id), message=$('dm'+id);
    if(files.length>1 && message) {
      files.forEach(function(file,index) {
        var button=document.createElement('button'); button.className='btn m_ghost m_small';
        button.textContent=(index+1)+'. '+file.name;
        button.addEventListener('click', function(){ downloadFile(file); }); message.appendChild(button);
      });
    }
  });
  go('det');
}
function downloadSample(id,v,msg){
  var d=MASTER[id];
  if(!d || !window.DocumentSample){
    if(msg) msg.textContent='시연용 예시 데이터라 받을 파일이 없습니다. 업체가 올린 파일은 그대로 내려받아집니다.';
    return;
  }
  if(msg) msg.textContent='샘플 파일을 만드는 중입니다…';
  window.DocumentSample.make(d,v.nm,fmtLong(v.last)).then(function(out){
    var a=document.createElement('a');
    a.href=URL.createObjectURL(out.blob); a.download=out.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 60000);
    if(msg) msg.textContent='시연용 샘플 파일을 내려받았습니다. 업체가 직접 올린 파일이 있으면 그 파일이 그대로 받아집니다.';
  }).catch(function(){
    if(msg) msg.textContent='이 화면에서는 받을 수 없습니다. 파일은 정상 접수되었습니다.';
  });
}
function download(id){
  var v=vlist()[S.cur], f=filesFor(v,id)[0], msg=$('dm'+id);
  if(!f){ downloadSample(id,v,msg); return; }
  if(msg) msg.textContent='';
  function anchor(){
    try{
      var a=document.createElement('a');
      a.href=URL.createObjectURL(f); a.download=f.name;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); }, 60000);
      if(msg) msg.textContent='내려받았습니다';
    }catch(e){ if(msg) msg.textContent='이 화면에서는 받을 수 없습니다. 파일은 정상 접수되었습니다.'; }
  }
  anchor();
}
function preview(id){
  var v=vlist()[S.cur], box=$('pv'+id);
  if(!box) return;
  if(!box.hidden){ if(box.dataset.url) URL.revokeObjectURL(box.dataset.url); box.hidden=true; box.innerHTML=''; return; }
  box.hidden=false;
  var f=filesFor(v,id)[0];
  if(!f){ box.innerHTML='<p class="p_pvnote">시연용 예시 데이터라 열어 볼 파일이 없습니다. 업체 화면에서 직접 올리신 파일은 여기서 바로 보입니다.</p>'; return; }
  var url=null;
  try{ url=URL.createObjectURL(f); box.dataset.url=url; }catch(e){ url=null; }
  if(!url){
    box.innerHTML='<p class="p_pvnote">'+esc(f.name)+'<br>이 화면에서는 파일을 열 수 없습니다. 파일은 정상적으로 접수되었습니다.</p>';
  }else if(/^image\//.test(f.type)){
    box.innerHTML='<img src="'+url+'" alt="'+esc(f.name)+'">';
  }else if(f.type==='application/pdf'){
    box.innerHTML='<iframe src="'+url+'" title="'+esc(f.name)+'"></iframe>';
  }else{
    box.innerHTML='<p class="p_pvnote">'+esc(f.name)+'<br>브라우저에서 바로 볼 수 없는 형식입니다. 내려받아 확인하십시오.</p>';
  }
}
$('doApprove').addEventListener('click',function(){
  var v=vlist()[S.cur];
  v.review='done'; v.need=false; v.over=false;
  delete v.why; delete v.cause; delete v.scope; v.r=null;
  v.dd=365;
  v.logs.push({d:isoOf(TODAY),t:'담당자가 검토 완료 · 등록 승인'});
  renderList(); openDet(S.cur);
});
function recalc(v){
  var ids=SITES[S.site].docIds, bad=[], miss=[];
  ids.forEach(function(id){
    if(v.st[id]===2) bad.push(id);
    if(!v.st[id] && MASTER[id].kind!=='선택') miss.push(id);
  });
  if(bad.length){
    v.need=true; v.r='r3'; v.why='작성 미흡 보완';
    v.cause=bad.map(function(id){
      var n=v.note&&v.note[id];
      return MASTER[id].name+(n?' — '+n:'');
    }).join(' / ');
    v.scope=bad;
  }else if(miss.length){
    v.need=true; v.r='r3'; v.why='미제출 보완';
    v.cause=miss.map(function(id){return MASTER[id].name;}).join(', ')+' 미제출';
    v.scope=miss;
  }else if(v.r==='r1'||v.r==='r2'){ /* 갱신·금액 사유는 유지 */ }
  else{ v.need=false; v.over=false; delete v.why; delete v.cause; delete v.scope; }
}
var PRESETS=[
  '보장금액이 기준에 못 미칩니다',
  '유효기간이 지났습니다',
  '내용이 일부 비어 있습니다',
  '글씨가 흐려 확인이 어렵습니다',
  '대표자 도장이 없습니다',
  '최신 양식이 아닙니다'
];
function markBad(id){
  var box=$('bf'+id);
  if(!box) return;
  box.hidden=false;
  var v=vlist()[S.cur];
  $('bt'+id).value=(v.note&&v.note[id])||'';
  $('bt'+id).focus();
}
function confirmBad(id){
  var v=vlist()[S.cur], txt=($('bt'+id).value||'').trim();
  if(!txt){ $('bw'+id).textContent='사유를 적어 주십시오'; $('bt'+id).focus(); return; }
  v.st[id]=2; v.note=v.note||{}; v.note[id]=txt;
  v.logs.push({d:isoOf(TODAY),t:MASTER[id].name+' 보완 요청 — '+txt});
  recalc(v); renderList(); openDet(S.cur);
}
function unmarkBad(id){
  var v=vlist()[S.cur];
  v.st[id]=1; if(v.note) delete v.note[id];
  recalc(v); renderList(); openDet(S.cur);
}
$('detReq').addEventListener('click',function(){ if(S.cur!==null) openReq(S.cur); });

/* ===== 재제출 요청 ===== */
function tokenFor(i){ return vlist()[i].id; }
function linkFor(i){ var url = new URL(location.href); url.search=''; url.hash=''; url.searchParams.set('site', S.site); url.searchParams.set('submit',tokenFor(i)); return url.href; }
function scopeNames(v){
  if(!v.scope || v.scope==='all') return ['서류 '+SITES[S.site].docIds.length+'종 전체'];
  return v.scope.map(function(id){ return MASTER[id].name; });
}
function mailBody(v,i){
  return '안녕하십니까. 한솔홀딩스 안전환경팀입니다.\n\n'+
    v.nm+' 업체 등록 서류 재제출을 요청드립니다.\n'+
    '사유: '+(v.cause||'정기 확인')+'\n'+
    '요청 서류: '+scopeNames(v).join(', ')+'\n'+
    '제출 기한: '+fmtLong(dueISO())+' (1주일)\n\n'+
    '아래 링크를 열어 서류를 올려 주시면 됩니다. 로그인은 필요 없습니다.\n'+
    linkFor(i)+'\n\n'+
    '서류마다 받는 방법과 양식을 함께 두었습니다.\n'+
    '작성하실 내용은 없고 파일만 올리시면 됩니다.\n\n'+
    '문의: 안전환경팀 000-0000-0000';
}
function openReq(i){
  S.cur=i; var v=vlist()[i];
  ['r1','r2','r3'].forEach(function(id){ $(id).dataset.state = id===v.r ? 'selected' : 'idle'; });
  $('cTitle').textContent=v.nm+' — 재제출 요청';
  $('cWhy').textContent=v.why||'정기 확인';
  $('cWhy').className='badge '+(v.over?'m_danger':'m_brand');
  $('cLast').textContent=fmtLong(v.last);
  $('cCause').textContent=v.cause||'정기 확인';
  $('cTo').innerHTML=esc(v.mail)+' <span class="p_muted">· '+esc(v.tel)+'</span>';
  $('cDue').textContent=fmtLong(dueISO());
  $('cOnly').innerHTML=scopeNames(v).map(function(s){return '<span>'+esc(s)+'</span>';}).join('');
  $('cMsg').textContent=mailBody(v,i);
  $('linkBox').hidden=true; $('okMsg').textContent='';
  go('req');
}
$('mkLink').addEventListener('click',function(){
  if(S.cur===null) return;
  $('linkVal').value=linkFor(S.cur); $('linkBox').hidden=false; flash('okMsg','링크를 만들었습니다');
});
$('copyLink').addEventListener('click',function(){
  copyText($('linkVal').value).then(function(){ flash('okMsg','링크를 복사했습니다'); })
    .catch(function(){ $('linkVal').select(); flash('okMsg','직접 복사해 주십시오'); });
});
$('openLink').addEventListener('click',function(){ prepareSubmission(vlist()[S.cur]); go('submit'); });
$('copyMail').addEventListener('click',function(){
  if(S.cur===null) return;
  copyText(mailBody(vlist()[S.cur],S.cur)).then(function(){ flash('okMsg','메일 내용을 복사했습니다'); })
    .catch(function(){ flash('okMsg','복사가 막혀 있습니다. 위 내용을 직접 복사해 주십시오'); });
});
$('markSent').addEventListener('click',function(){
  if(S.cur===null) return;
  var v=vlist()[S.cur];
  v.logs.push({d:isoOf(TODAY),t:(v.logs.length+1)+'차 요청 발송 (문자·메일)'});
  renderList(); flash('okMsg','발송 이력에 남겼습니다');
});

/* ===== 신규 업체 추가 ===== */
function judge(){
  var amt=parseInt($('aAmt').value||'0',10), big=amt>=2000;
  var start=$('aStart').value||isoOf(addDays(12));
  var due=new Date(start+'T00:00:00'); due.setDate(due.getDate()-3);
  var dd=Math.round((due-TODAY)/86400000);
  $('aJudge').innerHTML='필요한 서류 <b>'+SITES[S.site].docIds.length+'종</b> · 제출 기한 <b>'+fmtLong(isoOf(due))+'</b> (착공 3일 전, D-'+dd+')<br>'+
    (big ? '공사금액이 2천만원 이상으로 <b>산재·근재보험 이력과 작업계획</b>을 함께 확인합니다.'
         : '공사금액이 2천만원 미만이라 기본 서류만 받습니다.');
  return {big:big, dd:dd};
}
['aAmt','aStart'].forEach(function(id){ $(id).addEventListener('input',judge); $(id).addEventListener('change',judge); });
$('addOpen').addEventListener('click',function(){
  $('aName').value=''; $('aBiz').value=''; $('aTel').value=''; $('aMail').value='';
  $('aAmt').value=1500; $('aStart').value=isoOf(addDays(12));
  judge(); go('add');
});
$('aTel').addEventListener('input',function(){ this.value=hyphenTel(this.value); });
$('addSave').addEventListener('click',function(){
  var nm=$('aName').value.trim();
  $('addError').textContent='';
  if(!nm){ $('addError').textContent='업체명을 입력해 주세요.'; $('aName').focus(); return; }
  if(vlist().some(function(v){ return v.nm === nm; })) { $('addError').textContent='이미 등록된 업체명입니다. 현황에서 기존 업체를 선택해 주세요.'; return; }
  if(!$('aStart').value || !Number.isFinite(Number($('aAmt').value)) || Number($('aAmt').value)<0) { $('addError').textContent='착공일과 0 이상의 공사금액을 입력해 주세요.'; return; }
  var j=judge(), ids=SITES[S.site].docIds, st={};
  ids.forEach(function(id){ st[id]=0; });
  var v={nm:nm, biz:$('aBiz').value.trim()||'미지정', tel:$('aTel').value.trim()||'미등록',
    mail:$('aMail').value.trim()||'미등록', last:isoOf(TODAY), dd:j.dd, need:true,
    why:j.big?'2천만원 이상 공사':'신규 등록', cause:j.big?'공사금액 '+(+$('aAmt').value).toLocaleString('ko-KR')+'만원 등록':'신규 업체 최초 등록',
    scope:'all', r:j.big?'r2':'r1', st:st, logs:[]};
  v.id = 'vendor-' + crypto.randomUUID();
  vlist().unshift(v);
  S.sel={}; renderList(); openReq(0);
});

/* ===== 양식 받기 ===== */

function markGot(n,msg){
  var s=$('fs'+n); if(s) s.innerHTML='<span class="badge">'+(msg||'받으셨습니다')+'</span>';
  if(!msg){ var b=document.querySelector('.p_dact [data-form="'+n+'"]'); if(b){ b.textContent='양식 받음'; b.disabled=true; } }
}
function getForm(n){
  var d=MASTER[n];
  var rows=[['항목','내용']].concat(d.how.map(function(s,i){return [(i+1)+'단계',s];}));
  var csv='﻿'+rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\r\n')+'\r\n';
  var name=d.form+'.csv';
  try{
    var a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); }, 60000); markGot(n);
  }catch(e){ markGot(n,'이 화면에서는 받을 수 없습니다'); }
}

/* ===== 업체 제출 화면 ===== */
var filled={}, picked={};
function draftKey(){ return S.site + ':' + (submissionVendor || 'preview'); }
function filesFor(v,id){
  var files = v.files && v.files[id];
  return (Array.isArray(files) ? files : files ? [files] : []).map(function(file){
    return file.bytes ? new File([file.bytes],file.name,{type:file.type,lastModified:file.lastModified}) : file;
  });
}
function saveDraft(){
  drafts[draftKey()] = {site:S.site, filled:filled, picked:picked, nm:$('vName').value, tel:$('vTel').value};
  persistDocuments();
}
function loadDraft(){ return drafts[draftKey()] || null; }
function clearDraft(){ delete drafts[draftKey()]; persistDocuments(); }
var ACCEPT={
  '사진':'image/*',
  '발급':'.pdf,.png,.jpg,.jpeg,image/*',
  '작성':'.pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,image/*',
  '선택':''
};
function fmtSize(b){
  if(b<1024) return b+'B';
  if(b<1024*1024) return Math.round(b/1024)+'KB';
  return (b/1048576).toFixed(1)+'MB';
}
function openPicker(id){
  var d=MASTER[id], inp=$('filePick');
  inp.accept=ACCEPT[d.kind]||'';
  inp.multiple = (d.kind==='사진'||d.kind==='선택');
  inp.dataset.target=id;
  inp.value='';
  inp.click();
}
$('filePick').addEventListener('change',async function(){
  var id=+this.dataset.target, fs=this.files;
  this.dataset.target='';
  if(!id || !fs || !fs.length) return;
  var total=0, names=[];
  for(var i=0;i<fs.length;i++){ total+=fs[i].size; names.push(fs[i].name); }
  var count=fs.length, targetSite=S.site, targetVendor=submissionVendor;
  $('vSaved').textContent='파일을 준비하는 중입니다.';
  $('vSubmit').disabled=true;
  try {
    // Store bytes rather than File-backed blobs: this also restores reliably in WebKit.
    var records=await Promise.all(Array.from(fs).map(async function(file){
      return {name:file.name,type:file.type,lastModified:file.lastModified,size:file.size,bytes:await file.arrayBuffer()};
    }));
    if(targetSite!==S.site || targetVendor!==submissionVendor) return;
    picked[id]=records; upload(id,{n:names[0], c:count, s:total});
    $('vSaved').textContent=database?'파일을 이 브라우저에 임시 저장했습니다.':'이 창에서 파일을 준비했습니다. 브라우저 임시 저장은 사용할 수 없습니다.';
  } catch(error) { $('vSaved').textContent='파일을 읽지 못했습니다. 다시 선택해 주세요.'; tally(); }
  this.value='';
});
function kindChip(k){
  if(k==='발급') return '<span class="p_dsrc p_out">밖에서 받아 오셔야 합니다</span>';
  if(k==='사진') return '<span class="p_dsrc">사진만 찍으시면 됩니다</span>';
  if(k==='선택') return '<span class="p_dsrc p_opt">선택 항목입니다</span>';
  return '';
}
function buildDocs(){
  $('vDue').textContent=(addDays(7).getMonth()+1)+'월 '+addDays(7).getDate()+'일';
  $('vDocs').innerHTML=docsOf().map(function(d){
    return '<li id="doc'+d.id+'"><div class="p_drow">'+
      '<span class="p_dnum">'+d.id+'</span>'+
      '<div class="p_dmain"><p class="p_dname">'+esc(d.name)+'</p><p class="p_dmeta">'+esc(d.hint)+'</p>'+kindChip(d.kind)+'</div>'+
      '<div class="p_dact">'+
        '<button class="btn m_primary" data-up="'+d.id+'">'+(d.kind==='사진'?'사진 올리기':'파일 올리기')+'</button>'+
        (d.form?'<button class="btn m_ghost" data-form="'+d.id+'">양식 받기</button>':'')+
        '<button class="btn m_ghost" data-how="'+d.id+'" aria-expanded="false">하는 방법</button>'+
      '</div></div>'+
      '<div class="p_how" id="how'+d.id+'" hidden><h4>'+d.id+'번 서류 준비하는 방법</h4>'+
        '<ol>'+d.how.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ol>'+
        (d.tip?'<p class="p_tip">'+d.tip+'</p>':'')+
        (d.form?'<p class="p_formrow"><button class="btn m_ghost m_small" data-form="'+d.id+'">'+d.form+'.csv 받기</button><span id="fs'+d.id+'"></span>'+
          '<span class="p_small">엑셀에서 열립니다</span></p>':'')+
      '</div></li>';
  }).join('');
  [].slice.call(document.querySelectorAll('[data-how]')).forEach(function(b){
    b.addEventListener('click',function(){
      var el=$('how'+b.dataset.how), open=!el.hidden;
      el.hidden=open; b.setAttribute('aria-expanded',String(!open));
      b.textContent=open?'하는 방법':'닫기';
    });
  });
  [].slice.call(document.querySelectorAll('[data-form]')).forEach(function(b){
    b.addEventListener('click',function(){ getForm(+b.dataset.form); }); });
  restore();
}
function paintDoc(id){
  var li=$('doc'+id); if(!li) return;
  var d=MASTER[id], on=!!filled[id];
  li.dataset.state = on ? 'complete' : 'empty';
  li.querySelector('.p_dnum').textContent = on?'✓':id;
  var meta=li.querySelector('.p_dmeta');
  if(on){
    var f=filled[id], nm, sz;
    if(f && typeof f==='object'){
      nm = f.c>1 ? (f.n+' 외 '+(f.c-1)+'개') : f.n;
      sz = f.s ? ' · '+fmtSize(f.s) : '';
    }else{ nm=d.file; sz=''; }
    meta.className='p_dmeta';
    meta.textContent = id===8
      ? nm+sz+' · 보장금액은 담당자 검토 예정입니다'
      : nm+sz+' · 올리셨습니다';
  }else{
    meta.className='p_dmeta'; meta.textContent=d.hint;
  }
  var src=li.querySelector('.p_dsrc');
  if(on){ if(src) src.hidden=true; } else if(src){ src.hidden=false; }
  var del=li.querySelector('[data-del]');
  if(del) del.remove();
  if(on && d.kind==='선택'){
    var b=document.createElement('button');
    b.className='btn m_ghost'; b.dataset.del=id; b.textContent='지우기';
    b.onclick=function(){ delete filled[id]; delete picked[id]; paintDoc(id); tally(); saveDraft(); };
    li.querySelector('.p_dact').appendChild(b);
  }
  var up=li.querySelector('[data-up]');
  if(up){
    if(on){
      up.textContent='다시 올리기'; up.className='btn m_ghost';
      up.onclick=function(){ openPicker(id); };
    }else{
      up.textContent=(d.kind==='사진'?'사진 올리기':'파일 올리기'); up.className='btn m_primary';
      up.onclick=function(){ openPicker(id); };
    }
  }
}
function tally(){
  var ids=submissionIds(), req=reqIds();
  var c=ids.filter(function(id){return filled[id];}).length;
  var done=req.filter(function(id){return filled[id];}).length;
  $('vBar').max=ids.length; $('vBar').value=c;
  var opt=ids.filter(function(id){return MASTER[id].kind==='선택';}).length;
  $('vLb').innerHTML=c+'개 올림 · '+(req.length-done)+'개 남음'+
    (opt?' <span class="p_muted">(선택 항목 '+opt+'개 제외)</span>':'');
  var info=$('vName').value.trim() && /^0\d{9,10}$/.test($('vTel').value.replace(/\D/g,''));
  $('vSubmit').disabled=!(done>=req.length && info);
  $('vSubmit').textContent = (done>=req.length && !info) ? '업체 정보를 적어 주십시오'
    : (done>=req.length ? '제출하기 — 준비되었습니다' : '제출하기');
}
function upload(id,info){ filled[id]=info; paintDoc(id); tally(); saveDraft(); }
function restore(){
  var d=loadDraft();
  filled = d && d.filled ? {...d.filled} : {};
  picked = d && d.picked ? {...d.picked} : {};
  Object.keys(filled).forEach(function(id){ if(!picked[id]?.length) delete filled[id]; });
  if(d){ $('vName').value=d.nm||''; $('vTel').value=d.tel||''; }
  submissionIds().forEach(paintDoc);
  tally();
  $('vSaved').textContent = (d && Object.keys(filled).length)
    ? '이 브라우저에 임시 저장한 파일을 불러왔습니다. 이어서 준비하실 수 있습니다.'
    : '서류 준비 내용은 이 브라우저에 임시 저장됩니다. 실제 서버에는 전송되지 않습니다.';
}
$('vName').addEventListener('input',function(){ tally(); saveDraft(); });
$('vTel').addEventListener('input',function(){ this.value=hyphenTel(this.value); tally(); saveDraft(); });
$('vReset').addEventListener('click',function(){
  filled={}; picked={}; clearDraft(); $('vName').value=submissionVendor ? vlist().find(function(v){return v.id===submissionVendor;}).nm : ''; $('vTel').value='';
  submissionIds().forEach(paintDoc); tally();
  $('vSaved').textContent='처음부터 다시 하실 수 있습니다.';
});
$('vSubmit').addEventListener('click',function(){
  if($('vSubmit').disabled) return;
  var nm=$('vName').value.trim();
  var ids=submissionIds(), st={};
  ids.forEach(function(id){ st[id]=filled[id]?1:0; });
  var exist=vlist().find(function(v){ return submissionVendor ? v.id===submissionVendor : v.nm===nm; });
  if(exist){
    exist.st={...exist.st,...st}; exist.last=isoOf(TODAY); exist.tel=$('vTel').value.trim()||exist.tel;
    exist.logs.push({d:isoOf(TODAY),t:'업체가 서류를 제출함'});
    exist.r=null; exist.over=false; exist.review='pending'; exist.submittedAt=isoOf(TODAY); exist.files={...exist.files,...picked};
    recalc(exist);
  }else{
    vlist().unshift({id:'vendor-'+crypto.randomUUID(), nm:nm, biz:'신규 등록', tel:$('vTel').value.trim()||'미등록', mail:'미등록',
      last:isoOf(TODAY), submittedAt:isoOf(TODAY), dd:7, need:false, review:'pending', files:picked, st:st,
      logs:[{d:isoOf(TODAY),t:'업체가 서류를 제출함'}]});
  }
  renderList();
  $('doneWho').textContent=nm+' · '+fmtLong(isoOf(TODAY))+' 제출';
  $('subForm').hidden=true; $('subDone').hidden=false;
  clearDraft();
});
$('doneBack').addEventListener('click',function(){ $('subDone').hidden=true; $('subForm').hidden=false; });


function downloadFile(file) {
  var a=document.createElement('a'); a.href=URL.createObjectURL(file); a.download=file.name;
  a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); },60000);
}
function storageMessage(text) { $('storageStatus').textContent=text; }
function persistDocuments() {
  if(!database || !storageReady) return;
  try {
    var transaction=database.transaction('state','readwrite');
    transaction.objectStore('state').put({sites:SITES,drafts:drafts},'snapshot');
    transaction.onerror=function(){ storageMessage('임시 저장에 실패했습니다. 현재 화면에서는 계속 작업할 수 있지만 창을 닫으면 변경 내용이 사라질 수 있습니다.'); };
  } catch(error) { storageMessage('임시 저장을 사용할 수 없습니다. 이 창에서만 시연 내용이 유지됩니다.'); }
}
async function openStorage() {
  try {
    database=await new Promise(function(resolve,reject){
      var request=indexedDB.open('hansol-vendor-documents-v1',1);
      request.onupgradeneeded=function(){ request.result.createObjectStore('state'); };
      request.onsuccess=function(){ resolve(request.result); }; request.onerror=function(){ reject(request.error); };
      request.onblocked=function(){ reject(new Error('storage blocked')); };
    });
    var snapshot=await new Promise(function(resolve,reject){
      var request=database.transaction('state','readonly').objectStore('state').get('snapshot');
      request.onsuccess=function(){ resolve(request.result); }; request.onerror=function(){ reject(request.error); };
    });
    if(snapshot?.sites) { SITES=snapshot.sites; drafts=snapshot.drafts || {}; }
    storageMessage('');
  } catch(error) { database=null; storageMessage('이 브라우저에서는 임시 저장을 사용할 수 없습니다. 창을 닫으면 시연 내용이 사라집니다.'); }
  storageReady=true;
}
function prepareSubmission(vendor) {
  submissionVendor=vendor.id; submissionScope=Array.isArray(vendor.scope) ? [...vendor.scope] : [...SITES[S.site].docIds]; picked={}; filled={};
  $('subForm').hidden=false; $('subDone').hidden=true;
  $('vName').value=vendor.nm; $('vTel').value=vendor.tel==='미등록'?'':vendor.tel;
  $('vName').readOnly=true;
  buildDocs();
  $('vName').value=vendor.nm; $('vSite').textContent=S.site; tally();
  if(vendor.submittedAt && !vendor.need) {
    submissionIds().forEach(function(id){ var files=filesFor(vendor,id); if(files.length) { picked[id]=vendor.files[id]; filled[id]={n:files[0].name,c:files.length,s:files.reduce(function(n,f){return n+f.size;},0)}; paintDoc(id); } });
    tally(); $('doneWho').textContent=vendor.nm+' · '+fmtLong(vendor.submittedAt)+' 제출';
    $('subForm').hidden=true; $('subDone').hidden=false;
  }
}
async function startDocuments() {
  await openStorage();
  var params=new URLSearchParams(location.search), requested=params.get('submit');
  if(SITES[params.get('site')]) S.site=params.get('site');
  if(requested) {
    var vendor=vlist().find(function(v){ return v.id===requested; });
    if(vendor) { prepareSubmission(vendor); go('submit'); }
    else {
      buildDocs(); go('submit'); $('subForm').hidden=true; $('pvHead').hidden=false;
      $('pvHead').querySelector('.p_psub').textContent='제출 링크를 확인할 수 없습니다. 링크를 만든 브라우저에서 열거나 담당자에게 다시 요청해 주세요.';
    }
  } else { S.auth=true; buildDocs(); renderList(); go('list'); }
  // Persist after a synchronous UI handler has applied its changes. Credentials are never stored.
  document.querySelector('.page_documents').addEventListener('click',function(event){
    if(event.target.closest('#doApprove, [data-okbad], [data-unmark], #bulkSend, #markSent, #addSave, #vSubmit')) queueMicrotask(persistDocuments);
  });
}
$('resetSearch').addEventListener('click',function(){
  $('q').value=''; S.filter='all';
  document.querySelectorAll('#filters button').forEach(function(b){ b.setAttribute('aria-pressed',String(b.dataset.f==='all')); });
  renderList(); go('list'); $('q').focus();
});

/* ===== 시작 ===== */
await startDocuments();
})();
