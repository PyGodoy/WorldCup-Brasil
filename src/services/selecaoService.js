import { apiGet } from './footballData.js';
import { apiSportsGet } from './apiSports.js';
import { getFotosBrasil } from './fotos.js';
import { config, CACHE_TTL } from '../config.js';

const { worldCupCode, worldCupId } = config;

// Executa a chamada real à API. Se a API estiver indisponível (sem chave, limite de
// requisições atingido ou recurso restrito ao plano), NÃO preenchemos com dados de
// exemplo — lançamos um erro para a rota responder com falha e o frontend mostrar uma
// mensagem ao usuário, em vez de exibir dados falsos.
async function withDemoFallback(realCall) {
  try {
    return await realCall();
  } catch (err) {
    if (['DEMO_MODE', 'PLAN_LIMIT', 'RATE_LIMIT'].includes(err.code) || err.message === 'DEMO_MODE') {
      const e = new Error('Dados temporariamente indisponíveis');
      e.code = 'INDISPONIVEL';
      throw e;
    }
    throw err;
  }
}

// ---------- helpers ----------

// Nomes de seleções em português (chaves = nome exato da football-data; fallback: nome original).
const NOMES_PT = {
  // Américas
  Brazil: 'Brasil', Argentina: 'Argentina', Uruguay: 'Uruguai', Colombia: 'Colômbia',
  Ecuador: 'Equador', Paraguay: 'Paraguai', Chile: 'Chile', Peru: 'Peru', Bolivia: 'Bolívia',
  Venezuela: 'Venezuela', Mexico: 'México', 'United States': 'Estados Unidos', Canada: 'Canadá',
  'Costa Rica': 'Costa Rica', Panama: 'Panamá', Honduras: 'Honduras', Jamaica: 'Jamaica',
  Haiti: 'Haiti', 'Curaçao': 'Curaçao',
  // Europa
  France: 'França', Germany: 'Alemanha', Spain: 'Espanha', Portugal: 'Portugal',
  England: 'Inglaterra', Scotland: 'Escócia', Wales: 'País de Gales', Netherlands: 'Holanda',
  Belgium: 'Bélgica', Italy: 'Itália', Croatia: 'Croácia', Serbia: 'Sérvia',
  Switzerland: 'Suíça', Sweden: 'Suécia', Norway: 'Noruega', Denmark: 'Dinamarca',
  Poland: 'Polônia', Austria: 'Áustria', Czechia: 'Tchéquia', 'Czech Republic': 'Tchéquia',
  'Bosnia-Herzegovina': 'Bósnia e Herzegovina', Ukraine: 'Ucrânia', Turkey: 'Turquia',
  Greece: 'Grécia', Hungary: 'Hungria', Romania: 'Romênia', Slovakia: 'Eslováquia',
  Slovenia: 'Eslovênia', 'Republic of Ireland': 'Irlanda', Iceland: 'Islândia', Finland: 'Finlândia',
  // África
  Morocco: 'Marrocos', Senegal: 'Senegal', Cameroon: 'Camarões', 'Ivory Coast': 'Costa do Marfim',
  'South Africa': 'África do Sul', Tunisia: 'Tunísia', Egypt: 'Egito', Algeria: 'Argélia',
  Ghana: 'Gana', Nigeria: 'Nigéria', 'Cape Verde Islands': 'Cabo Verde', 'Congo DR': 'RD Congo',
  Mali: 'Mali', 'Burkina Faso': 'Burkina Faso', Angola: 'Angola', Mozambique: 'Moçambique',
  // Ásia / Oceania
  Japan: 'Japão', 'South Korea': 'Coreia do Sul', Iran: 'Irã', 'Saudi Arabia': 'Arábia Saudita',
  Qatar: 'Catar', Iraq: 'Iraque', 'United Arab Emirates': 'Emirados Árabes', Jordan: 'Jordânia',
  Uzbekistan: 'Uzbequistão', Australia: 'Austrália', 'New Zealand': 'Nova Zelândia',
};
const ptNome = (time) => NOMES_PT[time?.name] ?? time?.name ?? '—';

