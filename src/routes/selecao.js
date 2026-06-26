import { Router } from 'express';
import * as service from '../services/selecaoService.js';
import { getApiCallCount } from '../services/footballData.js';
import { usingRedis } from '../services/cache.js';
import { config } from '../config.js';

const router = Router();

// Pequeno wrapper para não repetir try/catch em toda rota.
const handle = (fn) => async (req, res) => {
  try {
    const data = await fn(req);
    res.json({ ok: true, ...data });
  } catch (err) {
    console.error(`[erro] ${req.path}:`, err.message);
    res.status(502).json({ ok: false, erro: err.message });
  }
};

router.get('/proximos-jogos', handle(() => service.proximosJogos()));
router.get('/proximo-jogo', handle(() => service.proximoJogo()));
router.get('/resultados', handle(() => service.resultados()));
router.get('/ao-vivo', handle(() => service.aoVivo()));
router.get('/artilheiros', handle(() => service.artilheiros()));
router.get('/gols', handle(() => service.golsDaSelecao()));
router.get('/classificacao', handle(() => service.classificacao()));
router.get('/chaveamento', handle(() => service.chaveamento()));
router.get('/elenco', handle(() => service.elenco()));

// Status / saúde do backend — útil para você acompanhar o consumo da API.
router.get('/status', (req, res) => {
  res.json({
    ok: true,
    modo: config.demoMode ? 'DEMO (sem chave da API)' : 'PRODUÇÃO',
    provedor: 'football-data.org',
    cache: usingRedis ? 'redis (compartilhado)' : 'memoria (local)',
    chamadasReais: getApiCallCount(),
  });
});

export default router;
