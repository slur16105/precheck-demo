(function(root){
const clone=x=>JSON.parse(JSON.stringify(x));
function valid(c){
 if(!c.title.trim())throw Error('교육 제목을 입력해주세요.');
 if(c.video.kind==='url'){let u;try{u=new URL(c.video.url)}catch{throw Error('올바른 영상 주소를 입력해주세요.')}if(u.protocol!=='https:')throw Error('HTTPS 영상 파일 주소를 입력해주세요.');}
 if(c.video.kind==='file'&&!c.video.assetId)throw Error('영상 파일을 먼저 저장해주세요.');
 if(!['demo','url','file'].includes(c.video.kind))throw Error('영상 종류를 확인해주세요.');
 if(c.questions.length!==10)throw Error('문제는 정확히 10개여야 합니다.');
 c.questions.forEach((q,i)=>{if(!q[0].trim()||q[1].length!==3||q[1].some(s=>!s.trim())||!Number.isInteger(q[2])||q[2]<0||q[2]>2)throw Error(`${i+1}번 문제의 내용, 보기 3개와 정답을 모두 입력해주세요.`)});
 return true;
}
function publish(t,at){valid(t.draft);const v={...clone(t.draft),revision:t.versions.length+1,publishedAt:at};t.versions.push(v);return v;}
function assign(p,t,revision){const v=t.versions.find(x=>x.revision===revision);if(!v)throw Error('게시된 교육을 선택해주세요.');if(p.courseId===t.id&&p.revision===revision)return false;
 if(p.courseId){p.history=p.history||[];p.history.push({courseId:p.courseId,revision:p.revision,watched:p.watched,duration:p.duration,score:p.score,attempts:p.attempts,completedAt:p.completedAt})}
 Object.assign(p,{courseId:t.id,revision,watched:0,duration:v.video.kind==='demo'?30:null,score:null,attempts:0,completedAt:null,answers:null});return true;
}
function score(a,qs){if(!Array.isArray(a)||a.length!==10||a.some(x=>!Number.isInteger(x)||x<0||x>2))throw Error('10개 문항에 모두 답해주세요.');return qs.reduce((n,q,i)=>n+(q[2]===a[i]),0)}
function watched(p){return Number.isFinite(p.duration)&&p.duration>0&&p.watched>=p.duration}
function complete(p){return watched(p)&&Number.isInteger(p.score)&&p.score>=8&&p.score<=10}
function status(p){return complete(p)?'교육 완료':!watched(p)?'영상 시청 필요':p.score===null?'평가 대기':'재응시 필요'}
function seed(old){const general={id:'common',draft:{title:'방문 전 공통 안전교육',description:'현장 기본 수칙과 비상 대응을 확인합니다.',video:{kind:'demo'},questions:clone(root.Learning.questions)},versions:[]};publish(general,'시연 기본본');
 const ppe=[['안전모를 착용하는 주된 목적은?',['머리 충격 위험을 줄인다','소음을 없앤다','시야를 넓힌다'],0],['안전모 턱끈은 어떻게 하나요?',['풀어둔다','알맞게 조인다','제거한다'],1],['안전모가 손상되었다면?',['그대로 쓴다','스티커로 가린다','사용을 중지하고 교체를 요청한다'],2],['안전화는 어떻게 선택하나요?',['작업 위험에 맞는 안전화를 사용한다','운동화로 대신한다','크기만 확인한다'],0],['안전화 끈은 어떻게 하나요?',['풀어둔다','풀리지 않게 묶는다','밟고 다닌다'],1],['안전화 바닥에 이상이 있다면?',['계속 사용한다','동료 것과 몰래 바꾼다','점검하고 담당자에게 알린다'],2],['보호구는 언제 점검하나요?',['작업 전 상태를 확인한다','사고 후에만 확인한다','점검하지 않는다'],0],['보호구가 없을 때 올바른 행동은?',['그대로 들어간다','담당자에게 요청하고 준비 후 작업한다','다른 사람 뒤에 숨는다'],1],['보호구가 불편할 때는?',['작업 중 벗는다','임의로 부품을 제거한다','담당자와 적절한 크기·착용 방법을 확인한다'],2],['보호구 착용 구역에서는?',['지정 보호구를 계속 올바르게 착용한다','잠깐이면 벗어도 된다','사진 찍을 때만 쓴다'],0]];
 const equipment={id:'ppe',draft:{title:'안전모·안전화 착용 교육',description:'보호구 착용과 사용 전 점검 · 예시 문항, 게시 전 검토 필요',video:{kind:'demo'},questions:ppe},versions:[]};
 const people=old||[{id:'demo-01',name:'김안전',company:'가상 A설비',watched:0,score:null,attempts:0,completedAt:null},{id:'demo-02',name:'이현장',company:'가상 그린정비',watched:30,score:9,attempts:1,completedAt:'시연 예시'},{id:'demo-03',name:'박작업',company:'가상 A설비',watched:30,score:7,attempts:1,completedAt:null}];
 return {templates:[general,equipment],people:people.map(p=>({...p,company:p.company==='가상 한솔설비'?'가상 A설비':p.company,courseId:'common',revision:1,duration:30,history:[]}))};
}
const api={clone,valid,publish,assign,score,watched,complete,status,seed};root.Training=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