const STAGE_PT = {
  GROUP_STAGE: 'Fase de grupos', LAST_32: '16-avos de final', LAST_16: 'Oitavas de final',
  QUARTER_FINALS: 'Quartas de final', SEMI_FINALS: 'Semifinal', FINAL: 'Final',
  THIRD_PLACE: 'Disputa de 3º lugar', PRELIMINARY_ROUND: 'Preliminar', PLAYOFFS: 'Playoffs',
};
function faseLabel(m) {
  if (m.group) return m.group.replace('GROUP_', 'Grupo ');
  return STAGE_PT[m.stage] ?? m.stage ?? '';
}

const STATUS_MAP = { SCHEDULED: 'NS', TIMED: 'NS', IN_PLAY: 'LIVE', PAUSED: 'HT', FINISHED: 'FT' };
const STATUS_DESC = { NS: 'A jogar', LIVE: 'Ao vivo', HT: 'Intervalo', FT: 'Encerrado' };
const mapStatus = (s) => STATUS_MAP[s] ?? s;

// normaliza nome p/ casar entre as duas APIs (tira acento, minúsculas)
const normalizar = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function posPT(pos) {
  if (!pos) return '';
  if (/goal/i.test(pos)) return 'Goleiro';
  if (/back|defen/i.test(pos)) return 'Defensor';
  if (/midfield/i.test(pos)) return 'Meio-campo';
  if (/wing|forward|strik|offen|attack/i.test(pos)) return 'Atacante';
  return pos;
}

function idade(dob) {
  if (!dob) return null;
  const nasc = new Date(dob);
  const hoje = new Date();
  let i = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) i--;
  return i;
}

// ---------- mapeadores ----------

function mapMatch(m, brazilId) {
  const st = mapStatus(m.status);
  return {
    id: m.id,
    data: m.utcDate,
    status: st,
    statusDescricao: STATUS_DESC[st] ?? m.status,
    estadio: m.venue ?? null,
    cidade: null,
    competicao: m.competition?.name ?? 'Copa do Mundo',
    fase: faseLabel(m),
    mandante: { id: m.homeTeam.id, nome: ptNome(m.homeTeam), escudo: m.homeTeam.crest ?? null, brasil: m.homeTeam.id === brazilId, gols: m.score?.fullTime?.home ?? null },
    visitante: { id: m.awayTeam.id, nome: ptNome(m.awayTeam), escudo: m.awayTeam.crest ?? null, brasil: m.awayTeam.id === brazilId, gols: m.score?.fullTime?.away ?? null },
  };
}

const mapScorer = (s, brazilId) => ({
  jogador: s.player?.name ?? '—',
  foto: s.team?.crest ?? '',
  gols: s.goals ?? 0,
  assistencias: s.assists ?? 0,
  jogos: s.playedMatches ?? 0,
  brasil: s.team?.id === brazilId,
});

// mapeia um jogo do mata-mata (trata seleções ainda indefinidas como "A definir")
function mapMatchBracket(m, brazilId) {
  const time = (t) => ({
    id: t?.id ?? null,
    nome: t?.name ? ptNome(t) : 'A definir',
    brasil: !!t?.id && t.id === brazilId,
    escudo: t?.crest ?? null,
  });
  const st = mapStatus(m.status);
  return {
    id: m.id,
    data: m.utcDate,
    status: st,
    statusDescricao: STATUS_DESC[st] ?? m.status,
    mandante: { ...time(m.homeTeam), gols: m.score?.fullTime?.home ?? null },
    visitante: { ...time(m.awayTeam), gols: m.score?.fullTime?.away ?? null },
  };
}

