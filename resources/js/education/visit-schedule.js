(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const demo = window.VisitDemo;
  const data = window.mockData;
  const today = demo?.today || new Date().toISOString().slice(0, 10);
  const companyNames = new Map((data?.companies || []).map(company => [company.id, company.name]));
  const legacy = (data?.workers || []).flatMap(worker => (worker.history || []).flatMap((record, index) => {
    if (!/^\d{4}\.\d{2}\.\d{2}$/.test(record.date)) return [];
    return [{ id: `history-${worker.id}-${index}`, date: record.date.replaceAll('.', '-'), workerId: `history-${worker.id}`, workerName: worker.name,
      company: companyNames.get(worker.companyId) || '소속 미상', job: record.job, education: record.education === '이수' ? '교육 완료' : '미이수',
      time: null, area: null, course: '당시 안전교육', progress: null, score: null,
      visitStatus: record.entryStatus === '입문' ? '방문 완료' : '방문 기록', historyId: worker.id, source: 'history' }];
  }));
  // 시연 데이터는 열 때마다 오늘 기준으로 다시 만들어진다. 그래서 원본은 그대로 두고
  // 담당자가 손댄 것(추가·수정·삭제)만 따로 저장해 두었다가 그릴 때 덮어씌운다.
  const STORE = 'precheck-visit-overrides-v1';
  const emptyOverrides = () => ({ added: [], edits: {}, removed: [] });
  let overrides = emptyOverrides();
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved && typeof saved === 'object') overrides = { ...emptyOverrides(), ...saved };
  } catch (_) { overrides = emptyOverrides(); }
  const persist = () => { try { localStorage.setItem(STORE, JSON.stringify(overrides)); } catch (_) {} };
  const changeCount = () => (overrides.added?.length || 0) + Object.keys(overrides.edits || {}).length + (overrides.removed?.length || 0);
  const base = [...legacy, ...(demo?.visits || [])];
  let records = [], companies = [];
  function rebuild() {
    const gone = new Set(overrides.removed || []);
    records = [...base, ...(overrides.added || [])]
      .filter(row => !gone.has(row.id))
      .map(row => (overrides.edits && overrides.edits[row.id]) ? { ...row, ...overrides.edits[row.id] } : row)
      .sort((a, b) => (a.time || '99').localeCompare(b.time || '99') || a.workerName.localeCompare(b.workerName, 'ko'));
    companies = [...new Set(records.map(record => record.company))].sort((a, b) => a.localeCompare(b, 'ko'));
  }
  rebuild();
  const active = rows => rows.filter(row => row.visitStatus !== '취소');
  const done = rows => active(rows).filter(row => row.education === '교육 완료');
  const dateLabel = value => value.replaceAll('-', '.');
  let month = today.slice(0, 7), selected = today, company = '', query = '', status = '', page = 1, expanded = null;
  const pageSize = 10;
  let stage;
  const companyRows = () => records.filter(row => !company || row.company === company);
  const dayRows = () => companyRows().filter(row => row.date === selected);
  const countPeople = rows => new Set(rows.map(row => row.workerId)).size;
  function selectDate(date) { selected = date; month = date.slice(0, 7); page = 1; query = ''; status = ''; expanded = null; render(stage); }
  function shiftMonth(delta) {
    const [year, number] = month.split('-').map(Number), next = new Date(year, number - 1 + delta, 1);
    month = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    selected = month === today.slice(0, 7) ? today : `${month}-01`;
    page = 1; query = ''; status = ''; expanded = null; render(stage);
    stage.querySelector(delta < 0 ? '#visitPrev' : '#visitNext').focus();
  }
  function calendar() {
    const [year, number] = month.split('-').map(Number);
    const offset = (new Date(year, number - 1, 1).getDay() + 6) % 7;
    const days = new Date(year, number, 0).getDate();
    const grouped = new Map();
    companyRows().filter(row => row.date.startsWith(month)).forEach(row => grouped.set(row.date, [...(grouped.get(row.date) || []), row]));
    const cells = Array.from({ length: offset }, () => '<span class="p_visit_blank" aria-hidden="true"></span>');
    for (let day = 1; day <= days; day++) {
      const date = `${month}-${String(day).padStart(2, '0')}`, rows = grouped.get(date) || [];
      const total = countPeople(active(rows)), pending = active(rows).filter(row => row.education !== '교육 완료').length;
      cells.push(`<button class="p_visit_day" type="button" data-visit-date="${date}" data-state="${total >= 100 ? 'busy' : ''}" aria-pressed="${selected === date}" ${date === today ? 'aria-current="date"' : ''} aria-label="${dateLabel(date)}, 방문 대상 ${total}명, 교육 미완료 ${pending}명${date === today ? ', 오늘' : ''}"><span>${day}${date === today ? '<i aria-hidden="true">오늘</i>' : ''}</span>${total ? `<strong>${total}명</strong><small>${pending ? `미완료 ${pending}` : '교육 완료'}</small>` : '<small>—</small>'}</button>`);
    }
    const monthly = [...grouped.values()].flat();
    return `<section class="card p_visit_calendar" aria-label="방문일 달력"><div class="p_visit_month"><h3 id="visitMonth">${year}년 ${number}월</h3><div><button class="btn" type="button" id="visitPrev" aria-label="이전 달">←</button><button class="btn" type="button" id="visitNext" aria-label="다음 달">→</button></div></div><div class="p_visit_weekdays" aria-hidden="true">${['월','화','수','목','금','토','일'].map(day => `<span>${day}</span>`).join('')}</div><div class="p_visit_days">${cells.join('')}</div><div class="p_visit_legend"><span>테두리 강조 · 100명 이상</span><span>방문 대상은 취소 제외</span></div><p class="p_visit_month_total">이달 일정 <strong>${active(monthly).length.toLocaleString()}건</strong> · 방문일 <strong>${[...grouped.values()].filter(rows => active(rows).length).length}일</strong></p></section>`;
  }
  function rowMarkup(row) {
    const complete = row.education === '교육 완료';
    return `<li data-visit-id="${esc(row.id)}"><div class="p_visit_person"><div class="p_visit_person_head"><strong>${esc(row.workerName)}</strong><span class="p_visit_time">${row.time || '시간 미기록'}</span><span class="badge">${esc(row.visitStatus)}</span></div><span>${esc(row.company)} · ${esc(row.job)}</span></div><div class="p_visit_result_end"><span class="badge ${complete ? 'm_success' : 'm_warning'}">${esc(row.education)}</span><button class="btn" type="button" data-visit-detail="${esc(row.id)}" aria-expanded="${expanded === row.id}">${expanded === row.id ? '접기' : '상세'}</button></div>${expanded === row.id ? `<div class="p_visit_record"><dl><div><dt>작업 구역</dt><dd>${esc(row.area || '기록 없음')}</dd></div><div><dt>교육 과정</dt><dd>${esc(row.course)}</dd></div><div><dt>영상 시청</dt><dd>${row.progress === null ? '상세 기록 없음' : `${row.progress}%`}</dd></div><div><dt>평가 결과</dt><dd>${row.score === null ? (row.source === 'history' ? '상세 기록 없음' : '미응시') : `${row.score} / 10`}</dd></div></dl>${row.historyId !== null ? `<a class="btn button" href="history.html?id=${encodeURIComponent(row.historyId)}">통합 이력 보기</a>` : `<p>${row.visitStatus === '취소' ? '취소된 방문일정입니다.' : row.education === '미발송' ? '교육 안내가 아직 발송되지 않은 대상입니다.' : complete ? '교육 완료 기록을 확인한 뒤 현장 절차를 진행하세요.' : '방문 전 교육 완료 여부를 확인해 주세요.'}</p>`}</div>` : ''}</li>`;
  }
  function renderList() {
    const q = query.trim().toLocaleLowerCase('ko');
    const matches = dayRows().filter(row => (!q || `${row.workerName} ${row.company} ${row.job}`.toLocaleLowerCase('ko').includes(q)) && (!status || (status === 'pending' ? row.education !== '교육 완료' && row.visitStatus !== '취소' : status === 'cancelled' ? row.visitStatus === '취소' : row.education === '교육 완료' && row.visitStatus !== '취소')));
    const pages = Math.max(1, Math.ceil(matches.length / pageSize)); page = Math.min(page, pages);
    const visible = matches.slice((page - 1) * pageSize, page * pageSize);
    stage.querySelector('#visitList').innerHTML = `<p class="p_visit_match_count" role="status">조회 결과 <strong>${matches.length}명</strong></p>${visible.length ? `<ul class="p_visit_results">${visible.map(rowMarkup).join('')}</ul>` : '<div class="p_visit_empty">조회 조건에 맞는 방문자가 없습니다.</div>'}<div class="pagination"><span>${matches.length ? (page - 1) * pageSize + 1 : 0}–${Math.min(page * pageSize, matches.length)} / ${matches.length}명</span><nav aria-label="방문자 목록 페이지"><button class="btn" id="visitPagePrev" ${page === 1 ? 'disabled' : ''}>이전</button><span>${page} / ${pages}</span><button class="btn" id="visitPageNext" ${page === pages ? 'disabled' : ''}>다음</button></nav></div>`;
    stage.querySelector('#visitPagePrev').onclick = () => { page--; expanded = null; renderList(); };
    stage.querySelector('#visitPageNext').onclick = () => { page++; expanded = null; renderList(); };
    stage.querySelectorAll('[data-visit-detail]').forEach(button => button.onclick = () => { const id = button.dataset.visitDetail; expanded = expanded === id ? null : id; renderList(); stage.querySelector(`[data-visit-detail="${id}"]`)?.focus(); });
  }
  const AREAS = ['생산동', '설비동', '물류동', '관리동'];
  const EDUCATIONS = ['교육 완료', '교육 중', '미시작', '미발송', '재평가 필요'];
  const STATUSES = ['방문 예정', '방문 완료', '현장 체류', '미방문', '취소'];
  const newId = () => 'custom-' + (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  function flash(text) { const box = stage?.querySelector('#visitFlash'); if (box) box.textContent = text; }
  function reload(date, message) {
    persist(); rebuild();
    if (date) { selected = date; month = date.slice(0, 7); }
    page = 1; expanded = null; render(stage);
    if (message) flash(message);
  }
  function dialog(title, body, actions) {
    stage.querySelector('#visitDialog')?.remove();
    const box = document.createElement('dialog');
    box.id = 'visitDialog'; box.className = 'p_preview_dialog p_visit_dialog';
    box.innerHTML = `<div class="row"><h2>${esc(title)}</h2><button class="btn" type="button" data-close aria-label="닫기">닫기</button></div>${body}<p class="p_visit_error" id="visitError" role="alert"></p><div class="p_visit_dialog_act">${actions}</div>`;
    stage.append(box);
    box.querySelectorAll('[data-close]').forEach(button => button.onclick = () => box.close());
    box.onclose = () => box.remove();
    box.showModal();
    return box;
  }
  const field = (label, control) => `<label class="p_visit_field"><span>${label}</span>${control}</label>`;
  const options = (list, chosen) => list.map(value => `<option ${value === chosen ? 'selected' : ''}>${esc(value)}</option>`).join('');
  function openForm(row) {
    const draft = row || { date: selected, time: '08:00', company: company || '', workerName: '', job: '', area: AREAS[0], education: '미발송', visitStatus: '방문 예정' };
    const box = dialog(row ? '일정 수정' : '일정 추가', `<div class="p_visit_form">
      ${field('방문일', `<input class="input_text" id="fDate" type="date" value="${esc(draft.date)}">`)}
      ${field('방문 시간', `<input class="input_text" id="fTime" type="time" value="${esc(draft.time || '')}">`)}
      ${field('업체명', `<input class="input_text" id="fCompany" type="text" list="visitCompanyList" value="${esc(draft.company)}" placeholder="예) 가상 A설비">`)}
      ${field('방문자 이름', `<input class="input_text" id="fName" type="text" value="${esc(draft.workerName)}" placeholder="예) 홍길동">`)}
      ${field('작업 내용', `<input class="input_text" id="fJob" type="text" value="${esc(draft.job)}" placeholder="예) 배관 보수">`)}
      ${field('작업 구역', `<select class="input_text" id="fArea">${options(AREAS, draft.area)}</select>`)}
      ${field('교육 상태', `<select class="input_text" id="fEdu">${options(EDUCATIONS, draft.education)}</select>`)}
      ${field('방문 상태', `<select class="input_text" id="fStatus">${options(STATUSES, draft.visitStatus)}</select>`)}
    </div><datalist id="visitCompanyList">${companies.map(name => `<option value="${esc(name)}"></option>`).join('')}</datalist>`,
      `<button class="btn m_primary" type="button" data-save>${row ? '수정 저장' : '일정 추가'}</button><button class="btn" type="button" data-close>취소</button>`);
    box.querySelector('[data-save]').onclick = () => {
      const value = id => box.querySelector(`#${id}`).value.trim();
      const problem = box.querySelector('#visitError');
      const date = value('fDate'), workerName = value('fName'), companyName = value('fCompany');
      if (!date) { problem.textContent = '방문일을 골라 주세요.'; box.querySelector('#fDate').focus(); return; }
      if (!companyName) { problem.textContent = '업체명을 적어 주세요.'; box.querySelector('#fCompany').focus(); return; }
      if (!workerName) { problem.textContent = '방문자 이름을 적어 주세요.'; box.querySelector('#fName').focus(); return; }
      const patch = { date, time: value('fTime') || null, company: companyName, workerName, job: value('fJob') || '작업 내용 미기재',
        area: value('fArea'), education: value('fEdu'), visitStatus: value('fStatus') };
      if (row) overrides.edits[row.id] = { ...(overrides.edits[row.id] || {}), ...patch };
      else {
        const id = newId();
        overrides.added.push({ id, workerId: id, course: '현장 등록 일정', progress: null, score: null, historyId: null, source: 'custom', ...patch });
      }
      box.close();
      reload(date, row ? '일정을 수정했습니다.' : '일정을 추가했습니다.');
      stage.querySelector(row ? '#visitEdit' : '#visitAdd')?.focus();
    };
    box.querySelector('#fDate').focus();
  }
  function removeRow(row) {
    if (!confirm(`${row.workerName} · ${row.company} · ${dateLabel(row.date)} 일정을 삭제하시겠습니까?`)) return;
    if (String(row.id).startsWith('custom-')) overrides.added = (overrides.added || []).filter(item => item.id !== row.id);
    else if (!(overrides.removed || []).includes(row.id)) overrides.removed.push(row.id);
    if (overrides.edits) delete overrides.edits[row.id];
    reload(null, '일정을 삭제했습니다.');
    stage.querySelector('#visitRemove')?.focus();
  }
  function openPicker(mode) {
    const rows = dayRows();
    if (!rows.length) { flash('선택하신 날짜에 일정이 없습니다. 달력에서 다른 날짜를 골라 주세요.'); return; }
    const box = dialog(mode === 'edit' ? '수정할 일정 고르기' : '삭제할 일정 고르기',
      `<p class="p_visit_pick_note">${dateLabel(selected)} 일정 ${rows.length}건 가운데 하나를 고르세요.</p>
       ${field('일정', `<select class="input_text" id="pickId">${rows.map(row => `<option value="${esc(row.id)}">${esc(row.workerName)} · ${esc(row.company)} · ${esc(row.time || '시간 미기록')} · ${esc(row.education)}</option>`).join('')}</select>`)}`,
      `<button class="btn ${mode === 'edit' ? 'm_primary' : 'm_danger'}" type="button" data-go>${mode === 'edit' ? '이 일정 수정' : '이 일정 삭제'}</button><button class="btn" type="button" data-close>취소</button>`);
    box.querySelector('[data-go]').onclick = () => {
      const row = records.find(item => item.id === box.querySelector('#pickId').value);
      box.close();
      if (!row) { flash('일정을 찾지 못했습니다. 화면을 새로고침해 주세요.'); return; }
      if (mode === 'edit') openForm(row); else removeRow(row);
    };
  }
  function restore() {
    if (!confirm('직접 추가·수정·삭제하신 내용을 모두 지우고 처음 시연 데이터로 되돌립니다. 계속하시겠습니까?')) return;
    overrides = emptyOverrides();
    reload(null, '시연 데이터로 되돌렸습니다.');
    stage.querySelector('#visitToday')?.focus();
  }
  function detail() {
    const rows = dayRows(), people = active(rows), completed = done(rows), cancelled = rows.filter(row => row.visitStatus === '취소');
    const label = selected < today ? '과거 방문' : selected === today ? '오늘 방문' : '방문 예정';
    return `<section class="card p_visit_detail" aria-label="선택한 날짜의 방문 일정"><div class="p_visit_detail_head"><div><h3>${dateLabel(selected)}</h3><p>${label} · ${new Set(people.map(row => row.company)).size}개 업체</p></div><span class="badge">${selected === today ? '오늘' : selected < today ? '이력' : '예정'}</span></div><dl class="p_visit_stats"><div><dt>방문 대상</dt><dd>${countPeople(people)}<small>명</small></dd></div><div><dt>교육 완료</dt><dd>${completed.length}<small>명</small></dd></div><div><dt>교육 미완료</dt><dd>${people.length - completed.length}<small>명</small></dd></div><div><dt>방문 취소</dt><dd>${cancelled.length}<small>명</small></dd></div></dl><p class="p_visit_context">${selected < today ? '교육 상태는 해당 방문일의 기록입니다.' : `교육 완료율 ${people.length ? Math.round(completed.length / people.length * 100) : 0}% · 방문 전 미완료 대상을 확인하세요.`}</p><div class="p_visit_filters"><label>이름·업체·작업 검색<input class="input_text" id="visitSearch" type="search" placeholder="이름 또는 업체 검색" value="${esc(query)}"></label><label>교육·방문 상태<select class="input_text" id="visitStatus"><option value="">전체</option><option value="pending" ${status === 'pending' ? 'selected' : ''}>교육 미완료</option><option value="done" ${status === 'done' ? 'selected' : ''}>교육 완료</option><option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>방문 취소</option></select></label></div><div id="visitList"></div></section>`;
  }
  function render(target) {
    stage = target;
    if (!data || !demo) { stage.innerHTML = '<div class="card p_visit_empty">방문일정 데이터를 불러오지 못했습니다. 새로고침해 주세요.</div>'; return; }
    stage.innerHTML = `<div class="p_visit_intro"><div><h2>방문일정</h2><p>날짜별 방문 규모와 교육 준비 현황을 확인하세요.</p></div><span class="badge">가상 데이터 · 운영 시연</span></div><div class="p_visit_toolbar"><label>업체<select class="input_text" id="visitCompany"><option value="">전체 업체</option>${companies.map(name => `<option ${company === name ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select></label><div><button class="btn" type="button" id="visitToday">오늘</button><button class="btn" type="button" id="visitBusiest">최다 방문일</button><button class="btn m_primary" type="button" id="visitAdd">일정 추가</button><button class="btn" type="button" id="visitEdit" ${dayRows().length ? '' : 'disabled'}>일정 수정</button><button class="btn" type="button" id="visitRemove" ${dayRows().length ? '' : 'disabled'}>일정 삭제</button></div><p>시연 기간 ${dateLabel(demo.range[0])} – ${dateLabel(demo.range[1])}</p></div><p class="p_visit_flash"><span id="visitFlash" role="status"></span>${changeCount() ? `<span class="p_visit_changed">직접 바꾸신 일정 ${changeCount()}건 <button class="btn m_ghost m_small" type="button" id="visitRestore">시연 데이터로 되돌리기</button></span>` : ''}</p><div class="p_visit_layout">${calendar()}${detail()}</div>`;
    renderList();
    stage.querySelector('#visitPrev').onclick = () => shiftMonth(-1);
    stage.querySelector('#visitNext').onclick = () => shiftMonth(1);
    stage.querySelector('#visitToday').onclick = () => { selectDate(today); stage.querySelector('#visitToday').focus(); };
    stage.querySelector('#visitBusiest').onclick = () => {
      const counts = new Map(); active(companyRows()).forEach(row => counts.set(row.date, (counts.get(row.date) || 0) + 1));
      const busiest = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
      if (busiest) { selectDate(busiest); stage.querySelector('#visitBusiest').focus(); }
    };
    stage.querySelector('#visitAdd').onclick = () => openForm(null);
    stage.querySelector('#visitEdit').onclick = () => openPicker('edit');
    stage.querySelector('#visitRemove').onclick = () => openPicker('remove');
    const restoreButton = stage.querySelector('#visitRestore');
    if (restoreButton) restoreButton.onclick = restore;
    stage.querySelector('#visitCompany').onchange = event => { company = event.target.value; page = 1; expanded = null; render(stage); stage.querySelector('#visitCompany').focus(); };
    stage.querySelector('#visitSearch').oninput = event => { query = event.target.value; page = 1; expanded = null; renderList(); };
    stage.querySelector('#visitStatus').onchange = event => { status = event.target.value; page = 1; expanded = null; renderList(); };
    stage.querySelectorAll('[data-visit-date]').forEach(button => button.onclick = () => { const date = button.dataset.visitDate; selectDate(date); stage.querySelector(`[data-visit-date="${date}"]`)?.focus(); });
  }
  window.VisitSchedule = { render };
})();
