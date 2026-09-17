/* Brand identity is independent of light/dark mode and of business data. */
(() => {
  const key = 'precheck.brand';
  const scriptUrl = new URL(document.currentScript.src);
  const imageBase = new URL('../images/', scriptUrl);
  const assetVersion = scriptUrl.searchParams.get('v');
  const profiles = [
    { id: 'hansol', label: '01 한솔형', prefix: 'precheck', description: '블루·그린 로고와 블루 강조색, 중립 회색으로 구성한 기본 브랜드입니다.' },
    { id: 'orange', label: '02 오렌지형', prefix: 'precheck-orange', description: '체크를 품은 오렌지 스파크와 따뜻한 회색으로 활기 있는 브랜드를 표현합니다.' },
    { id: 'navy', label: '03 네이비형', prefix: 'precheck-navy', description: '확인 프레임과 체크, 차분한 네이비 색상으로 정돈된 브랜드를 표현합니다.' }
  ];
  const valid = id => profiles.some(profile => profile.id === id);
  const get = () => profiles.find(profile => profile.id === document.documentElement.dataset.brand) || profiles[0];
  function asset(profile, type) {
    if (type === 'mark-sidebar') type = profile.id === 'navy' ? 'mark-white' : 'mark';
    if (type.endsWith('-auto')) {
      type = type.replace('-auto', '');
      if (document.documentElement.dataset.theme === 'dark' && (type === 'logo' || profile.id === 'navy')) type += '-white';
    }
    const url = new URL(`${profile.prefix}-${type}.svg`, imageBase);
    if (assetVersion) url.searchParams.set('v', assetVersion);
    return url.href;
  }
  function apply(scope = document) {
    const current = get();
    scope.querySelectorAll('[data-brand-asset], [data-brand-download]').forEach(el => {
      const profile = profiles.find(item => item.id === el.dataset.brandProfile) || current;
      const type = el.dataset.brandAsset || el.dataset.brandDownload;
      const url = asset(profile, type);
      if (el.hasAttribute('data-brand-download')) {
        el.href = url;
        el.download = new URL(url).pathname.split('/').pop();
      } else if (el.tagName === 'LINK') el.href = url;
      else el.src = url;
    });
    scope.querySelectorAll('[data-brand-label]').forEach(el => { el.textContent = current.label; });
    scope.querySelectorAll('[data-brand-description]').forEach(el => { el.textContent = current.description; });
    scope.querySelectorAll('[data-set-brand]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.setBrand === current.id)));
  }
  function set(id, persist = true) {
    document.documentElement.dataset.brand = valid(id) ? id : 'hansol';
    if (persist) { try { localStorage.setItem(key, get().id); } catch (_) {} }
    apply();
    document.dispatchEvent(new CustomEvent('precheck:brandchange', { detail: { id: get().id } }));
  }
  let initial = 'hansol';
  try { const saved = localStorage.getItem(key); if (valid(saved)) initial = saved; } catch (_) {}
  document.documentElement.dataset.brand = initial;
  window.PreCheckBrand = { profiles, get, set, apply, asset };
  document.addEventListener('DOMContentLoaded', () => apply());
  new MutationObserver(() => apply()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) set(event.newValue, false);
    if (event.key === 'theme') {
      if (event.newValue === 'dark') document.documentElement.dataset.theme = 'dark';
      else delete document.documentElement.dataset.theme;
      document.querySelectorAll('[data-action="theme_toggle"]').forEach(el => el.setAttribute('aria-pressed', String(event.newValue === 'dark')));
    }
  });
})();