// Alinha uma rodada do mata-mata à rodada anterior, seguindo o chaveamento:
// o jogo k da próxima fase é alimentado pelo par de jogos (2k, 2k+1) da fase anterior.
// Ancoramos pelos confrontos já definidos (pelo id das seleções) e preenchemos os
// indefinidos ("A definir") nos espaços restantes, preservando a ordem por id.
function alinharRodada(prev, cur) {
  const slots = new Array(cur.length).fill(null);
  const usados = new Set();

  // ids das seleções de cada par da fase anterior (vencedores em potencial)
  const idsPorPar = [];
  for (let i = 0; i < prev.length; i += 2) {
    const ids = new Set();
    [prev[i], prev[i + 1]].filter(Boolean).forEach((j) => {
      [j.mandante, j.visitante].forEach((t) => { if (t?.id) ids.add(t.id); });
    });
    idsPorPar.push(ids);
  }

  // passo 1: encaixa cada jogo já definido no slot do par que o alimentou
  idsPorPar.forEach((ids, slot) => {
    if (slot >= slots.length) return;
    const j = cur.findIndex((m, k) =>
      !usados.has(k) && [m.mandante, m.visitante].some((t) => t?.id && ids.has(t.id)));
    if (j !== -1) { slots[slot] = cur[j]; usados.add(j); }
  });

  // passo 2: preenche os slots vazios com os jogos restantes (em ordem de id)
  const restantes = cur.filter((_, k) => !usados.has(k));
  let r = 0;
  for (let s = 0; s < slots.length && r < restantes.length; s++) {
    if (!slots[s]) slots[s] = restantes[r++];
  }
  return slots.filter(Boolean);
}

const mapStandingRow = (r, brazilId) => ({
  posicao: r.position,
  time: ptNome(r.team),
  timeId: r.team.id,
  escudo: r.team.crest ?? null,
  brasil: r.team.id === brazilId,
  pontos: r.points,
  jogos: r.playedGames,
  vitorias: r.won,
  empates: r.draw,
  derrotas: r.lost,
  golsPro: r.goalsFor,
  golsContra: r.goalsAgainst,
  saldo: r.goalDifference,
});

// elenco vindo da football-data.org (sem foto/número)
const mapPlayer = (p) => ({
  id: p.id,
  nome: p.name,
  idade: idade(p.dateOfBirth),
  numero: p.shirtNumber ?? null,
  posicao: posPT(p.position),
  foto: '',
});

// Correção manual de posição para casos que a API-Football classifica errado
// (pontas rotuladas como meio-campo). Usado quando a football-data não está disponível.
const CORRECAO_POSICAO = {
  'vinicius junior': 'Atacante',
  'raphinha': 'Atacante',
};

// ordena o elenco por setor: goleiros -> defensores -> meio-campos -> atacantes
// (mantém a ordem original dentro de cada setor). Resolve casos como um defensor
// aparecendo depois de um meio-campo.
const ORDEM_SETOR = { Goleiro: 0, Defensor: 1, 'Meio-campo': 2, Atacante: 3 };
const ordenarElenco = (jogadores) =>
  [...jogadores].sort((a, b) => (ORDEM_SETOR[a.posicao] ?? 9) - (ORDEM_SETOR[b.posicao] ?? 9));

// elenco vindo da API-Football (com foto + número da camisa)
const mapPlayerAF = (p) => ({
  id: p.id,
  nome: p.name,
  idade: p.age ?? null,
  numero: p.number ?? null,
  posicao: posPT(p.position),
  foto: p.photo || '',
});

// ---------- acesso à API ----------

// Resolve o ID do Brasil dinamicamente a partir das seleções da Copa (cacheado 1 dia).
async function resolveBrazilId() {
  const data = await apiGet(`/competitions/${worldCupCode}/teams`, {}, CACHE_TTL.meta, 'wc-teams');
  const t = (data.teams || []).find((x) => x.tla === 'BRA' || /brazil|brasil/i.test(x.name));
  return t?.id ?? config.brazilTeamId;
}

// Busca todos os jogos do Brasil na Copa (uma chamada serve várias seções).
async function fetchBrazilMatches(ttl, key) {
  const brazilId = await resolveBrazilId();
  const data = await apiGet(`/teams/${brazilId}/matches`, { competitions: worldCupId }, ttl, key);
  return { brazilId, matches: data.matches || [], cached: data._cached };
}

const golsDoBrasilNoJogo = (m, brazilId) =>
  (m.homeTeam.id === brazilId ? m.score?.fullTime?.home : m.score?.fullTime?.away) ?? 0;

