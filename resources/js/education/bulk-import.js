(() => {
  "use strict";

  if (document.body.dataset.educationRole !== "admin") return;

  const storageKey = "hansol-training-v2";
  const headerAliases = {
    name: ["이름", "성명"],
    company: ["업체명", "업체", "소속"],
    course: ["교육과정선택", "교육과정", "교육", "과정"]
  };
  let pending = null;
  let selectedFile = null;
  let loadRevision = 0;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
  const normalize = (value) => String(value ?? "").replace(/[\s()*]/g, "").toLocaleLowerCase("ko-KR");

  function readState() {
    const state = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (!state || !Array.isArray(state.templates) || !Array.isArray(state.people)) {
      throw new Error("교육 데이터를 불러오지 못했습니다. 페이지를 새로고침해주세요.");
    }
    return state;
  }

  function publishedCourses(state) {
    return state.templates.flatMap((template) =>
      (template.versions || []).map((version) => ({
        templateId: template.id,
        revision: version.revision,
        title: version.title
      }))
    );
  }

  function courseOptions(courses) {
    return courses.map((course) =>
      `<option value="${escapeHtml(`${course.templateId}:${course.revision}`)}">${escapeHtml(course.title)} · v${course.revision}</option>`
    ).join("");
  }

  function panelMarkup(courses) {
    return `<section class="card bulk-import-card" id="bulkImportCard">
      <details>
        <summary>명단 일괄 등록 · Excel</summary>
        <div class="bulk-import-body">
          <p class="muted">양식에 이름과 업체명을 작성한 뒤 파일을 올리거나, Excel의 셀을 복사해 아래 칸에 붙여넣으세요. 한 번에 최대 200명까지 등록할 수 있습니다.</p>
          <div class="bulk-top-actions">
            <a class="btn button" href="../resources/js/education/외부방문자_교육명단_업로드_양식.xlsx?v=20260917" download>엑셀 양식 다운로드</a>
            <button class="btn" type="button" id="chooseExcel">Excel 명단 업로드</button>
            <input class="sr-only" id="excelFile" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
          </div>
          <label class="field">교육과정이 비어 있을 때 배정할 기본 교육
            <select class="input_text" id="bulkDefaultCourse">${courseOptions(courses)}</select>
          </label>
          <div class="excel-dropzone" id="excelDropzone" tabindex="0" role="button" aria-label="Excel 파일을 끌어다 놓거나 눌러서 선택">
            <div><strong>Excel 파일을 여기에 끌어다 놓으세요</strong><span>또는 이 영역을 눌러 파일 선택 · .xlsx</span><span class="selected-file" id="selectedFile">선택된 파일 없음</span></div>
          </div>
          <label class="field">명단 입력 · Excel 셀 붙여넣기
            <textarea class="input_text m_textarea" id="bulkPaste" rows="7" placeholder="이름&#9;업체명&#9;교육과정(선택)&#10;김방문&#9;가상 A업체&#9;안전모·안전화 착용 교육"></textarea>
            <small>이 입력란에 .xlsx 파일을 끌어다 놓아도 됩니다. 열 순서는 이름, 업체명, 교육과정입니다.</small>
          </label>
          <div class="bulk-actions">
            <button class="btn" type="button" id="validateBulk">명단 확인</button>
            <button type="button" class="btn m_primary primary" id="importBulk" disabled>확인된 명단 등록</button>
          </div>
          <div id="bulkResult" role="status" aria-live="polite"></div>
        </div>
      </details>
    </section>`;
  }

  function headerMap(row) {
    const map = {};
    row.forEach((cell, index) => {
      const value = normalize(cell);
      for (const [field, aliases] of Object.entries(headerAliases)) {
        if (aliases.includes(value)) map[field] = index;
      }
    });
    return map;
  }

  function pastedRows(text) {
    return text.split(/\r?\n/).map((line) => line.split("\t").map((cell) => cell.trim()));
  }

  function resolveCourse(input, defaultValue, courses) {
    const query = String(input || "").trim();
    if (!query) return courses.find((course) => `${course.templateId}:${course.revision}` === defaultValue) || null;
    const explicit = query.match(/^(.*?)\s*[·]\s*v(\d+)$/i);
    if (explicit) {
      return courses.find((course) => course.title.trim() === explicit[1].trim() && course.revision === Number(explicit[2])) || null;
    }
    return courses
      .filter((course) => course.title.trim() === query)
      .sort((left, right) => right.revision - left.revision)[0] || null;
  }

  function validateRows(rawRows) {
    const state = readState();
    const courses = publishedCourses(state);
    if (!courses.length) throw new Error("먼저 교육 템플릿을 게시해주세요.");
    const indexedRows = rawRows.map((cells, index) => ({ cells, rowNumber: index + 1 }));
    const first = indexedRows.find(({ cells }) => cells.some((cell) => String(cell || "").trim()));
    if (!first) throw new Error("등록할 명단이 없습니다.");

    const possibleHeader = headerMap(first.cells);
    const hasHeader = Object.keys(possibleHeader).length > 0;
    if (hasHeader && (possibleHeader.name === undefined || possibleHeader.company === undefined)) {
      throw new Error("첫 줄 제목에는 ‘이름’과 ‘업체명’ 열이 모두 필요합니다.");
    }
    const columns = hasHeader ? possibleHeader : { name: 0, company: 1, course: 2 };
    const relevantColumns = [columns.name, columns.company, columns.course].filter((value) => value !== undefined);
    const dataRows = indexedRows
      .filter(({ rowNumber }) => !hasHeader || rowNumber > first.rowNumber)
      .filter(({ cells }) => relevantColumns.some((column) => String(cells[column] || "").trim()));
    if (!dataRows.length) throw new Error("제목 행 아래에 등록할 명단을 입력해주세요.");
    if (dataRows.length > 200) throw new Error("한 번에 최대 200명까지 등록할 수 있습니다.");

    const defaultValue = document.querySelector("#bulkDefaultCourse").value;
    const entries = dataRows.map(({ cells: row, rowNumber }) => {
      const name = String(row[columns.name] || "").trim();
      const company = String(row[columns.company] || "").trim();
      const courseText = columns.course === undefined ? "" : String(row[columns.course] || "").trim();
      const course = resolveCourse(courseText, defaultValue, courses);
      const errors = [];
      if (!name) errors.push("이름 누락");
      if (!company) errors.push("업체명 누락");
      if (!course) errors.push(courseText ? `게시된 교육 ‘${courseText}’ 없음` : "기본 교육을 찾을 수 없음");
      return { rowNumber, name, company, courseText, course, errors };
    });
    return entries;
  }

  function showResult(entries, topError = "") {
    const result = document.querySelector("#bulkResult");
    const importButton = document.querySelector("#importBulk");
    if (topError) {
      pending = null;
      importButton.disabled = true;
      result.innerHTML = `<p class="bulk-summary has-errors">${escapeHtml(topError)}</p>`;
      return;
    }
    const invalid = entries.filter((entry) => entry.errors.length);
    pending = invalid.length ? null : entries;
    importButton.disabled = Boolean(invalid.length);
    const preview = entries.slice(0, 10).map((entry) => `<tr class="${entry.errors.length ? "invalid" : ""}">
      <td>${entry.rowNumber}</td><td>${escapeHtml(entry.name || "—")}</td><td>${escapeHtml(entry.company || "—")}</td>
      <td>${escapeHtml(entry.course ? `${entry.course.title} · v${entry.course.revision}` : entry.courseText || "—")}</td>
      <td>${entry.errors.length ? escapeHtml(entry.errors.join(", ")) : "확인"}</td>
    </tr>`).join("");
    result.innerHTML = `<p class="bulk-summary ${invalid.length ? "has-errors" : "ready"}">${invalid.length ? `${entries.length}명 중 ${invalid.length}개 행을 수정해주세요.` : `${entries.length}명 등록 준비가 완료되었습니다.`}</p>
      ${invalid.length ? `<ul class="bulk-errors">${invalid.slice(0, 8).map((entry) => `<li>${entry.rowNumber}행: ${escapeHtml(entry.errors.join(", "))}</li>`).join("")}</ul>` : ""}
      <div class="bulk-preview-wrap"><table class="bulk-preview"><thead><tr><th>행</th><th>이름</th><th>업체명</th><th>배정 교육</th><th>검사</th></tr></thead><tbody>${preview}</tbody></table></div>
      ${entries.length > 10 ? `<p class="muted compact">처음 10명만 미리 표시합니다. 전체 ${entries.length}명</p>` : ""}`;
  }

  function validatePaste() {
    try {
      const text = document.querySelector("#bulkPaste").value.trim();
      if (!text) throw new Error("Excel에서 복사한 명단을 붙여넣거나 파일을 업로드해주세요.");
      showResult(validateRows(pastedRows(text)));
    } catch (error) {
      showResult([], error.message);
    }
  }

  async function loadFile(file) {
    const revision = ++loadRevision;
    pending = null;
    document.querySelector("#importBulk").disabled = true;
    document.querySelector("#bulkResult").textContent = "Excel 명단을 읽는 중입니다…";
    selectedFile = file;
    document.querySelector("#selectedFile").textContent = file?.name || "선택된 파일 없음";
    document.querySelector("#excelDropzone").classList.toggle("has-file", Boolean(file));
    try {
      const rows = await XlsxLite.read(file);
      if (revision !== loadRevision) return;
      const entries = validateRows(rows);
      document.querySelector("#bulkPaste").value = ["이름\t업체명\t교육과정(선택)", ...entries.map((entry) => [entry.name, entry.company, entry.courseText].join("\t"))].join("\n");
      showResult(entries);
    } catch (error) {
      if (revision !== loadRevision) return;
      showResult([], error.message);
    }
  }

  function importEntries() {
    if (!pending?.length) return;
    try {
      const state = readState();
      for (const entry of pending) {
        const template = state.templates.find((item) => item.id === entry.course.templateId);
        const person = { id: crypto.randomUUID(), name: entry.name, company: entry.company, history: [] };
        Training.assign(person, template, entry.course.revision);
        state.people.push(person);
      }
      localStorage.setItem(storageKey, JSON.stringify(state));
      sessionStorage.setItem("bulk-import-success", `${pending.length}명의 방문자를 등록하고 교육을 배정했습니다.`);
      location.reload();
    } catch (error) {
      showResult([], error.message);
    }
  }

  function attachEvents(panel) {
    const fileInput = panel.querySelector("#excelFile");
    const dropzone = panel.querySelector("#excelDropzone");
    const choose = () => fileInput.click();
    panel.querySelector("#chooseExcel").addEventListener("click", choose);
    dropzone.addEventListener("click", choose);
    dropzone.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose();
      }
    });
    fileInput.addEventListener("change", () => fileInput.files[0] && loadFile(fileInput.files[0]));
    const paste = panel.querySelector("#bulkPaste");
    for (const target of [dropzone, paste]) {
    ["dragenter", "dragover"].forEach((name) => target.addEventListener(name, (event) => {
      if (!Array.from(event.dataTransfer.types).includes("Files")) return;
      event.preventDefault();
      target.classList.add("dragging");
    }));
    ["dragleave", "drop"].forEach((name) => target.addEventListener(name, (event) => {
      if (Array.from(event.dataTransfer.types).includes("Files")) event.preventDefault();
      target.classList.remove("dragging");
    }));
    target.addEventListener("drop", (event) => event.dataTransfer.files[0] && loadFile(event.dataTransfer.files[0]));
    }
    panel.querySelector("#bulkPaste").addEventListener("input", () => {
      loadRevision++;
      selectedFile = null;
      pending = null;
      panel.querySelector("#importBulk").disabled = true;
      panel.querySelector("#bulkResult").innerHTML = "";
    });
    panel.querySelector("#bulkDefaultCourse").addEventListener("change", () => {
      pending = null;
      panel.querySelector("#importBulk").disabled = true;
      if (selectedFile) loadFile(selectedFile);
      else if (paste.value.trim()) validatePaste();
    });
    panel.querySelector("#validateBulk").addEventListener("click", validatePaste);
    panel.querySelector("#importBulk").addEventListener("click", importEntries);
  }

  function inject() {
    const form = document.querySelector("#add");
    if (!form || document.querySelector("#bulkImportCard")) return;
    const state = readState();
    const courses = publishedCourses(state);
    const holder = document.createElement("div");
    holder.innerHTML = panelMarkup(courses);
    const panel = holder.firstElementChild;
    form.closest("section").after(panel);
    attachEvents(panel);

    const success = sessionStorage.getItem("bulk-import-success");
    if (success) {
      sessionStorage.removeItem("bulk-import-success");
      const message = document.querySelector("#message");
      if (message) {
        message.textContent = success;
        message.className = "saved";
      }
    }
  }

  new MutationObserver(inject).observe(document.querySelector("#app"), { childList: true, subtree: true });
  inject();
})();
