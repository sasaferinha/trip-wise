const SESSION_KEY = 'tripwise-session-active';
const INTERNAL_ROUTES = ['plan','dashboard','stays','community','profile'];

const hasSession = () => localStorage.getItem(SESSION_KEY) === 'yes';
const currentRoute = () => location.hash.replace('#','') || 'home';

const iconSvg = (name) => {
  const paths = {
    compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
    arrow:'<path d="m9 18 6-6-6-6"/>',
    wallet:'<path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6"/><path d="M16 13h4"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5a5.5 5.5 0 0 0 1-8.9Z"/>',
    exit:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>'
  };
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.compass}</svg>`;
};

function publicLanding() {
  return `
    <div class="public-shell">
      <header class="public-topbar">
        <button class="brand" data-public-home>
          <span class="brand-mark">${iconSvg('compass')}</span>Tripwise
        </button>
        <nav class="public-nav">
          <a href="#features">Como funciona</a>
          <a href="#budget">Orçamento</a>
          <a href="#social">Comunidade</a>
        </nav>
        <button class="btn small secondary" data-start-app="dashboard">Entrar</button>
      </header>

      <main class="landing">
        <section class="public-hero">
          <div class="hero-copy">
            <div class="eyebrow">Sua viagem sem susto no cartão</div>
            <h1>Planeje, estime e compartilhe sua próxima viagem.</h1>
            <p>Tripwise junta orçamento, hospedagem, roteiro e comunidade em um app simples para você saber quanto vai gastar antes de fechar tudo.</p>
            <div class="hero-actions">
              <button class="btn" data-start-app="plan">Começar planejamento ${iconSvg('arrow')}</button>
              <button class="btn secondary" data-start-app="dashboard">Entrar na Tripwise</button>
            </div>
          </div>

          <section class="hero-visual public-phone">
            <div class="destination-card">
              <div class="dest-top"><span class="pill">Próxima viagem</span><span class="pill">${iconSvg('heart')}</span></div>
              <div class="dest-bottom">
                <div class="eyebrow">Portugal</div>
                <h2>Lisboa</h2>
                <div class="trip-meta"><span>12–19 set</span><span>2 pessoas</span></div>
                <div class="budget-mini">
                  <div class="budget-row"><span>Orçamento utilizado</span><b>78%</b></div>
                  <div class="progress"><span style="width:78%"></span></div>
                </div>
              </div>
            </div>
            <div class="floating-card cost"><span class="icon-bubble">${iconSvg('wallet')}</span><span class="muted">Custo por dia</span><strong>R$ 947</strong></div>
            <div class="floating-card saved"><span class="icon-bubble">${iconSvg('check')}</span><span class="muted">Economia prevista</span><strong style="color:var(--green)">R$ 1.870</strong></div>
          </section>
        </section>

        <section id="features" class="public-section">
          <div class="section-head"><div><div class="eyebrow">Como funciona</div><h2>Da ideia ao roteiro final</h2></div></div>
          <div class="public-cards">
            <article class="card"><span class="stat-icon">${iconSvg('search')}</span><h3>Pesquise o destino</h3><p class="muted">Veja melhor época, média por dia e pontos que não podem faltar.</p></article>
            <article class="card"><span class="stat-icon">${iconSvg('wallet')}</span><h3>Monte o orçamento</h3><p class="muted">Acompanhe gastos estimados por passagem, hospedagem, comida e passeios.</p></article>
            <article class="card"><span class="stat-icon">${iconSvg('users')}</span><h3>Use experiências reais</h3><p class="muted">Copie roteiros da comunidade e personalize para sua realidade.</p></article>
          </div>
        </section>

        <section id="budget" class="public-section public-cta">
          <div>
            <div class="eyebrow">Área interna</div>
            <h2>Seu painel fica separado da página pública.</h2>
            <p class="muted">Ao entrar, você acessa dashboard, planejamento, hospedagens, comunidade e perfil.</p>
          </div>
          <button class="btn" data-start-app="dashboard">Entrar agora ${iconSvg('arrow')}</button>
        </section>
      </main>
    </div>
  `;
}

function applySeparation() {
  const app = document.querySelector('#app');
  if (!app) return;

  if (!hasSession()) {
    app.innerHTML = publicLanding();
    document.body.classList.add('is-public');
    document.body.classList.remove('is-logged');
    if (INTERNAL_ROUTES.includes(currentRoute())) history.replaceState(null, '', `${location.pathname}#home`);
    bindPublicControls();
    return;
  }

  document.body.classList.remove('is-public');
  document.body.classList.add('is-logged');
  addInternalControls();
}

function bindPublicControls() {
  document.querySelectorAll('[data-start-app]').forEach((button) => {
    button.addEventListener('click', () => {
      const destination = button.dataset.startApp || 'dashboard';
      localStorage.setItem(SESSION_KEY, 'yes');
      location.hash = destination;
      setTimeout(applySeparation, 0);
    });
  });

  document.querySelector('[data-public-home]')?.addEventListener('click', () => {
    location.hash = 'home';
  });
}

function addInternalControls() {
  const topbar = document.querySelector('.topbar');
  if (!topbar || topbar.querySelector('[data-end-session]')) return;

  const exitButton = document.createElement('button');
  exitButton.className = 'btn small secondary exit-btn';
  exitButton.dataset.endSession = 'true';
  exitButton.innerHTML = `${iconSvg('exit')} Sair`;
  exitButton.addEventListener('click', endSession);

  const avatar = topbar.querySelector('.avatar');
  if (avatar) {
    const group = document.createElement('div');
    group.className = 'top-actions';
    topbar.insertBefore(group, avatar);
    group.appendChild(exitButton);
    group.appendChild(avatar);
  } else {
    topbar.appendChild(exitButton);
  }

  if (currentRoute() === 'profile' && !document.querySelector('.profile-exit-card')) {
    const page = document.querySelector('.page');
    page?.insertAdjacentHTML('beforeend', `<section class="card profile-exit-card"><h3>Sessão</h3><p class="muted">Sair volta para a landing page pública da Tripwise.</p><button class="btn secondary" data-end-session-profile>${iconSvg('exit')} Sair da conta</button></section>`);
    document.querySelector('[data-end-session-profile]')?.addEventListener('click', endSession);
  }
}

function endSession() {
  localStorage.removeItem(SESSION_KEY);
  location.hash = 'home';
  setTimeout(applySeparation, 0);
}

window.addEventListener('hashchange', () => setTimeout(applySeparation, 0));
window.addEventListener('DOMContentLoaded', () => setTimeout(applySeparation, 0));
setTimeout(applySeparation, 0);
