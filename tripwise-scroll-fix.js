const nativeScrollTo = window.scrollTo.bind(window);
window.scrollTo = (...args) => {
  const isIdeas = location.hash === '#ideas' || location.hash === '' && document.querySelector('.minimal-ai');
  const targetTop = typeof args[0] === 'object' ? args[0]?.top : args[1];
  const isTopJump = Number(targetTop || 0) === 0;
  if (isIdeas && isTopJump && document.querySelector('#chat-messages')) return;
  nativeScrollTo(...args);
};

const tripAIStyle = document.createElement('style');
tripAIStyle.textContent = `
  .minimal-ai .chat-panel{position:relative;min-height:calc(100dvh - 120px);display:flex;flex-direction:column;overflow:hidden}.minimal-ai .chat-messages{position:relative;flex:1;min-height:360px;max-height:calc(100dvh - 310px);overflow-y:auto;scroll-behavior:smooth;padding-bottom:92px}.minimal-ai .chat-form{position:fixed;left:50%;bottom:18px;z-index:35;width:min(820px,calc(100vw - 32px));margin:0;transform:translateX(-50%);padding-top:12px;background:linear-gradient(180deg,rgba(5,5,5,0),rgba(5,5,5,.88) 22%,rgba(5,5,5,.98))}.minimal-ai .chat-form .input:focus,.minimal-ai .chat-form .btn:hover{transform:none}.trip-scroll-down{position:absolute;left:50%;bottom:96px;transform:translateX(-50%) translateY(12px);width:52px;height:52px;border:1px solid rgba(255,255,255,.11);border-radius:999px;background:rgba(32,33,42,.94);color:#fff;font-size:28px;line-height:1;display:grid;place-items:center;box-shadow:0 18px 45px rgba(0,0,0,.45);cursor:pointer;opacity:0;pointer-events:none;transition:.2s ease;z-index:30}.trip-scroll-down.show{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}.trip-chat-tools{display:flex;gap:8px;align-items:center;justify-content:space-between;margin:-8px 0 12px}.trip-history-btn,.trip-new-chat{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;border-radius:999px;padding:9px 12px;font:650 13px/1 'DM Sans',sans-serif;cursor:pointer}.trip-history-btn:hover,.trip-new-chat:hover{background:rgba(255,255,255,.1)}.trip-history-panel{position:absolute;inset:76px 14px auto 14px;max-height:min(430px,70dvh);overflow:auto;border:1px solid rgba(255,255,255,.12);border-radius:22px;background:rgba(12,13,18,.97);box-shadow:0 24px 70px rgba(0,0,0,.55);padding:14px;z-index:40;display:none}.trip-history-panel.open{display:block}.trip-history-panel h3{font-size:15px;margin:2px 0 12px}.trip-history-empty{color:rgba(255,255,255,.62);font-size:13px;line-height:1.4}.trip-history-item{width:100%;text-align:left;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.045);color:#fff;border-radius:16px;padding:12px;margin-bottom:8px;cursor:pointer}.trip-history-item b{display:block;font-size:13.5px;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.trip-history-item small{color:rgba(255,255,255,.58);font-size:12px}.chat-msg{animation:tripMsgIn .22s ease both}@keyframes tripMsgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@media(max-width:560px){.minimal-ai .chat-form{bottom:calc(82px + env(safe-area-inset-bottom));width:calc(100vw - 28px)}.minimal-ai .chat-messages{min-height:calc(100dvh - 360px);max-height:calc(100dvh - 292px);padding-bottom:84px}.trip-scroll-down{bottom:88px;width:50px;height:50px;font-size:27px}.trip-history-panel{inset:68px 10px auto 10px}}
`;
document.head.appendChild(tripAIStyle);

const HISTORY_KEY = 'tripwise-chat-history';
const CHAT_KEY = 'tripwise-chat';

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch { return fallback; }
}

function saveCurrentChatToHistory() {
  const chat = readJSON(CHAT_KEY, []);
  const userMessages = chat.filter(message => message.from === 'user');
  if (!userMessages.length) return;
  const history = readJSON(HISTORY_KEY, []);
  const title = userMessages[0]?.text?.slice(0, 64) || 'Nova conversa';
  const current = { id: Date.now(), title, updatedAt: new Date().toISOString(), chat };
  const filtered = history.filter(item => item.title !== title || JSON.stringify(item.chat) !== JSON.stringify(chat));
  localStorage.setItem(HISTORY_KEY, JSON.stringify([current, ...filtered].slice(0, 12)));
}

