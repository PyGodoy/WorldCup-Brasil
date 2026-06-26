// Dados de exemplo (MODO DEMO) já no formato final que o frontend consome.
// Usados quando não há chave da API ou quando um recurso não está disponível.

export const mockProximosJogos = {
  jogos: [
    { id: 1001, data: '2026-06-29T19:00:00Z', status: 'NS', statusDescricao: 'A jogar', estadio: 'SoFi Stadium', cidade: null, competicao: 'Copa do Mundo', fase: 'Oitavas de final',
      mandante: { id: 764, nome: 'Brasil', brasil: true, gols: null }, visitante: { id: 773, nome: 'França', brasil: false, gols: null } },
  ],
};

export const mockProximoJogo = {
  jogo: {
    id: 537423, data: '2026-06-29T17:00:00Z', status: 'NS', statusDescricao: 'A jogar', competicao: 'Copa do Mundo', fase: '16-avos de final',
    mandante: { id: 764, nome: 'Brasil', escudo: null, brasil: true, gols: null },
    visitante: { id: 766, nome: 'Japão', escudo: null, brasil: false, gols: null },
  },
  adversario: { id: 766, nome: 'Japão', escudo: null },
  estadio: { nome: 'MetLife Stadium', cidade: 'East Rutherford', capacidade: 82500, imagem: '' },
  arbitro: 'A definir',
};

export const mockResultados = {
  jogos: [
    { id: 999, data: '2026-06-23T22:00:00Z', status: 'FT', statusDescricao: 'Encerrado', estadio: null, cidade: null, competicao: 'Copa do Mundo', fase: 'Grupo G',
      mandante: { id: 764, nome: 'Brasil', brasil: true, gols: 4 }, visitante: { id: 805, nome: 'Sérvia', brasil: false, gols: 1 } },
    { id: 998, data: '2026-06-18T19:00:00Z', status: 'FT', statusDescricao: 'Encerrado', estadio: null, cidade: null, competicao: 'Copa do Mundo', fase: 'Grupo G',
      mandante: { id: 799, nome: 'Croácia', brasil: false, gols: 0 }, visitante: { id: 764, nome: 'Brasil', brasil: true, gols: 2 } },
  ],
};

export const mockAoVivo = { aoVivo: false, jogos: [] };

export const mockArtilheiros = {
  artilheiros: [
    { jogador: 'Vinícius Júnior', foto: '', gols: 5, assistencias: 2, jogos: 4, brasil: true },
    { jogador: 'Neymar', foto: '', gols: 4, assistencias: 3, jogos: 4, brasil: true },
    { jogador: 'Raphinha', foto: '', gols: 2, assistencias: 1, jogos: 4, brasil: true },
  ],
};

export const mockGols = {
  totalGols: 11,
  marcadores: [
    { jogador: 'Vinícius Júnior', foto: '', gols: 5, assistencias: 2, jogos: 4, brasil: true },
    { jogador: 'Neymar', foto: '', gols: 4, assistencias: 3, jogos: 4, brasil: true },
    { jogador: 'Raphinha', foto: '', gols: 2, assistencias: 1, jogos: 4, brasil: true },
  ],
};

export const mockClassificacao = {
  grupos: [[
    { posicao: 1, time: 'Brasil', timeId: 764, brasil: true, pontos: 9, jogos: 3, vitorias: 3, empates: 0, derrotas: 0, golsPro: 8, golsContra: 2, saldo: 6 },
    { posicao: 2, time: 'Sérvia', timeId: 805, brasil: false, pontos: 4, jogos: 3, vitorias: 1, empates: 1, derrotas: 1, golsPro: 3, golsContra: 3, saldo: 0 },
    { posicao: 3, time: 'Croácia', timeId: 799, brasil: false, pontos: 3, jogos: 3, vitorias: 1, empates: 0, derrotas: 2, golsPro: 2, golsContra: 3, saldo: -1 },
    { posicao: 4, time: 'Camarões', timeId: 805, brasil: false, pontos: 1, jogos: 3, vitorias: 0, empates: 1, derrotas: 2, golsPro: 1, golsContra: 6, saldo: -5 },
  ]],
};

export const mockChaveamento = {
  fases: [
    { fase: 'Oitavas de final', jogos: [
      { id: 2001, data: '2026-06-29T17:00:00Z', status: 'NS', statusDescricao: 'A jogar',
        mandante: { id: 764, nome: 'Brasil', brasil: true, escudo: null, gols: null },
        visitante: { id: 766, nome: 'Japão', brasil: false, escudo: null, gols: null } },
      { id: 2002, data: '2026-06-30T17:00:00Z', status: 'NS', statusDescricao: 'A jogar',
        mandante: { id: 773, nome: 'França', brasil: false, escudo: null, gols: null },
        visitante: { id: 765, nome: 'Portugal', brasil: false, escudo: null, gols: null } },
    ] },
    { fase: 'Quartas de final', jogos: [
      { id: 2101, data: '2026-07-04T17:00:00Z', status: 'NS', statusDescricao: 'A jogar',
        mandante: { id: null, nome: 'A definir', brasil: false, escudo: null, gols: null },
        visitante: { id: null, nome: 'A definir', brasil: false, escudo: null, gols: null } },
    ] },
    { fase: 'Final', jogos: [
      { id: 2301, data: '2026-07-19T19:00:00Z', status: 'NS', statusDescricao: 'A jogar',
        mandante: { id: null, nome: 'A definir', brasil: false, escudo: null, gols: null },
        visitante: { id: null, nome: 'A definir', brasil: false, escudo: null, gols: null } },
    ] },
  ],
};

export const mockElenco = {
  jogadores: [
    { id: 10, nome: 'Alisson', idade: 33, numero: 1, posicao: 'Goleiro', foto: '' },
    { id: 11, nome: 'Marquinhos', idade: 32, numero: 4, posicao: 'Defensor', foto: '' },
    { id: 12, nome: 'Bruno Guimarães', idade: 28, numero: 8, posicao: 'Meio-campo', foto: '' },
    { id: 1, nome: 'Vinícius Júnior', idade: 25, numero: 7, posicao: 'Atacante', foto: '' },
    { id: 2, nome: 'Raphinha', idade: 29, numero: 11, posicao: 'Atacante', foto: '' },
    { id: 3, nome: 'Neymar', idade: 33, numero: 10, posicao: 'Atacante', foto: '' },
  ],
};
