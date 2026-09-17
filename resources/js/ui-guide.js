(() => {
  const root = document.querySelector('.page_ui_guide');
  const field = name => root.querySelector(`[data-field="${name}"]`);
  const swatches = [...root.querySelectorAll('[data-color-token]')];
  const toHex = color => {
    const values = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return values ? '#' + values.slice(1).map(value => Number(value).toString(16).padStart(2, '0')).join('').toUpperCase() : color;
  };
  function updateColors() {
    field('guide_theme').textContent = document.documentElement.dataset.theme === 'dark' ? '다크 모드' : '라이트 모드';
    swatches.forEach(button => {
      const color = toHex(getComputedStyle(button.querySelector('.p_color')).backgroundColor);
      button.querySelector('[data-field="color_value"]').textContent = color;
      button.setAttribute('aria-label', `${button.querySelector('strong').textContent} ${color} 복사`);
    });
  }
  updateColors();
  new MutationObserver(updateColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-brand'] });
  swatches.forEach(button => button.addEventListener('click', async () => {
    const color = button.querySelector('[data-field="color_value"]').textContent;
    try {
      await navigator.clipboard.writeText(color);
      field('copy_feedback').textContent = `${button.querySelector('strong').textContent} ${color} 값을 복사했습니다.`;
    } catch (_) {
      field('copy_feedback').textContent = `클립보드를 사용할 수 없습니다. 표시된 값 ${color}을 직접 복사해 주세요.`;
    }
  }));
  root.querySelectorAll('[data-demo-label]').forEach(button => button.addEventListener('click', () => {
    field('button_feedback').textContent = `${button.dataset.demoLabel} 예시를 눌렀습니다. 실제 데이터에는 영향을 주지 않습니다.`;
  }));

  const form = field('guide_form');
  const nameInput = form.elements.worker_name;
  const nameHelp = root.querySelector('#name_help');
  function resetValidation() {
    field('name_field').removeAttribute('data-state');
    nameInput.removeAttribute('data-state');
    nameInput.removeAttribute('aria-invalid');
    nameHelp.textContent = '이름을 입력한 뒤 예시 확인을 눌러 보세요.';
    field('form_feedback').textContent = '입력값은 예시 확인에만 사용하며 저장하지 않습니다.';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const state = name ? 'success' : 'error';
    field('name_field').dataset.state = state;
    nameInput.dataset.state = state;
    nameInput.setAttribute('aria-invalid', String(!name));
    nameHelp.textContent = name ? '이름이 입력됐습니다.' : '작업자 이름을 입력해 주세요.';
    field('form_feedback').textContent = name ? `${name}님 · ${form.elements.company.value} 예시 입력을 확인했습니다. 실제 데이터는 저장되지 않습니다.` : '필수 항목을 확인해 주세요.';
    if (!name) nameInput.focus();
  });
  nameInput.addEventListener('input', resetValidation);
  form.addEventListener('reset', resetValidation);

  function setState(state) {
    field('state_demo').dataset.state = state;
    field('state_label').textContent = `data-state="${state}"`;
    root.querySelectorAll('[data-guide-state]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.guideState === state)));
  }
  root.querySelectorAll('[data-guide-state]').forEach(button => button.addEventListener('click', () => setState(button.dataset.guideState)));
  root.querySelectorAll('[data-guide-reset]').forEach(button => button.addEventListener('click', () => {
    setState('success');
    root.querySelector('[data-guide-state="success"]').focus();
  }));
})();
