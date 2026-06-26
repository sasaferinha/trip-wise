(() => {
  const STORAGE_KEY = 'tripwise-current-step';
  const steps = [
    {
      id: 'passagem',
      icon: '✈️',
      title: 'Passagem',
      subtitle: 'Defina primeiro como você vai chegar.',
      description: 'Pesquise ida e volta, compare horários, escolha aeroporto e salve uma estimativa realista para a viagem.',
      tasks: ['Origem e destino definidos', 'Datas de ida e volta', 'Valor estimado da passagem'],
      action: 'Salvar passagem'
    },
    {
      id: 'hospedagem',
      icon: '🛏️',
      title: 'Hospedagem',
      subtitle: 'Depois escolha onde ficar.',
      description: 'Compare regiões, fotos, avaliações e preço total. A hospedagem precisa combinar com o roteiro e caber no orçamento.',
      tasks: ['Região escolhida', 'Hospedagens comparadas', 'Preço total salvo'],
      action: 'Salvar hospedagem'
    },
    {
      id: 'alimentacao',
      icon: '🍽️',
      title: 'Alimentação',
      subtitle: 'Agora calcule o gasto do dia a dia.',
      description: 'Defina uma média diária para café, almoço, jantar, mercado e restaurantes especiais.',
      tasks: ['Média por dia definida', 'Quantidade de dias calculada', 'Reserva para restaurantes'],
      action: 'Salvar alimentação'
    },
    {
      id: 'locomocao',
      icon: '🚕',
      title: 'Locomoção',
      subtitle: 'Feche como você vai se mover no destino.',
      description: 'Compare transporte público, aplicativo, transfer ou aluguel. Essa etapa fecha o custo principal da viagem.',
      tasks: ['Transporte principal escolhido', 'Deslocamentos importantes', 'Custo total estimado'],
      action: 'Finalizar passo a passo'
    }
  ];

  function injectStyles() {
    if (document.getElementById('tripwise-stepper-style')) return;
    const style = document.createElement('style');
    style.id = 'tripwise-stepper-style';
    style.textContent = `
      .tw-stepper-section{margin-top:34px;border:1px solid var(--line);border-radius:28px;padding:24px;background:linear-gradient(145deg,rgba(98,230,165,.07),rgba(255,255,255,.025));}
      .tw-stepper-head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:22px;}
      .tw-stepper-head h2{margin:0 0 6px;font-size:32px;}
      .tw-stepper-head p{margin:0;color:var(--muted);line-height:1.5;}
      .tw-stepper-progress{min-width:190px;text-align:right;color:var(--green);font-weight:800;font-size:13px;}
      .tw-stepper-progress div{height:8px;margin-top:9px;border-radius:999px;background:rgba(255,255,255,.09);overflow:hidden;}
      .tw-stepper-progress span{display:block;height:100%;border-radius:inherit;background:var(--green);transition:.25s;}
      .tw-stepper-layout{display:grid;grid-template-columns:290px 1fr;gap:18px;align-items:start;}
      .tw-step-list{display:grid;gap:10px;}
      .tw-step-tab{width:100%;display:flex;align-items:center;gap:12px;padding:14px;border:1px solid var(--line);border-radius:16px;background:var(--surface-2);color:white;text-align:left;transition:.2s;}
      .tw-step-tab:hover{transform:translateY(-2px);border-color:rgba(98,230,165,.35);}
      .tw-step-tab.is-active{border-color:rgba(98,230,165,.65);background:rgba(98,230,165,.1);box-shadow:0 0 0 1px rgba(98,230,165,.09);}
      .tw-step-tab.is-done{color:var(--green);}
      .tw-step-number{width:38px;height:38px;display:grid;place-items:center;border-radius:13px;background:var(--surface-3);font-weight:900;}
      .tw-step-tab.is-active .tw-step-number,.tw-step-tab.is-done .tw-step-number{background:var(--green-dark);color:var(--green);}
      .tw-step-copy strong,.tw-step-copy small{display:block;}
      .tw-step-copy small{margin-top:3px;color:var(--muted);font-size:11px;line-height:1.35;}
      .tw-step-panel{min-height:360px;border:1px solid var(--line);border-radius:22px;padding:24px;background:var(--surface);}
      .tw-step-panel-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:24px;}
      .tw-step-kicker{color:var(--green);text-transform:uppercase;letter-spacing:1.4px;font-size:11px;font-weight:900;}
      .tw-step-panel h3{margin:5px 0 10px;font-size:34px;}
      .tw-step-panel p{max-width:680px;color:#c4ccc8;line-height:1.6;}
      .tw-step-emoji{width:58px;height:58px;display:grid;place-items:center;border-radius:18px;background:rgba(98,230,165,.1);font-size:27px;}
      .tw-step-tasks{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:22px 0;}
      .tw-step-task{padding:14px;border:1px solid var(--line);border-radius:15px;background:var(--surface-2);color:#dce4e0;font-size:13px;}
      .tw-step-task::before{content:'✓';display:inline-grid;place-items:center;width:20px;height:20px;margin-right:8px;border-radius:7px;background:var(--green-dark);color:var(--green);font-weight:900;font-size:11px;}
      .tw-step-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:26px;}
      .tw-step-actions .btn{min-width:150px;}
      @media(max-width:900px){.tw-stepper-layout{grid-template-columns:1fr}.tw-stepper-head{display:block}.tw-stepper-progress{text-align:left;margin-top:16px}.tw-step-tasks{grid-template-columns:1fr}.tw-step-panel-top{align-items:center}.tw-step-panel h3{font-size:28px}}
      @media(max-width:560px){.tw-stepper-section{margin-left:-1vw;margin-right:-1vw;padding:17px;border-radius:20px}.tw-step-actions{display:grid}.tw-step-actions .btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function getIndex() {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(saved) ? Math.min(Math.max(saved, 0), steps.length - 1) : 0;
  }

  function setIndex(index) {
    localStorage.setItem(STORAGE_KEY, String(Math.min(Math.max(index, 0), steps.length - 1)));
    patchStepper();
  }

  function buildStepper() {
    const current = getIndex();
    const active = steps[current];
    const percent = ((current + 1) / steps.length) * 100;
    return `
      <section class="tw-stepper-section" data-tripwise-stepper>
        <div class="tw-stepper-head">
          <div>
            <div class="eyebrow">Passo a passo</div>
            <h2>Monte sua viagem em 4 etapas</h2>
            <p>Sem lista gigante e confusa. A Tripwise guia o usuário por uma decisão de cada vez.</p>
          </div>
          <div class="tw-stepper-progress">Passo ${current + 1} de ${steps.length}<div><span style="width:${percent}%"></span></div></div>
        </div>
        <div class="tw-stepper-layout">
          <div class="tw-step-list">
            ${steps.map((step, index) => `
              <button class="tw-step-tab ${index === current ? 'is-active' : ''} ${index < current ? 'is-done' : ''}" data-step-index="${index}">
                <span class="tw-step-number">${index < current ? '✓' : index + 1}</span>
                <span class="tw-step-copy"><strong>${step.title}</strong><small>${step.subtitle}</small></span>
              </button>
            `).join('')}
          </div>
          <article class="tw-step-panel">
            <div class="tw-step-panel-top">
              <div>
                <span class="tw-step-kicker">Etapa ${current + 1}</span>
                <h3>${active.title}</h3>
                <p>${active.description}</p>
              </div>
              <div class="tw-step-emoji">${active.icon}</div>
            </div>
            <div class="tw-step-tasks">
              ${active.tasks.map(task => `<div class="tw-step-task">${task}</div>`).join('')}
            </div>
            <div class="tw-step-actions">
              <button class="btn secondary" data-step-prev ${current === 0 ? 'disabled' : ''}>Voltar</button>
              <button class="btn" data-step-next>${current === steps.length - 1 ? 'Finalizar' : active.action}</button>
            </div>
          </article>
        </div>
      </section>
    `;
  }

  function findOldSection() {
    const titles = [...document.querySelectorAll('h2')];
    const title = titles.find(h => h.textContent.trim().toLowerCase().includes('etapas da consultoria'));
    if (!title) return null;
    return title.closest('section') || title.parentElement?.parentElement;
  }

  function bindStepper() {
    document.querySelectorAll('[data-step-index]').forEach(button => {
      button.onclick = () => setIndex(Number(button.dataset.stepIndex));
    });
    const prev = document.querySelector('[data-step-prev]');
    const next = document.querySelector('[data-step-next]');
    if (prev) prev.onclick = () => setIndex(getIndex() - 1);
    if (next) next.onclick = () => {
      const current = getIndex();
      if (current >= steps.length - 1) {
        const toast = document.getElementById('toast');
        if (toast) {
          toast.textContent = 'Passo a passo finalizado.';
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 2200);
        }
        return;
      }
      setIndex(current + 1);
    };
  }

  function patchStepper() {
    injectStyles();
    if ((location.hash || '#home') !== '#dashboard') return;
    const existing = document.querySelector('[data-tripwise-stepper]');
    if (existing) existing.outerHTML = buildStepper();
    const oldSection = findOldSection();
    if (oldSection && !oldSection.matches('[data-tripwise-stepper]')) {
      oldSection.outerHTML = buildStepper();
    }
    bindStepper();
  }

  window.addEventListener('hashchange', () => setTimeout(patchStepper, 80));
  window.addEventListener('DOMContentLoaded', () => setTimeout(patchStepper, 160));
  setTimeout(patchStepper, 300);
})();
