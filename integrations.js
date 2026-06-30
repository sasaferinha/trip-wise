const apiKey = 'tripwise-api-result';

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}

function hideSocial() {
  qsa('[data-go="community"], [data-go="profile"]').forEach((item) => item.remove());
  if (location.hash === '#community' || location.hash === '#profile') location.hash = '#dashboard';
}

function enhancePlan() {
  const grid = qs('.consult-filter-grid');
  if (!grid || grid.dataset.apiFields) return;
  grid.dataset.apiFields = 'true';
  const row = document.createElement('div');
  row.className = 'consult-filter-grid';
  row.style.marginTop = '14px';
  row.innerHTML = `
    <div class="field"><label>Origem</label><input id="api-origin" class="input" value="São Paulo"></div>
    <div class="field"><label>Data de ida</label><input id="api-start" class="input" type="date" value="2026-09-12"></div>
    <div class="field"><label>Data de volta</label><input id="api-end" class="input" type="date" value="2026-09-19"></div>
  `;
  grid.after(row);
}

async function searchTrip() {
  const payload = {
    origin: qs('#api-origin')?.value || 'São Paulo',
    destination: qs('#destination-search')?.value || 'Buenos Aires',
    start: qs('#api-start')?.value || undefined,
    end: qs('#api-end')?.value || undefined,
    budget: Number(qs('#consult-budget')?.value || 8500),
    people: Number(qs('#consult-people')?.value || 2),
    style: qs('#consult-style')?.value || 'Intermediária',
    vibe: qs('#trip-question')?.value || '',
  };
  const res = await fetch('/api/trip-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Servidor integrado ainda não está ativo.');
  return res.json();
}

function bindSearch() {
  const btn = qs('#build-consult');
  if (!btn || btn.dataset.apiBound) return;
  btn.dataset.apiBound = 'true';
  document.addEventListener('click', async (event) => {
    const target = event.target.closest('#build-consult');
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    target.disabled = true;
    target.textContent = 'Buscando dados reais...';
    try {
      const data = await searchTrip();
      localStorage.setItem(apiKey, JSON.stringify(data));
      localStorage.setItem('tripwise-trip', JSON.stringify(data.trip));
      location.hash = 'dashboard';
    } catch (error) {
      target.disabled = false;
      target.textContent = 'Gerar consultoria';
      alert(error.message);
    }
  }, true);
}

function renderResult() {
  if (location.hash && location.hash !== '#dashboard') return;
  if (qs('#api-result-panel')) return;
  const raw = localStorage.getItem(apiKey);
  if (!raw) return;
  const data = JSON.parse(raw);
  const anchor = qs('.consult-stats') || qs('.consult-grid');
  if (!anchor) return;
  const panel = document.createElement('section');
  panel.id = 'api-result-panel';
  panel.style.marginTop = '30px';
  panel.innerHTML = `
    <div class="section-head"><div><div class="eyebrow">Busca integrada</div><h2>${data.trip.destination}</h2><p class="muted">Clima, rota, câmbio, lugares, hospedagens e orçamento.</p></div></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
      <article class="card"><h3>Clima</h3><p class="muted">${data.weather.avgMin || '-'}°C a ${data.weather.avgMax || '-'}°C · chuva ${data.weather.avgRain || 0}%</p></article>
      <article class="card"><h3>Rota</h3><p class="muted">${data.route.distance} · ${data.route.duration}</p></article>
      <article class="card"><h3>Câmbio</h3><p class="muted">USD ${data.currency.USD || '-'} · EUR ${data.currency.EUR || '-'}</p></article>
      <article class="card"><h3>Orçamento</h3><p class="muted">${data.budget.items.map(i => `${i.label}: R$ ${i.value}`).join('<br>')}</p></article>
    </div>
  `;
  anchor.after(panel);
}

function enhance() {
  hideSocial();
  enhancePlan();
  bindSearch();
  renderResult();
}

window.addEventListener('hashchange', () => setTimeout(enhance, 80));
new MutationObserver(enhance).observe(document.body, { childList: true, subtree: true });
setTimeout(enhance, 80);
