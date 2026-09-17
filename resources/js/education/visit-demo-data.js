(() => {
  'use strict';
  // Relative dates keep the demonstration useful whenever it is opened.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const iso = date => date.toISOString().slice(0, 10);
  const base = new Date(`${today}T12:00:00Z`);
  const companies = ['가상 A설비', '가상 그린정비', '가상 한빛전기', '가상 미래건설', '가상 대한물류', '가상 새롬환경', '가상 동진소방', '가상 우리통신'];
  const jobs = ['설비 정기점검', '배관 보수', '전기설비 점검', '시설 보수공사', '자재 반입', '환경설비 정비', '소방시설 점검', '통신 배선 작업'];
  const courses = ['설비·보수 작업 안전교육', '배관·화기 작업 안전교육', '전기 작업 안전교육', '시설·고소 작업 안전교육', '반입·하역 안전교육', '환경설비 작업 안전교육', '소방 점검 안전교육', '통신 작업 안전교육'];
  const surnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권'];
  const givenNames = ['민수', '영수', '성호', '정우', '현수', '수진', '지훈', '동현', '은정', '준호', '서연', '미정'];
  const workers = Array.from({ length: 180 }, (_, index) => ({
    id: `visit-demo-${String(index + 1).padStart(3, '0')}`,
    name: surnames[index % surnames.length] + givenNames[Math.floor(index / surnames.length)],
    company: companies[index % companies.length], companyIndex: index % companies.length
  }));
  const first = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - 1, 1, 12));
  const last = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 2, 0, 12));
  const nextWeekday = (offset) => {
    const date = new Date(base); date.setUTCDate(date.getUTCDate() + offset);
    while ([0, 6].includes(date.getUTCDay())) date.setUTCDate(date.getUTCDate() + 1);
    return iso(date);
  };
  const peaks = new Map([[nextWeekday(1), 128], [nextWeekday(6), 168], [nextWeekday(13), 112]]);
  const visits = [];
  for (const date = new Date(first); date <= last; date.setUTCDate(date.getUTCDate() + 1)) {
    const key = iso(date), offset = Math.round((date - base) / 86400000);
    const seed = Math.abs(Math.floor(date.getTime() / 86400000));
    const weekend = [0, 6].includes(date.getUTCDay());
    let count = weekend ? (seed % 3 === 0 ? 6 : 0) : 16 + (seed * 13 % 38);
    if (!weekend && date.getUTCDate() === 10) count = 104;
    if (key === today) count = 76;
    if (peaks.has(key)) count = peaks.get(key);
    for (let index = 0; index < count; index++) {
      const worker = workers[(seed * 7 + index * 17) % workers.length];
      const value = (seed * 31 + index * 19) % 100;
      const cancelled = !peaks.has(key) && index > 0 && index % 23 === 0;
      const completedThreshold = offset < 0 ? 94 : offset === 0 ? 73 : offset < 4 ? 68 : offset < 10 ? 48 : 25;
      const education = value < completedThreshold ? '교육 완료' : value < completedThreshold + 12 ? '교육 중' : value < completedThreshold + 22 ? '미시작' : value < 97 ? '미발송' : '재평가 필요';
      const visitStatus = cancelled ? '취소' : offset < 0 ? (education === '교육 완료' ? '방문 완료' : '미방문') : offset > 0 ? '방문 예정' : education !== '교육 완료' ? '방문 예정' : index % 3 === 0 ? '방문 완료' : index % 3 === 1 ? '현장 체류' : '방문 예정';
      const times = ['07:30', '08:00', '08:00', '08:30', '08:30', '09:00', '10:00', '13:00', '14:00'];
      visits.push({
        id: `${key}-${worker.id}`, date: key, workerId: worker.id, workerName: worker.name,
        company: worker.company, job: jobs[worker.companyIndex], course: courses[worker.companyIndex],
        time: times[index % times.length], area: ['생산동', '설비동', '물류동', '관리동'][worker.companyIndex % 4],
        education, visitStatus, progress: education === '교육 완료' || education === '재평가 필요' ? 100 : education === '교육 중' ? 30 + value % 56 : 0,
        score: education === '교육 완료' ? 8 + value % 3 : education === '재평가 필요' ? 6 : null,
        historyId: null, source: 'demo'
      });
    }
  }
  window.VisitDemo = { today, workers, visits, companies, range: [iso(first), iso(last)] };
})();
