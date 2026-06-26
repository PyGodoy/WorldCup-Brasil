import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 3333,

  // football-data.org (plano free cobre a Copa do Mundo: jogos, classificação, artilheiros)
  footballData: {
    key: process.env.FOOTBALL_DATA_KEY || '',
    baseUrl: 'https://api.football-data.org/v4',
  },

  // API-Football: usada SÓ no elenco, porque fornece foto + número da camisa (opcional).
  apiFootball: {
    key: process.env.API_FOOTBALL_KEY || '',
    host: process.env.API_FOOTBALL_HOST || 'v3.football.api-sports.io',
    brazilTeamId: Number(process.env.API_FOOTBALL_BRAZIL_ID) || 6,
  },

  // Código da Copa do Mundo na football-data.org
  worldCupCode: process.env.WORLD_CUP_CODE || 'WC',
  worldCupId: Number(process.env.WORLD_CUP_ID) || 2000,

  // ID do Brasil é resolvido dinamicamente pela API; este é só o fallback/override.
  brazilTeamId: Number(process.env.BRAZIL_TEAM_ID) || 764,

  // true quando não há chave -> usamos dados mockados para o site rodar de cara
  get demoMode() {
    return !this.footballData.key;
  },
};

// Tempo de vida do cache (segundos) por tipo de dado.
// É AQUI que você controla o consumo da API (free = ~10 req/min). Independe de visitantes.
export const CACHE_TTL = {
  live: 30,          // placar ao vivo: 30s
  fixtures: 600,     // próximos jogos: 10min
  results: 600,      // resultados: 10min
  standings: 600,    // classificação: 10min
  scorers: 600,      // artilheiros: 10min
  squad: 86400,      // elenco: 1 dia
  meta: 86400,       // id do time, etc.: 1 dia
};
