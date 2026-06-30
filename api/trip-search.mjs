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

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function normalizeInput(body = {}) {
  const startFallback = new Date();
  startFallback.setDate(startFallback.getDate() + 45);
  const endFallback = new Date(startFallback);
  endFallback.setDate(endFallback.getDate() + 7);

  return {
    origin: body.origin?.trim() || 'São Paulo',
    destination: body.destination?.trim() || 'Buenos Aires',
    start: body.start || isoDate(startFallback),
    end: body.end || isoDate(endFallback),
    people: Math.max(1, Number(body.people) || 2),
    budget: Math.round(Number(body.budget) || 8500),
    style: body.style || 'Intermediária',
    vibe: body.vibe?.trim() || '',
  };
}

async function geocodeDestination(destination) {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;

  if (googleKey) {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', destination);
    url.searchParams.set('language', 'pt-BR');
    url.searchParams.set('key', googleKey);
    const data = await fetchJson(url);
    const first = data.results?.[0];
    if (first) {
      return {
        name: destination,
        formatted: first.formatted_address,
        lat: first.geometry.location.lat,
        lon: first.geometry.location.lng,
        source: 'Google Geocoding',
      };
    }
  }

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', destination);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'pt');
  url.searchParams.set('format', 'json');
  const data = await fetchJson(url);
  const first = data.results?.[0];
  if (!first) throw new Error('Destino não encontrado');

  return {
    name: first.name,
    formatted: [first.name, first.admin1, first.country].filter(Boolean).join(', '),
    lat: first.latitude,
    lon: first.longitude,
    country: first.country,
    source: 'Open-Meteo Geocoding',
  };
}

async function getWeather(destination, start, end) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(destination.lat));
  url.searchParams.set('longitude', String(destination.lon));
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_probability_max');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('start_date', start);
  url.searchParams.set('end_date', end);

  const data = await fetchJson(url);
  const max = data.daily?.temperature_2m_max || [];
  const min = data.daily?.temperature_2m_min || [];
  const rain = data.daily?.precipitation_probability_max || [];
  const average = (items) => items.length ? Math.round(items.reduce((sum, item) => sum + item, 0) / items.length) : null;

  return {
    source: 'Open-Meteo',
    avgMax: average(max),
    avgMin: average(min),
    avgRain: average(rain),
    days: (data.daily?.time || []).map((date, index) => ({ date, max: max[index], min: min[index], rain: rain[index] })),
  };
}

function fallbackPlaces(destination) {
  return [
    { name: `Centro de ${destination}`, type: 'região', rating: 4.7, address: 'Boa base para começar o roteiro', source: 'Simulação local' },
    { name: 'Restaurantes bem avaliados', type: 'alimentação', rating: 4.6, address: 'Adicione a chave do Google para nomes reais', source: 'Simulação local' },
    { name: 'Passeio principal', type: 'atração', rating: 4.8, address: 'Defina conforme o estilo da viagem', source: 'Simulação local' },
  ];
}

function fallbackStays(destination) {
  return [
    { name: 'Opção econômica', place: `${destination} · região central`, rating: 4.6, night: 260, source: 'Simulação local' },
    { name: 'Opção intermediária', place: `${destination} · bairro recomendado`, rating: 4.8, night: 420, source: 'Simulação local' },
    { name: 'Opção confortável', place: `${destination} · melhor localização`, rating: 4.9, night: 680, source: 'Simulação local' },
  ];
}

async function textSearch(query, destination) {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!googleKey) return null;

  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', query);
  url.searchParams.set('location', `${destination.lat},${destination.lon}`);
  url.searchParams.set('language', 'pt-BR');
  url.searchParams.set('key', googleKey);
  const data = await fetchJson(url);
  return data.results || [];
}

async function getPlaces(trip, destination) {
  const results = await textSearch(`pontos turísticos restaurantes cafés em ${trip.destination}`, destination);
  if (!results?.length) return fallbackPlaces(trip.destination);

  return results.slice(0, 8).map((place) => ({
    name: place.name,
    address: place.formatted_address || trip.destination,
    rating: place.rating || null,
    type: place.types?.[0]?.replaceAll('_', ' ') || 'lugar',
    source: 'Google Places',
  }));
}

async function getStays(trip, destination) {
  const results = await textSearch(`hotéis hospedagens pousadas em ${trip.destination}`, destination);
  if (!results?.length) return fallbackStays(trip.destination);

  return results.slice(0, 6).map((place, index) => ({
    name: place.name,
    place: place.formatted_address || trip.destination,
    rating: place.rating || 4.6,
    night: [280, 360, 440, 520, 650, 790][index] || 420,
    source: 'Google Places',
  }));
}

