(function(root){
let db;
function open(){return db||(db=new Promise((resolve,reject)=>{const r=indexedDB.open('hansol-training-videos',1);r.onupgradeneeded=()=>r.result.createObjectStore('videos');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('영상 저장소를 열 수 없습니다.'))}))}
async function put(file){if(file.size>150*1024*1024)throw Error('시연 영상은 150MB 이하로 선택해주세요.');if(!/^video\//.test(file.type))throw Error('브라우저에서 재생 가능한 영상 파일을 선택해주세요.');const id=crypto.randomUUID(),d=await open();await new Promise((resolve,reject)=>{const t=d.transaction('videos','readwrite');t.objectStore('videos').put(file,id);t.oncomplete=resolve;t.onerror=()=>reject(Error('영상 저장 공간이 부족하거나 저장할 수 없습니다.'))});return id;}
async function get(id){const d=await open();return new Promise((resolve,reject)=>{const r=d.transaction('videos').objectStore('videos').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('저장한 영상을 불러올 수 없습니다.'))})}
root.VideoStore={put,get};
})(window);
