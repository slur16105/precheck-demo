(() => {
  const brand = window.PreCheckBrand;
  const icon = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
  const chevron = (direction = 'down') => `<svg class="icon_chevron" data-direction="${direction}" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 4 4 4 4-4"/></svg>`;
  document.querySelectorAll('[data-appearance-controls]').forEach((root, index) => {
    const worker = root.dataset.appearanceControls === 'worker';
    const pickerId = `brand-picker-${index}`, settingsId = `appearance-settings-${index}`;
    root.innerHTML = `
      <div class="i_toolbar">
        ${worker ? '' : `<button class="i_trigger i_brand_trigger" type="button" popovertarget="${pickerId}" aria-expanded="false" aria-label="브랜드 선택"><img data-brand-asset="mark-sidebar" src="${brand.asset(brand.get(), 'mark-sidebar')}" alt="" width="28" height="28"><span data-brand-label></span>${chevron()}</button>`}
        <button class="i_trigger i_settings_trigger" type="button" popovertarget="${settingsId}" aria-expanded="false" aria-label="설정" title="설정">${icon('M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0')}${worker ? '<span>화면 설정</span>' : ''}</button>
      </div>
      ${worker ? '' : `<section class="i_popover" id="${pickerId}" popover="auto" role="dialog" aria-labelledby="${pickerId}-title">
        <div class="i_heading"><h2 id="${pickerId}-title">브랜드 선택</h2><button class="i_close" type="button" popovertarget="${pickerId}" popovertargetaction="hide" aria-label="브랜드 선택 닫기">${icon('M6 6l12 12M18 6 6 18')}</button></div>
        <p class="i_intro">같은 업무 경험에 계열사별 로고와 색상을 적용합니다.</p>
        <div class="i_brand_options">${brand.profiles.map(profile => `<button class="i_brand_option" type="button" data-set-brand="${profile.id}" aria-pressed="${profile.id === brand.get().id}"><img data-brand-profile="${profile.id}" data-brand-asset="logo-auto" src="${brand.asset(profile, 'logo-auto')}" alt="" width="529" height="112"><span>${profile.label}</span><span class="i_selected" aria-hidden="true">✓</span></button>`).join('')}</div>
      </section>`}
      <section class="i_popover" id="${settingsId}" popover="auto" role="dialog" aria-labelledby="${settingsId}-title">
        <div class="i_heading"><h2 id="${settingsId}-title">설정</h2><button class="i_close" type="button" popovertarget="${settingsId}" popovertargetaction="hide" aria-label="설정 닫기">${icon('M6 6l12 12M18 6 6 18')}</button></div>
        <p class="i_label">화면</p>
        <button class="i_setting" type="button" data-action="theme_toggle" aria-pressed="${document.documentElement.dataset.theme === 'dark'}"><span>다크 모드</span><span class="i_mode_value" data-mode-label></span></button>
        ${worker ? '' : `<nav class="i_links" aria-label="참고 화면"><a class="i_link" href="ui-guide.html" ${document.body.dataset.menu === 'ui-guide' ? 'aria-current="page"' : ''}><span>디자인 시스템</span>${chevron('right')}</a><a class="i_link" href="../index.html" target="_top"><span>화면별 예시</span>${chevron('right')}</a></nav>`}
        <details class="i_details"><summary><span>서비스 정보</span>${chevron()}</summary><div class="i_info"><strong>PreCheck · <span data-brand-label></span></strong><p>공통 UI와 업무 흐름을 기반으로 계열사별 브랜드를 적용합니다. 브랜드를 바꿔도 입력 내용과 업무 상태는 유지됩니다.</p><p>현재는 데모 환경입니다. 인물·업체·기록은 예시이며 변경 내용과 파일은 이 브라우저에 저장됩니다. 실제 발송·본인확인·기기 간 연동은 연결되지 않았고, 교육 결과와 서명은 법정 증빙이 아닙니다.</p></div></details>
      </section>`;
    brand.apply(root);
    function place(panel) {
      if (!panel.matches(':popover-open')) return;
      const trigger = root.querySelector(`[popovertarget="${panel.id}"]:not([popovertargetaction])`);
      const rect = trigger.getBoundingClientRect();
      const left = Math.max(12, Math.min(rect.left, innerWidth - panel.offsetWidth - 12));
      const top = Math.max(12, Math.min(rect.top - panel.offsetHeight - 10, innerHeight - panel.offsetHeight - 12));
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    }
    root.querySelectorAll('[popover]').forEach(panel => {
      const trigger = root.querySelector(`[popovertarget="${panel.id}"]:not([popovertargetaction])`);
      panel.addEventListener('toggle', event => {
        const open = event.newState === 'open';
        trigger.setAttribute('aria-expanded', String(open));
        if (open) { place(panel); (panel.querySelector('[aria-pressed="true"][data-set-brand]') || panel.querySelector('button')).focus(); }
      });
      panel.querySelectorAll('details').forEach(details => details.addEventListener('toggle', () => place(panel)));
      window.addEventListener('resize', () => place(panel));
      window.addEventListener('scroll', () => place(panel), { passive: true });
    });
    root.querySelectorAll('[data-set-brand]').forEach(button => button.addEventListener('click', () => {
      brand.set(button.dataset.setBrand);
      root.querySelector(`#${pickerId}`).hidePopover();
      root.querySelector('.i_brand_trigger').focus();
    }));
    const side = root.closest('.l_side');
    const closePanels = () => root.querySelectorAll(':popover-open').forEach(panel => panel.hidePopover());
    if (side) new MutationObserver(() => { if (side.dataset.state !== 'open' && innerWidth < 1024) closePanels(); }).observe(side, { attributes: true, attributeFilter: ['data-state'] });
    matchMedia('(min-width: 1024px)').addEventListener('change', closePanels);
  });
  function updateModes() {
    document.querySelectorAll('[data-mode-label]').forEach(el => { el.textContent = document.documentElement.dataset.theme === 'dark' ? '켜짐' : '꺼짐'; });
  }
  updateModes();
  new MutationObserver(updateModes).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
