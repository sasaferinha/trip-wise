const nativeScrollTo = window.scrollTo.bind(window);
window.scrollTo = (...args) => {
  const isIdeas = location.hash === '#ideas' || location.hash === '' && document.querySelector('.minimal-ai');
  const targetTop = typeof args[0] === 'object' ? args[0]?.top : args[1];
  const isTopJump = Number(targetTop || 0) === 0;
  if (isIdeas && isTopJump && document.querySelector('#chat-messages')) return;
  nativeScrollTo(...args);
};

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
    setTimeout(keepTripAIAtBottom, 80);
    setTimeout(keepTripAIAtBottom, 250);
  }
}, true);

document.addEventListener('click', event => {
  if (event.target?.closest?.('[data-chat-prompt]')) {
    setTimeout(keepTripAIAtBottom, 120);
    setTimeout(keepTripAIAtBottom, 280);
  }
}, true);

window.addEventListener('hashchange', () => setTimeout(keepTripAIAtBottom, 120));
