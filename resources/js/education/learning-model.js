(function(root){
const questions=[
['작업장에 들어가기 전 먼저 해야 할 일은?',['안전교육과 출입 절차를 확인한다','바로 작업을 시작한다','동료의 출입증을 빌린다'],0],
['보호구는 어떻게 착용해야 할까요?',['불편하면 벗는다','작업에 맞게 올바르게 착용한다','사진 촬영 때만 착용한다'],1],
['지정되지 않은 구역에 들어가도 될까요?',['일이 급하면 가능하다','동료를 따라 들어간다','담당자 확인 없이 들어가지 않는다'],2],
['작업 중 위험을 발견했다면?',['작업을 멈추고 담당자에게 알린다','그대로 계속한다','다른 사람이 알릴 때까지 기다린다'],0],
['보행자는 어느 길로 이동해야 할까요?',['차량이 다니는 길','지정된 보행 통로','가장 짧은 길'],1],
['설비에 이상이 있을 때는?',['임의로 분해한다','손으로 회전체를 멈춘다','접근을 피하고 담당자에게 알린다'],2],
['작업 내용이나 장소가 바뀌면?',['기존 안내만 따른다','담당자에게 변경 사항을 확인한다','별도 확인 없이 진행한다'],1],
['비상 상황이 발생하면?',['안내에 따라 안전한 경로로 대피한다','물건부터 챙긴다','현장을 구경한다'],0],
['몸 상태가 좋지 않을 때는?',['숨기고 작업한다','동료에게 대신 출입을 부탁한다','작업 전 담당자에게 알린다'],2],
['당일 현장 특이사항 안내는?',['사전교육을 받았으면 무시한다','확인하고 작업 시 준수한다','작업 후 확인한다'],1]];
function score(a){if(!Array.isArray(a)||a.length!==10||a.some(x=>!Number.isInteger(x)||x<0||x>2))throw Error('10개 문항에 모두 답해주세요.');return questions.reduce((n,q,i)=>n+(q[2]===a[i]),0)}
function complete(p){return p.watched>=30&&Number.isInteger(p.score)&&p.score>=8&&p.score<=10}
function status(p){return complete(p)?'교육 완료':p.watched<30?'영상 시청 필요':p.score===null?'평가 대기':'재응시 필요'}
const api={questions,score,complete,status};root.Learning=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
