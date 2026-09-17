(() => {
  const root = document.querySelector(".page_history");
  const field = (name) => root.querySelector(`[data-field="${name}"]`) || document.querySelector(`.print_record[data-field="${name}"]`);
  const dataState = field("data_state");
  root.querySelector('[data-action="retry"]').addEventListener("click", () => window.location.reload());
  const data = window.mockData;
  if (!data || !Array.isArray(data.companies) || !Array.isArray(data.workers)
      || data.workers.some((worker) => !data.companies.some((company) => company.id === worker.companyId) || !Array.isArray(worker.history))) {
    dataState.dataset.state = "error";
    return;
  }
  const { companies, workers } = data;
  const searchInput = field("search_input");
  const companyFilter = field("company_filter");
  const results = field("worker_results");
  const companyOf = (worker) => companies.find((company) => company.id === worker.companyId);
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  let selectedId = null;
  let matches = [];

  companies.forEach((company) => companyFilter.add(new Option(company.name, company.id)));

  function statusOf(worker) {
    if (worker.education !== "이수") return { label: "교육 미이수", className: "m_danger" };
    if (worker.anomaly !== "이상 이력 없음") return { label: "과거 이상 이력", className: "m_warning" };
    return { label: "이상 이력 없음", className: "" };
  }

  function syncUrl(method = "replaceState") {
    const url = new URL(window.location.href);
    url.search = "";
    if (searchInput.value.trim()) url.searchParams.set("q", searchInput.value.trim());
    if (companyFilter.value) url.searchParams.set("company", companyFilter.value);
    if (selectedId !== null) url.searchParams.set("id", selectedId);
    // file:// previews can disallow History API updates; the screen still works.
    try { window.history[method](null, "", url); } catch (error) {
      if (error.name !== "SecurityError") throw error;
    }
  }

  function renderDetail() {
    const worker = matches.find((item) => item.id === selectedId);
    field("worker_detail").hidden = !worker;
    field("detail_empty").hidden = Boolean(worker);
    if (!worker) {
      document.title = "검색 결과 없음 | 작업자 통합 이력 · PreCheck";
      field("selection_status").textContent = "선택한 작업자가 없습니다.";
      return;
    }
    const company = companyOf(worker);
    const status = statusOf(worker);
    document.title = `${worker.name} | 작업자 통합 이력 · PreCheck`;
    field("worker_avatar").textContent = worker.name.slice(0, 1);
    field("worker_name").textContent = worker.name;
    field("worker_company").textContent = `${company.name} · 소속 작업자 보기`;
    field("worker_badge").textContent = status.label;
    field("worker_badge").className = `badge ${status.className}`;
    field("education_status").textContent = worker.education;
    field("questionnaire_status").textContent = worker.questionnaire;
    field("last_visit").textContent = worker.lastVisit;
    field("anomaly_status").textContent = worker.anomaly;
    field("signature_meta").textContent = worker.signedAt
      ? `${worker.signatureType} · ${worker.signedAt} 확인 예시`
      : "현재 교육 미이수 · 확인할 서명이 없습니다.";
    field("signature_name").textContent = worker.signedAt ? worker.name : "서명 없음";
    field("signature_sample").dataset.state = worker.signedAt ? "signed" : "empty";
    field("print_education").disabled = !worker.signedAt;
    field("history_body").innerHTML = worker.history.map((record) => `
      <tr><td>${escapeHtml(record.date)}</td><td>${escapeHtml(record.job)}</td><td>${escapeHtml(record.education)}</td><td>${escapeHtml(record.questionnaire)}</td>
      <td class="${record.bloodPressureNeedsReview ? "p_attention" : ""}">${escapeHtml(record.bloodPressure)}</td>
      <td class="${record.alcohol === "검출" ? "p_attention" : ""}">${escapeHtml(record.alcohol || "미측정")}</td>
      <td>${escapeHtml(record.action || "확인 필요")}</td>
      <td class="${record.entryStatus === "출입 보류" ? "p_attention" : ""}">${escapeHtml(record.entryStatus || "확인 필요")}</td></tr>
    `).join("");
    field("selection_status").textContent = `${worker.name} 작업자의 상세 이력을 표시합니다.`;
  }

  function render() {
    const query = searchInput.value.trim().toLocaleLowerCase("ko-KR");
    matches = workers.filter((worker) => {
      const company = companyOf(worker);
      return (!companyFilter.value || worker.companyId === companyFilter.value)
        && (worker.name.toLocaleLowerCase("ko-KR").includes(query) || company.name.toLocaleLowerCase("ko-KR").includes(query));
    });
    if (!matches.some((worker) => worker.id === selectedId)) selectedId = matches[0]?.id ?? null;
    const selectedCompany = companies.find((company) => company.id === companyFilter.value);
    const queriedCompany = companies.find((company) => company.name.toLocaleLowerCase("ko-KR") === query);
    field("company_title").textContent = selectedCompany || queriedCompany
      ? `${(selectedCompany || queriedCompany).name} 현황` : query ? "검색 결과 현황" : "전체 업체 현황";
    field("worker_total").textContent = `${matches.length}명`;
    field("education_total").textContent = `${matches.filter((worker) => worker.education === "이수").length}명`;
    field("anomaly_total").textContent = `${matches.filter((worker) => worker.anomaly !== "이상 이력 없음").length}명`;
    field("result_count").textContent = `검색 결과 ${matches.length}명`;
    field("print_company").disabled = matches.length === 0;
    results.innerHTML = matches.length ? matches.map((worker) => {
      const status = statusOf(worker);
      return `<li><button class="result_card" type="button" data-worker-id="${worker.id}" aria-pressed="${worker.id === selectedId}" aria-controls="worker_detail">
        <span class="i_top"><span class="i_name">${escapeHtml(worker.name)}</span><span class="badge ${status.className}">${status.label}</span></span>
        <span class="i_meta">${escapeHtml(companyOf(worker).name)} · 최근 방문 ${escapeHtml(worker.lastVisit)}</span>
      </button></li>`;
    }).join("") : '<li class="empty_state">일치하는 작업자가 없습니다.</li>';
    renderDetail();
  }

  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    searchInput.value = params.get("q") || "";
    companyFilter.value = companies.some((company) => company.id === params.get("company")) ? params.get("company") : "";
    selectedId = Number(params.get("id")) || null;
    render();
  }

  function reset() {
    searchInput.value = "";
    companyFilter.value = "";
    render();
    syncUrl("pushState");
    searchInput.focus();
  }

  searchInput.addEventListener("input", () => { render(); syncUrl(); });
  companyFilter.addEventListener("change", () => { render(); syncUrl("pushState"); });
  field("search_clear").addEventListener("click", reset);
  field("empty_reset").addEventListener("click", reset);
  results.addEventListener("click", (event) => {
    const button = event.target.closest("[data-worker-id]");
    if (!button) return;
    selectedId = Number(button.dataset.workerId);
    results.querySelectorAll("[data-worker-id]").forEach((item) => item.setAttribute("aria-pressed", String(Number(item.dataset.workerId) === selectedId)));
    renderDetail();
    syncUrl("pushState");
  });
  field("worker_company").addEventListener("click", () => {
    const worker = matches.find((item) => item.id === selectedId);
    if (!worker) return;
    companyFilter.value = worker.companyId;
    searchInput.value = "";
    render();
    syncUrl("pushState");
  });
  field("print_company").addEventListener("click", () => {
    if (!matches.length) return;
    field("print_area").innerHTML = `
      <h1>${escapeHtml(field("company_title").textContent)}</h1>
      <p>작업자 ${matches.length}명 · 교육 이수 ${escapeHtml(field("education_total").textContent)} · 이상 이력 ${escapeHtml(field("anomaly_total").textContent)}</p>
      ${searchInput.value.trim() ? `<p>검색어: ${escapeHtml(searchInput.value.trim())}</p>` : ""}
      <table><thead><tr><th>작업자</th><th>업체</th><th>교육</th><th>최근 방문</th><th>이상 이력</th></tr></thead><tbody>
      ${matches.map((worker) => `<tr><td>${escapeHtml(worker.name)}</td><td>${escapeHtml(companyOf(worker).name)}</td><td>${escapeHtml(worker.education)}</td><td>${escapeHtml(worker.lastVisit)}</td><td>${escapeHtml(worker.anomaly)}</td></tr>`).join("")}
      </tbody></table><p class="i_disclaimer">인터뷰용 출력 예시 · 모든 정보는 가상 데이터이며 실제 증빙으로 사용할 수 없습니다.</p>`;
    window.print();
  });
  field("print_education").addEventListener("click", () => {
    const worker = matches.find((item) => item.id === selectedId);
    if (!worker?.signedAt) return;
    field("print_area").innerHTML = `
      <h1>안전교육 이수·서명 기록</h1><p>작업자: ${escapeHtml(worker.name)} / 업체: ${escapeHtml(companyOf(worker).name)}</p>
      <p>안전교육: ${escapeHtml(worker.education)} / 서명 방식: ${escapeHtml(worker.signatureType)} / 확인 일시: ${escapeHtml(worker.signedAt)}</p>
      <div class="signature_sample"><span class="i_name">${escapeHtml(worker.name)}</span><small class="i_note">가상 서명 · 실제 증빙 아님</small></div>
      <p class="i_disclaimer">인터뷰용 출력 예시 · 실제 교육 이수 증빙이나 서명이 아닙니다.</p>`;
    window.print();
  });
  window.addEventListener("popstate", readUrl);
  readUrl();
  dataState.dataset.state = workers.length ? "success" : "empty";
})();