function isNearBottom(messages) {
  return messages.scrollHeight - messages.scrollTop - messages.clientHeight < 80;
}

function scrollChatToBottom() {
  const messages = document.querySelector('#chat-messages');
  if (!messages) return;
  messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
}

function updateDownButton(messages, button) {
  if (!messages || !button) return;
  button.classList.toggle('show', !isNearBottom(messages));
}

function renderHistory(panel) {
  const history = readJSON(HISTORY_KEY, []);
  panel.innerHTML = `<h3>Histórico de conversas</h3>${history.length ? history.map(item => `<button class="trip-history-item" data-load-chat="${item.id}"><b>${item.title}</b><small>${new Date(item.updatedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</small></button>`).join('') : '<p class="trip-history-empty">Suas conversas com a Trip AI vão aparecer aqui automaticamente.</p>'}`;
}

function enhanceTripAI() {
  if (location.hash !== '#ideas') return;
  const panel = document.querySelector('.chat-panel');
  const messages = document.querySelector('#chat-messages');
  const form = document.querySelector('#chat-form');
  if (!panel || !messages || !form || panel.dataset.tripEnhanced === 'true') return;
  panel.dataset.tripEnhanced = 'true';

  const tools = document.createElement('div');
  tools.className = 'trip-chat-tools';
  tools.innerHTML = '<button class="trip-history-btn" type="button">Histórico</button><button class="trip-new-chat" type="button">Nova conversa</button>';
  form.insertAdjacentElement('beforebegin', tools);

  const historyPanel = document.createElement('div');
  historyPanel.className = 'trip-history-panel';
  panel.appendChild(historyPanel);
  renderHistory(historyPanel);

  const down = document.createElement('button');
  down.type = 'button';
  down.className = 'trip-scroll-down';
  down.setAttribute('aria-label', 'Descer para a mensagem mais recente');
  down.textContent = '↓';
  panel.appendChild(down);

  messages.addEventListener('scroll', () => updateDownButton(messages, down), { passive: true });
  down.addEventListener('click', scrollChatToBottom);

  tools.querySelector('.trip-history-btn').addEventListener('click', () => {
    renderHistory(historyPanel);
    historyPanel.classList.toggle('open');
  });

  tools.querySelector('.trip-new-chat').addEventListener('click', () => {
    saveCurrentChatToHistory();
    localStorage.setItem(CHAT_KEY, JSON.stringify([{ from: 'ai', text: 'Sou a Trip AI. Me diga seu orçamento, época do ano e tipo de viagem. Posso sugerir destinos, comparar opções, estimar custos, explicar clima, comida, roteiros e mostrar imagens.' }]));
    location.reload();
  });

  historyPanel.addEventListener('click', event => {
    const item = event.target.closest('[data-load-chat]');
    if (!item) return;
    const history = readJSON(HISTORY_KEY, []);
    const selected = history.find(chat => String(chat.id) === item.dataset.loadChat);
    if (!selected) return;
    localStorage.setItem(CHAT_KEY, JSON.stringify(selected.chat));
    location.reload();
  });

  setTimeout(scrollChatToBottom, 80);
  setTimeout(() => updateDownButton(messages, down), 140);
}

function keepTripAIAtBottom() {
  if (location.hash !== '#ideas') return;
  const input = document.querySelector('#chat-input');
  const messages = document.querySelector('#chat-messages');
  if (!input || !messages) return;
  requestAnimationFrame(() => {
    messages.scrollTop = messages.scrollHeight;
    input.scrollIntoView({ block: 'end' });
  });
}

document.addEventListener('submit', event => {
  if (event.target?.id === 'chat-form') {
    setTimeout(saveCurrentChatToHistory, 70);
    setTimeout(keepTripAIAtBottom, 80);
    setTimeout(keepTripAIAtBottom, 250);
  }
}, true);

document.addEventListener('click', event => {
  if (event.target?.closest?.('[data-chat-prompt]')) {
    setTimeout(saveCurrentChatToHistory, 120);
    setTimeout(keepTripAIAtBottom, 120);
    setTimeout(keepTripAIAtBottom, 280);
  }
}, true);

window.addEventListener('hashchange', () => {
  setTimeout(enhanceTripAI, 80);
  setTimeout(keepTripAIAtBottom, 120);
});

const tripObserver = new MutationObserver(() => enhanceTripAI());
tripObserver.observe(document.documentElement, { childList: true, subtree: true });
setTimeout(enhanceTripAI, 80);
