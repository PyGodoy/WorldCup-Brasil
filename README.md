<div align="center">

# 🇧🇷 Rumo ao Hexa — Seleção Brasileira na Copa 2026

### Site com informações em tempo real da Seleção Brasileira na Copa do Mundo FIFA 2026

Próximos jogos · placar ao vivo · gols · artilheiros · classificação · mata-mata · elenco

![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## 📋 Sobre

Aplicação **full-stack** (backend Node/Express + frontend em HTML/CSS/JS puro) que reúne, em
um só lugar, tudo sobre a campanha do Brasil na Copa do Mundo 2026 — com **dados reais e
atualizados** consumidos de APIs públicas gratuitas, protegidas por uma camada de **cache**
que mantém o consumo baixo mesmo com muitos visitantes.

> ⚠️ Projeto pessoal, **não-oficial**, sem qualquer vínculo com a CBF ou a FIFA.

## ✨ Funcionalidades

- ⚽ **Próximo jogo** em destaque, com **contagem regressiva ao vivo**, estádio e árbitro
- 🔴 **Placar ao vivo** (atualiza sozinho enquanto o Brasil joga)
- 🥅 **Total de gols** da seleção no torneio
- 👟 **Artilheiros** brasileiros (gols e assistências)
- 📊 **Classificação** do grupo (com escudos e destaque pro Brasil)
- 🏆 **Chaveamento do mata-mata** — chave conectada, arrastável, das 16-avos à final
- 📅 **Últimos resultados**
- 👥 **Elenco convocado** com foto, número e posição
- 🟢 **Modo demo automático** — sem chave de API, o site roda com dados de exemplo

## 🛠️ Tecnologias

| Camada | Stack |
|---|---|
| **Backend** | Node.js, Express, [node-cache](https://www.npmjs.com/package/node-cache), dotenv |
| **Frontend** | HTML5, CSS3 (sem framework), JavaScript puro (ES Modules) |
| **Fontes de dados** | [football-data.org](https://www.football-data.org/) · [API-Football](https://www.api-football.com/) |

## 📡 Fontes de dados (APIs gratuitas)

| API | Uso no projeto | Plano |
|---|---|---|
| **football-data.org** | Jogos, resultados, classificação, artilheiros, mata-mata | Grátis (Copa do Mundo incluída, ~10 req/min) |
| **API-Football** | Elenco (foto + número) e imagem dos estádios | Grátis (opcional) |

## 🚀 Como rodar localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) 18 ou superior

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/copadomundo.git
cd copadomundo

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
#   abra o .env e cole sua chave (veja abaixo como obter)

# 4. Inicie o servidor
npm start
```

Acesse **http://localhost:3333** 🎉

> Sem chave configurada, o site sobe em **modo demo** com dados de exemplo.

### 🔑 Como obter as chaves (grátis)

| Chave | Onde pegar | Obrigatória? |
|---|---|---|
| `FOOTBALL_DATA_KEY` | [football-data.org/client/register](https://www.football-data.org/client/register) 
| `API_FOOTBALL_KEY` | [api-football.com](https://www.api-football.com/)

### ⚙️ Variáveis de ambiente (`.env`)

```env
FOOTBALL_DATA_KEY=sua_chave_aqui
API_FOOTBALL_KEY=sua_chave_opcional
PORT=3333
WORLD_CUP_CODE=WC
WORLD_CUP_ID=2000
BRAZIL_TEAM_ID=764
```

## 🔌 Endpoints da API

Base: `/api/selecao`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/proximo-jogo` | Próximo jogo em destaque (estádio, árbitro, contagem) |
| GET | `/proximos-jogos` | Lista dos próximos jogos |
| GET | `/resultados` | Últimos resultados |
| GET | `/ao-vivo` | Jogo ao vivo (placar) |
| GET | `/gols` | Total de gols da seleção |
| GET | `/artilheiros` | Artilheiros brasileiros |
| GET | `/classificacao` | Classificação dos grupos |
| GET | `/chaveamento` | Chave do mata-mata |
| GET | `/elenco` | Elenco convocado |
| GET | `/status` | Saúde do backend (modo, nº de chamadas) |

Toda resposta traz `"fonte"`: `api` (dado fresco), `cache` (reuso) ou `demo` (exemplo).

## 🏗️ Arquitetura & cache

O número de visitantes **não** aumenta o consumo das APIs: o backend chama a API em
intervalos fixos e guarda o resultado em cache; todos os visitantes leem dessa cópia.

```
Visitantes → (CDN opcional) → Backend (cache em memória) → APIs externas
  10 mil          serve do cache       chama em intervalo fixo   poucas req
```

Os tempos de cache ficam em `src/config.js` (`CACHE_TTL`). Quando uma API falha ou um
recurso não está disponível no plano grátis, o backend **cai automaticamente nos dados
demo**, então o site nunca quebra.

## 📂 Estrutura

```
copadomundo/
├── public/                  # frontend (site)
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── src/
│   ├── server.js            # app Express + arquivos estáticos
│   ├── config.js            # configs + TTLs do cache
│   ├── routes/
│   │   └── selecao.js       # rotas /api/selecao/*
│   └── services/
│       ├── footballData.js  # cliente football-data.org + cache
│       ├── apiSports.js     # cliente API-Football (elenco/estádio)
│       ├── selecaoService.js# regras de negócio + mapeadores
│       └── mockData.js      # dados de exemplo (modo demo)
├── .env.example
└── package.json
```

## ⚠️ Limitações do plano gratuito

Não estão disponíveis sem plano pago: escalações por jogo, gols com minuto, cartões,
substituições, estatísticas avançadas (xG), odds e confronto direto (head-to-head).

## 👨‍💻 Autor

Desenvolvido por **Mikaell Godoy**

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais detalhes.