// Mapa { nomeNormalizado -> posiçãoPT } a partir da football-data (posições mais precisas).
async function footballDataPositions() {
  const brazilId = await resolveBrazilId();
  const data = await apiGet(`/teams/${brazilId}`, {}, CACHE_TTL.squad, 'elenco');
  const mapa = {};
  (data.squad || []).forEach((p) => { mapa[normalizar(p.name)] = posPT(p.position); });
  return mapa;
}

// ---------- funções de domínio ----------

export async function proximosJogos() {
  return withDemoFallback(async () => {
    const { brazilId, matches, cached } = await fetchBrazilMatches(CACHE_TTL.fixtures, 'brazil-matches');
    const jogos = matches
      .filter((m) => !['FINISHED', 'CANCELLED', 'AWARDED'].includes(m.status))
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
      .slice(0, 5)
      .map((m) => mapMatch(m, brazilId));
    return { fonte: cached ? 'cache' : 'api', jogos };
  });
}

export async function proximoJogo() {
  return withDemoFallback(async () => {
    const { brazilId, matches } = await fetchBrazilMatches(CACHE_TTL.fixtures, 'brazil-matches');
    const prox = matches
      .filter((m) => !['FINISHED', 'CANCELLED', 'AWARDED'].includes(m.status))
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))[0];
    if (!prox) return { fonte: 'api', jogo: null };

    const jogo = mapMatch(prox, brazilId);
    const advTime = prox.homeTeam.id === brazilId ? prox.awayTeam : prox.homeTeam;
    const adversario = { id: advTime.id, nome: ptNome(advTime), escudo: advTime.crest ?? null };

    // estádio + árbitro (detalhe da partida)
    let estadio = null, arbitro = null;
    try {
      const det = await apiGet(`/matches/${prox.id}`, {}, CACHE_TTL.fixtures, `match-${prox.id}`);
      if (det.venue) estadio = { nome: det.venue };
      arbitro = det.referees?.[0]?.name ?? null;
    } catch { /* opcional */ }

    // imagem do estádio (API-Football, opcional)
    if (estadio && config.apiFootball.key) {
      try {
        const v = await apiSportsGet('/venues', { search: estadio.nome }, CACHE_TTL.squad, `venue-${normalizar(estadio.nome)}`);
        const found = v.response?.[0];
        if (found) { estadio.cidade = found.city; estadio.capacidade = found.capacity; estadio.imagem = found.image; }
      } catch { /* opcional */ }
    }

    return { fonte: 'api', jogo, adversario, estadio, arbitro };
  });
}

export async function resultados() {
  return withDemoFallback(async () => {
    const { brazilId, matches, cached } = await fetchBrazilMatches(CACHE_TTL.results, 'brazil-matches');
    const jogos = matches
      .filter((m) => m.status === 'FINISHED')
      .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
      .slice(0, 5)
      .map((m) => mapMatch(m, brazilId));
    return { fonte: cached ? 'cache' : 'api', jogos };
  });
}

export async function aoVivo() {
  return withDemoFallback(async () => {
    const { brazilId, matches, cached } = await fetchBrazilMatches(CACHE_TTL.live, 'brazil-matches-live');
    const jogos = matches
      .filter((m) => ['IN_PLAY', 'PAUSED'].includes(m.status))
      .map((m) => mapMatch(m, brazilId));
    return { fonte: cached ? 'cache' : 'api', aoVivo: jogos.length > 0, jogos };
  });
}

// Busca os artilheiros da Copa UMA vez, com uma única chave de cache compartilhada
// entre a seção de artilheiros e a de gols da seleção — assim as duas nunca divergem.
// limite alto para capturar todos os brasileiros; depois cada função filtra só o Brasil.
async function fetchScorersBrasil() {
  const brazilId = await resolveBrazilId();
  const data = await apiGet(`/competitions/${worldCupCode}/scorers`, { limit: 300 }, CACHE_TTL.scorers, 'scorers-v2');
  const brasileiros = (data.scorers || [])
    .filter((s) => s.team?.id === brazilId)
    .map((s) => mapScorer(s, brazilId));
  return { brazilId, cached: data._cached, brasileiros };
}

