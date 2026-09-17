(() => {
  const menus = [
    { id: "education", label: "사전 안전교육", href: "education.html" },
    { id: "history", label: "작업자 통합 이력", href: "history.html" },
    { id: "documents", label: "업체 서류관리", href: "documents.html" }
  ];
  const current = document.body.dataset.menu;
  const side = document.querySelector('[data-field="navigation"]');
  const icon = (path) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="${path}"/></svg>`;
  side.innerHTML = `
    <div class="l_panel">
      <button class="l_close" type="button" data-action="drawer_close" aria-label="업무 메뉴 닫기">${icon("M6 6l12 12M18 6 6 18")}</button>
      <a class="l_brand" href="history.html"><img class="l_brand_logo" data-brand-asset="logo-white" src="../resources/images/precheck-logo-white.svg?v=20260917" alt="PreCheck" width="529" height="112"><span class="l_brand_text">한솔홀딩스 · 안전관리</span></a>
      <p class="l_group">방문자 관리</p>
      <nav aria-label="주요 메뉴"><ul class="l_nav">${menus.map((menu) => `
        <li><a class="l_item" href="${menu.href}" ${menu.id === current ? 'aria-current="page"' : ""}>${menu.label}</a></li>
      `).join("")}</ul></nav>
      <div class="l_foot"><div class="brand_controls" data-appearance-controls></div></div>
    </div><div class="l_dim" data-action="drawer_close" aria-hidden="true"></div>`;
  window.PreCheckBrand.apply(side);
  // Keep keyboard focus inside the mobile drawer, including the external skip link.
  side.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || side.dataset.state !== "open") return;
    const controls = [...side.querySelectorAll('a[href], button:not([disabled])')].filter((el) => el.getClientRects().length);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  // Crossing to the desktop shell must release the drawer's inert background.
  matchMedia("(min-width: 1024px)").addEventListener("change", (event) => {
    if (event.matches && side.dataset.state === "open") {
      window.slur.drawer.close(side);
      side.querySelector('[aria-current="page"]')?.focus();
    }
  });
})();