async function getRoute(trip) {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!googleKey) {
    return {
      source: 'Simulação local',
      distance: 'A confirmar',
      duration: 'A confirmar',
      note: 'Adicione GOOGLE_MAPS_API_KEY para calcular distância real.',
    };
  }

  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
  url.searchParams.set('origins', trip.origin);
  url.searchParams.set('destinations', trip.destination);
  url.searchParams.set('language', 'pt-BR');
  url.searchParams.set('key', googleKey);
  const data = await fetchJson(url);
  const item = data.rows?.[0]?.elements?.[0];

  return {
    source: 'Google Distance Matrix',
    distance: item?.distance?.text || 'A confirmar',
    duration: item?.duration?.text || 'A confirmar',
    note: item?.status === 'OK' ? 'Rota calculada pela API.' : 'A API não retornou rota para esse trajeto.',
  };
}

async function getCurrency() {
  const key = process.env.EXCHANGE_RATE_API_KEY;
  const url = key ? `https://v6.exchangerate-api.com/v6/${key}/latest/BRL` : 'https://open.er-api.com/v6/latest/BRL';
  const data = await fetchJson(url);
  const rates = data.conversion_rates || data.rates || {};

  return {
    source: key ? 'ExchangeRate-API' : 'open.er-api.com',
    base: data.base_code || data.base || 'BRL',
    USD: rates.USD || null,
    EUR: rates.EUR || null,
    ARS: rates.ARS || null,
    CLP: rates.CLP || null,
  };
}

function tripDays(trip) {
  return Math.max(1, Math.round((new Date(trip.end) - new Date(trip.start)) / 86400000) || 1);
}

function buildBudget(trip, stays) {
  const days = tripDays(trip);
  const stayNight = stays[1]?.night || stays[0]?.night || 380;
  const lodging = stayNight * days;
  const foodPerDay = trip.style === 'Econômica' ? 85 : trip.style === 'Confortável' ? 190 : 130;
  const food = foodPerDay * trip.people * days;
  const transport = Math.round(trip.budget * 0.08);
  const tours = Math.round(trip.budget * 0.14);
  const free = Math.max(0, trip.budget - lodging - food - transport - tours);

  return {
    days,
    total: lodging + food + transport + tours,
    items: [
      { label: 'Hospedagem estimada', value: Math.round(lodging) },
      { label: 'Alimentação estimada', value: Math.round(food) },
      { label: 'Transporte local', value: Math.round(transport) },
      { label: 'Passeios e experiências', value: Math.round(tours) },
      { label: 'Margem livre', value: Math.round(free) },
    ],
  };
}

function buildItinerary(places, days) {
  const list = places.length ? places : fallbackPlaces('destino');
  return Array.from({ length: Math.min(days, 7) }, (_, index) => {
    const place = list[index % list.length];
    return {
      day: index + 1,
      title: index === 0 ? 'Chegada e reconhecimento da região' : place.name,
      description: index === 0
        ? 'Chegue sem pressa, entenda o bairro e organize os primeiros deslocamentos.'
        : `Inclua ${place.name} e agrupe lugares próximos para economizar tempo.`,
    };
  });
}

async function buildTripSearch(body) {
  const trip = normalizeInput(body);
  const destination = await geocodeDestination(trip.destination);

  const [weather, places, stays, route, currency] = await Promise.allSettled([
    getWeather(destination, trip.start, trip.end),
    getPlaces(trip, destination),
    getStays(trip, destination),
    getRoute(trip),
    getCurrency(),
  ]);

  const safePlaces = places.status === 'fulfilled' ? places.value : fallbackPlaces(trip.destination);
  const safeStays = stays.status === 'fulfilled' ? stays.value : fallbackStays(trip.destination);
  const budget = buildBudget(trip, safeStays);

  return {
    trip,
    destination,
    weather: weather.status === 'fulfilled' ? weather.value : { source: 'Open-Meteo', error: 'Clima indisponível agora', days: [] },
    places: safePlaces,
    stays: safeStays,
    route: route.status === 'fulfilled' ? route.value : { source: 'Google Routes', distance: 'A confirmar', duration: 'A confirmar' },
    currency: currency.status === 'fulfilled' ? currency.value : { source: 'Câmbio indisponível', base: 'BRL' },
    budget,
    itinerary: buildItinerary(safePlaces, budget.days),
    integrations: {
      google: Boolean(process.env.GOOGLE_MAPS_API_KEY),
      openMeteo: true,
      exchangeRate: true,
    },
  };
}

export async function handleTripSearch(request, response) {
  if (request.method !== 'POST') {
    sendJson(response, 405, { error: 'Use POST para pesquisar uma viagem.' });
    return;
  }

  try {
    const body = await readBody(request);
    const result = await buildTripSearch(body);
    sendJson(response, 200, result);
  } catch (error) {
    sendJson(response, 500, {
      error: 'Não foi possível montar a busca integrada.',
      detail: error.message,
    });
  }
}
