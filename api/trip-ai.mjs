const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8' };

function sendJson(response, status, data) {
  response.writeHead(status, jsonHeaders);
  response.end(JSON.stringify(data));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? JSON.parse(raw) : {};
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json();
    if (!response.ok) throw new Error(`Anthropic HTTP ${response.status}`);
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeTrip(trip = {}) {
  return {
    destination: String(trip.destination || 'não informado').trim(),
    days: Math.max(1, Number(trip.days) || 1),
    people: Math.max(1, Number(trip.people) || 1),
    budget: Math.max(0, Number(trip.budget) || 0),
    style: String(trip.style || 'não informado').trim(),
  };
}

function buildSystemPrompt(trip) {
  return [
    'Você é a Trip AI, assistente de planejamento de viagens da TripWise.',
    'Responda sempre em português do Brasil, de forma prática, específica e objetiva.',
    'Use valores em reais quando falar de orçamento.',
    'Não invente reservas, disponibilidade em tempo real ou ações que não foram executadas.',
    '',
    'Contexto atual da viagem:',
    `- Destino: ${trip.destination}`,
    `- Duração: ${trip.days} dias`,
    `- Pessoas: ${trip.people}`,
    `- Orçamento total: R$ ${trip.budget.toLocaleString('pt-BR')}`,
    `- Estilo: ${trip.style}`,
  ].join('\n');
}

export async function handleTripAI(request, response) {
  if (request.method !== 'POST') {
    sendJson(response, 405, { error: 'Use POST para conversar com a Trip AI.' });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    sendJson(response, 503, { error: 'A Trip AI ainda não está configurada. Tente novamente mais tarde.' });
    return;
  }
  try {
    const body = await readBody(request);
    const message = String(body.message || '').trim();
    if (!message) {
      sendJson(response, 400, { error: 'Digite uma mensagem para a Trip AI.' });
      return;
    }
    const trip = normalizeTrip(body.trip);
    const data = await fetchJson('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: buildSystemPrompt(trip),
        messages: [{ role: 'user', content: message }],
      }),
    });
    const reply = data.content?.filter((item) => item.type === 'text').map((item) => item.text).join('\n').trim();
    if (!reply) throw new Error('Resposta vazia da Anthropic');
    sendJson(response, 200, { reply });
  } catch {
    sendJson(response, 502, { error: 'Não foi possível consultar a Trip AI agora. Tente novamente em alguns instantes.' });
  }
}

export default handleTripAI;
