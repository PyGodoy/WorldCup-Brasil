import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import selecaoRoutes from './routes/selecao.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
app.use(express.json());

// Serve o frontend (site) da pasta /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// Cabeçalho de cache: a CDN (Cloudflare/Vercel) e o navegador podem reutilizar a resposta,
// reduzindo ainda mais a carga no seu backend mesmo com milhares de visitantes.
app.use('/api', (req, res, next) => {
  // cache curto no navegador/CDN; o cache em memória do servidor é quem protege o limite da API.
  const isLive = req.path.includes('ao-vivo');
  res.set('Cache-Control', `public, max-age=${isLive ? 15 : 60}`);
  next();
});

app.use('/api/selecao', selecaoRoutes);

// Lista os endpoints disponíveis (a raiz "/" agora serve o site em public/index.html).
app.get('/api', (req, res) => {
  res.json({
    projeto: 'Seleção Brasileira - Copa do Mundo 2026',
    modo: config.demoMode ? 'DEMO (sem chave da API)' : 'PRODUÇÃO',
    endpoints: [
      'GET /api/selecao/proximos-jogos',
      'GET /api/selecao/resultados',
      'GET /api/selecao/ao-vivo',
      'GET /api/selecao/artilheiros',
      'GET /api/selecao/gols',
      'GET /api/selecao/classificacao',
      'GET /api/selecao/elenco',
      'GET /api/selecao/status',
    ],
  });
});

app.listen(config.port, () => {
  console.log(`\n  🟢 Backend Copa do Mundo rodando em http://localhost:${config.port}`);
  console.log(`  Modo: ${config.demoMode ? 'DEMO (dados de exemplo — sem chave da API)' : 'PRODUÇÃO (API-Football)'}`);
  console.log(`  Teste: http://localhost:${config.port}/api/selecao/proximos-jogos\n`);
});