export async function artilheiros() {
  return withDemoFallback(async () => {
    const { cached, brasileiros } = await fetchScorersBrasil();
    return { fonte: cached ? 'cache' : 'api', artilheiros: brasileiros };
  });
}

export async function golsDaSelecao() {
  return withDemoFallback(async () => {
    const { brazilId, matches } = await fetchBrazilMatches(CACHE_TTL.results, 'brazil-matches');
    const totalGols = matches
      .filter((m) => m.status === 'FINISHED')
      .reduce((s, m) => s + golsDoBrasilNoJogo(m, brazilId), 0);
    const { cached, brasileiros } = await fetchScorersBrasil();
    return { fonte: cached ? 'cache' : 'api', totalGols, marcadores: brasileiros };
  });
}

export async function classificacao() {
  return withDemoFallback(async () => {
    const brazilId = await resolveBrazilId();
    const data = await apiGet(`/competitions/${worldCupCode}/standings`, {}, CACHE_TTL.standings, 'standings');
    const totais = (data.standings || []).filter((s) => s.type === 'TOTAL');
    const grupos = totais.map((g) => g.table.map((r) => mapStandingRow(r, brazilId)));
    // coloca o grupo do Brasil em primeiro
    grupos.sort((a, b) => (b.some((r) => r.brasil) ? 1 : 0) - (a.some((r) => r.brasil) ? 1 : 0));
    return { fonte: data._cached ? 'cache' : 'api', grupos };
  });
}

export async function chaveamento() {
  return withDemoFallback(async () => {
    const brazilId = await resolveBrazilId();
    const data = await apiGet(`/competitions/${worldCupCode}/matches`, {}, CACHE_TTL.standings, 'chaveamento');
    const matches = data.matches || [];
    const ORDEM = ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL'];

    // jogos de cada fase, mapeados e ordenados por id (base do chaveamento)
    const porFase = {};
    for (const stage of ORDEM) {
      porFase[stage] = matches
        .filter((m) => m.stage === stage)
        .sort((a, b) => a.id - b.id)
        .map((m) => mapMatchBracket(m, brazilId));
    }

    // Alinha cada rodada à anterior seguindo o vencedor de cada par de confrontos,
    // para que cada card fique na frente do confronto que o originou. A disputa de
    // 3º lugar fica fora dessa cadeia (é jogo único, alimentado pelos perdedores da semi).
    const CADEIA = ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'];
    for (let i = 1; i < CADEIA.length; i++) {
      const prev = porFase[CADEIA[i - 1]];
      const cur = porFase[CADEIA[i]];
      if (prev?.length && cur?.length) porFase[CADEIA[i]] = alinharRodada(prev, cur);
    }

    const fases = ORDEM
      .map((stage) => ({ fase: STAGE_PT[stage] ?? stage, jogos: porFase[stage] }))
      .filter((f) => f.jogos.length > 0);
    return { fonte: data._cached ? 'cache' : 'api', fases };
  });
}

export async function elenco() {
  return withDemoFallback(async () => {
    // Squad (nome, posição, idade) vem da football-data — fonte estável.
    const brazilId = await resolveBrazilId();
    const data = await apiGet(`/teams/${brazilId}`, {}, CACHE_TTL.squad, 'elenco');
    const jogadores = (data.squad || []).map(mapPlayer);

    // Enriquece com a FOTO do TheSportsDB (casando pelo nome). Se falhar, segue sem foto.
    try {
      const fotos = await getFotosBrasil(jogadores.map((j) => j.nome));
      jogadores.forEach((j) => {
        const foto = fotos[normalizar(j.nome)];
        if (foto) j.foto = foto;
      });
    } catch (e) {
      console.warn(`[elenco] fotos indisponíveis: ${e.message}`);
    }

    return { fonte: data._cached ? 'cache' : 'api', jogadores: ordenarElenco(jogadores) };
  });
}
