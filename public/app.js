// ====== Frontend da Seleção · consome o backend em /api/selecao/* ======

const API = '/api/selecao';

// helper de fetch com tratamento de erro.
// cache:'no-store' garante dados sempre frescos no navegador.
// (o cache do servidor continua protegendo o limite da API.)
async function get(path) {
  const res = await fetch(`${API}/${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// formata data ISO -> "13 jun · 16:00"
function fmtData(iso) {
  const d = new Date(iso);
  const dia = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia} · ${hora}`;
}

const STATUS_LABEL = { NS: 'A jogar', FT: 'Encerrado', LIVE: 'Ao vivo', '1H': 'Ao vivo', '2H': 'Ao vivo', HT: 'Intervalo' };
function statusClass(s) {
  if (s === 'FT' || s === 'AET' || s === 'PEN') return 'ft';
  if (['1H', '2H', 'HT', 'LIVE', 'ET'].includes(s)) return 'live';
  return 'ns';
}

// escudo/bandeira de uma seleção (com fallback quando não há imagem)
function crestImg(url, cls = 'mc-crest') {
  return url
    ? `<img class="${cls}" src="${url}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`
    : `<span class="${cls}"></span>`;
}

// cartão de jogo
function matchCard(j, i) {
  const home = j.mandante, away = j.visitante;
  const hbr = home.brasil ? 'br' : '';
  const abr = away.brasil ? 'br' : '';
  const sc = statusClass(j.status);
  const hg = home.gols ?? '–', ag = away.gols ?? '–';
  return `
    <div class="match-card" style="animation-delay:${i * 0.08}s">
      <div class="mc-top">
        <span class="mc-comp">${j.competicao ?? ''}</span>
        <span>${j.fase ?? ''}</span>
      </div>
      <div class="mc-teams">
        <div class="mc-team ${hbr}">${crestImg(home.escudo)}<span class="name">${home.nome}</span><span class="goal">${hg}</span></div>
        <div class="mc-team ${abr}">${crestImg(away.escudo)}<span class="name">${away.nome}</span><span class="goal">${ag}</span></div>
      </div>
      <div class="mc-foot">
        <span>${fmtData(j.data)}</span>
        <span class="badge-status ${sc}">${STATUS_LABEL[j.status] ?? j.status}</span>
      </div>
    </div>`;
}

// ====== carregadores de cada seção ======

// card destaque do próximo jogo (com contagem regressiva)
async function loadProximoJogo() {
  const el = document.getElementById('proximoDestaque');
  try {
    const d = await get('proximo-jogo');
    setFonte(d.fonte);
    if (!d.jogo) { el.innerHTML = '<div class="empty-state">Nenhum jogo agendado no momento.</div>'; return; }
    const j = d.jogo, est = d.estadio;
    const bg = est && est.imagem ? `style="--bg:url('${est.imagem}')"` : '';
    el.innerHTML = `
      <div class="next-card" ${bg}>
        <div class="next-head">
          <span class="next-label">⚽ Próximo jogo</span>
          <span class="next-fase">${j.competicao ?? ''} · ${j.fase ?? ''}</span>
        </div>
        <div class="next-teams">
          <div class="next-team ${j.mandante.brasil ? 'br' : ''}">${crestImg(j.mandante.escudo, 'next-crest')}<span class="next-name">${j.mandante.nome}</span></div>
          <div class="next-vs"><span class="vs">VS</span><span class="next-date">${fmtData(j.data)}</span></div>
          <div class="next-team ${j.visitante.brasil ? 'br' : ''}">${crestImg(j.visitante.escudo, 'next-crest')}<span class="next-name">${j.visitante.nome}</span></div>
        </div>
        <div class="countdown" id="countdown" data-target="${j.data}"></div>
        <div class="next-meta">
          <span>🧑‍⚖️ ${d.arbitro || 'Árbitro a confirmar'}</span>
        </div>
      </div>`;
    startCountdown();
  } catch (e) { el.innerHTML = '<div class="empty-state">Não foi possível carregar o próximo jogo.</div>'; }
}

function cdBox(n, l) { return `<div class="cd-box"><span class="cd-num">${String(n).padStart(2, '0')}</span><span class="cd-lbl">${l}</span></div>`; }

function startCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;
  const target = new Date(el.dataset.target).getTime();
  const tick = () => {
    const diff = target - Date.now();
    if (diff <= 0) { el.innerHTML = '<span class="cd-live">🟢 Bola rolando!</span>'; return; }
    const dias = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.innerHTML = cdBox(dias, 'dias') + cdBox(h, 'horas') + cdBox(m, 'min') + cdBox(s, 'seg');
  };
  tick();
  if (window._cdTimer) clearInterval(window._cdTimer);
  window._cdTimer = setInterval(tick, 1000);
}

async function loadProximos() {
  const el = document.getElementById('proximosJogos');
  try {
    const { jogos } = await get('proximos-jogos');
    const resto = jogos.slice(1); // o primeiro vira o card destaque acima
    el.innerHTML = resto.length ? resto.map(matchCard).join('') : '';
  } catch (e) { el.innerHTML = `<div class="empty-state">Não foi possível carregar os jogos.</div>`; }
}

async function loadResultados() {
  const el = document.getElementById('resultadosGrid');
  try {
    const { jogos } = await get('resultados');
    if (!jogos.length) { el.innerHTML = '<div class="empty-state">Sem resultados recentes.</div>'; return; }
    el.innerHTML = jogos.map(matchCard).join('');
  } catch (e) { el.innerHTML = `<div class="empty-state">Não foi possível carregar os resultados.</div>`; }
}

async function loadGols() {
  const numEl = document.getElementById('golsNumero');
  try {
    const { totalGols } = await get('gols');
    animarNumero(numEl, totalGols);
  } catch (e) { numEl.textContent = '—'; }
}

async function loadArtilheiros() {
  const el = document.getElementById('artilheirosLista');
  try {
    const { artilheiros } = await get('artilheiros');
    if (!artilheiros.length) { el.innerHTML = '<li class="empty-state">Sem dados de artilharia ainda.</li>'; return; }
    el.innerHTML = artilheiros.map((a, i) => `
      <li style="animation-delay:${i * 0.07}s">
        <span class="rank">${i + 1}</span>
        ${a.foto ? `<img class="avatar" src="${a.foto}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">` : '<span class="avatar"></span>'}
        <div class="who"><div class="pname">${a.jogador}</div><div class="pmeta">${a.assistencias} assist. · ${a.jogos} jogos</div></div>
        <div class="tally"><div class="g">${a.gols}</div><div class="gl">gols</div></div>
      </li>`).join('');
  } catch (e) { el.innerHTML = '<li class="empty-state">Não foi possível carregar os artilheiros.</li>'; }
}

async function loadClassificacao() {
  const el = document.getElementById('classificacao');
  try {
    const { grupos } = await get('classificacao');
    if (!grupos.length) { el.innerHTML = '<div class="empty-state">Classificação ainda não disponível.</div>'; return; }
    const linhas = grupos[0].map(r => `
      <tr class="${r.brasil ? 'is-br' : ''}">
        <td><span class="pos">${r.posicao}</span></td>
        <td class="left">${crestImg(r.escudo, 'tbl-crest')}${r.time}</td>
        <td>${r.jogos}</td><td>${r.vitorias}</td><td>${r.empates}</td><td>${r.derrotas}</td>
        <td>${r.golsPro}</td><td>${r.golsContra}</td><td>${r.saldo > 0 ? '+' + r.saldo : r.saldo}</td>
        <td class="pts">${r.pontos}</td>
      </tr>`).join('');
    el.innerHTML = `<table>
      <thead><tr>
        <th>#</th><th class="left">Seleção</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th>
      </tr></thead><tbody>${linhas}</tbody></table>`;
  } catch (e) { el.innerHTML = '<div class="empty-state">Não foi possível carregar a classificação.</div>'; }
}

async function loadElenco() {
  const el = document.getElementById('elencoGrid');
  try {
    const { jogadores } = await get('elenco');
    if (!jogadores.length) { el.innerHTML = '<div class="empty-state">Elenco ainda não divulgado.</div>'; return; }
    const POS = { Goalkeeper: 'Goleiro', Defender: 'Defensor', Midfielder: 'Meio-campo', Attacker: 'Atacante' };
    el.innerHTML = jogadores.map((p, i) => `
      <div class="player-card" style="animation-delay:${i * 0.04}s">
        ${p.numero ? `<span class="num">${p.numero}</span>` : ''}
        ${p.foto ? `<img class="pic" src="${p.foto}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">` : '<span class="pic"></span>'}
        <div class="pn">${p.nome}</div>
        <div class="pp">${POS[p.posicao] ?? p.posicao}</div>
      </div>`).join('');
  } catch (e) { el.innerHTML = '<div class="empty-state">Não foi possível carregar o elenco.</div>'; }
}

// time dentro de um confronto do chaveamento
function bracketTeam(t, vencedorNome) {
  const cls = (t.brasil ? 'br ' : '') + (t.nome === 'A definir' ? 'tbd ' : '') + (vencedorNome && t.nome === vencedorNome ? 'win' : '');
  const escudo = t.escudo ? `<img class="crest" src="${t.escudo}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">` : '<span class="crest"></span>';
  return `<div class="bteam ${cls}">${escudo}<span class="bname">${t.nome}</span><span class="bgol">${t.gols ?? ''}</span></div>`;
}

function vencedor(j) {
  if (j.status !== 'FT' || j.mandante.gols == null || j.visitante.gols == null) return null;
  if (j.mandante.gols > j.visitante.gols) return j.mandante;
  if (j.visitante.gols > j.mandante.gols) return j.visitante;
  return null; // empate (decidido nos pênaltis — não temos esse dado no plano free)
}

function bracketMatch(j) {
  const temBr = j.mandante.brasil || j.visitante.brasil;
  const venc = vencedor(j);
  return `<div class="bmatch ${temBr ? 'has-br' : ''}">
    <span class="m-in"></span>
    <div class="bmatch-card">
      ${bracketTeam(j.mandante, venc?.nome)}
      ${bracketTeam(j.visitante, venc?.nome)}
      <div class="bmatch-foot">${j.status === 'FT' ? 'Encerrado' : fmtData(j.data)}</div>
    </div>
  </div>`;
}

async function loadChaveamento() {
  const el = document.getElementById('bracket');
  try {
    const { fases } = await get('chaveamento');
    if (!fases.length) { el.innerHTML = '<div class="empty-state">Mata-mata ainda não definido.</div>'; return; }

    const ehTerceiro = (f) => /3.*lugar/i.test(f.fase);
    const terceiro = fases.find(ehTerceiro);
    const arvore = fases.filter((f) => !ehTerceiro(f));
    const jogoFinal = arvore[arvore.length - 1]?.jogos?.[0];
    const campeao = jogoFinal ? vencedor(jogoFinal) : null;

    let html = '<div class="bracket-tree">';
    arvore.forEach((f) => {
      html += `<div class="bround"><div class="bround-title">${f.fase}</div><div class="bround-matches">`;
      html += f.jogos.map(bracketMatch).join('');
      html += `</div></div>`;
    });
    // coluna do campeão
    html += `<div class="bround champ-col"><div class="bround-title">Campeão</div><div class="bround-matches">
      <div class="bmatch champ ${campeao && campeao.brasil ? 'has-br' : ''}">
        <span class="m-in"></span>
        <div class="bmatch-card">
          <div class="bteam ${campeao && campeao.brasil ? 'br' : ''} ${!campeao ? 'tbd' : ''}">
            <span class="crest trophy">🏆</span>
            <span class="bname">${campeao ? campeao.nome : 'A definir'}</span>
          </div>
        </div>
      </div></div></div>`;
    html += '</div>';

    if (terceiro && terceiro.jogos[0]) {
      html += `<div class="third-place"><span class="tp-label">Disputa de 3º lugar</span>${bracketMatch(terceiro.jogos[0])}</div>`;
    }
    el.innerHTML = html;
  } catch (e) { el.innerHTML = '<div class="empty-state">Não foi possível carregar o chaveamento.</div>'; }
}

async function loadAoVivo() {
  const banner = document.getElementById('aovivo');
  const content = document.getElementById('liveContent');
  const pill = document.getElementById('statusPill');
  const pillText = document.getElementById('statusText');
  try {
    const { aoVivo, jogos } = await get('ao-vivo');
    if (aoVivo && jogos.length) {
      const j = jogos[0];
      content.innerHTML = `
        <div class="live-score">
          <span class="team">${j.mandante.nome}</span>
          <span class="sc">${j.mandante.gols ?? 0} : ${j.visitante.gols ?? 0}</span>
          <span class="team">${j.visitante.nome}</span>
        </div>
        <div class="live-min">${j.statusDescricao ?? 'em andamento'} · ${j.competicao ?? ''}</div>`;
      banner.classList.remove('hidden');
      pill.classList.add('live'); pill.classList.remove('demo');
      pillText.textContent = 'jogo ao vivo';
    } else {
      banner.classList.add('hidden');
      pill.classList.remove('live');
      pillText.textContent = 'sem jogo agora';
    }
  } catch (e) {
    pillText.textContent = 'offline';
  }
}

// ====== utilidades ======

// anima o número de gols subindo
function animarNumero(el, alvo) {
  const dur = 900; const t0 = performance.now();
  function step(t) {
    const p = Math.min((t - t0) / dur, 1);
    el.textContent = Math.round(p * alvo);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

let fonteJaDefinida = false;
function setFonte(fonte) {
  if (fonteJaDefinida) return;
  fonteJaDefinida = true;
  const el = document.getElementById('footerFonte');
  const pill = document.getElementById('statusPill');
  if (fonte === 'demo') {
    el.textContent = 'modo demonstração'; el.className = 'footer-fonte demo';
    pill.classList.add('demo');
  } else {
    el.textContent = 'dados ao vivo'; el.className = 'footer-fonte api';
  }
}

// arrastar-para-rolar com o mouse (mobile já arrasta com o toque nativamente)
function enableDragScroll(el) {
  let isDown = false, startX = 0, scrollLeft = 0, moved = false;
  el.addEventListener('mousedown', (e) => {
    isDown = true; moved = false;
    startX = e.pageX - el.offsetLeft;
    scrollLeft = el.scrollLeft;
  });
  const stop = () => { isDown = false; el.classList.remove('dragging'); };
  el.addEventListener('mouseleave', stop);
  el.addEventListener('mouseup', stop);
  el.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const x = e.pageX - el.offsetLeft;
    const walk = x - startX;
    if (Math.abs(walk) > 3) { moved = true; el.classList.add('dragging'); }
    if (moved) { e.preventDefault(); el.scrollLeft = scrollLeft - walk; }
  });
  // obs: sem captura da roda do mouse -> o scroll vertical da página
  // continua funcionando normalmente mesmo com o cursor sobre a chave.
}

// ====== boot ======
function init() {
  enableDragScroll(document.getElementById('bracket'));
  loadAoVivo();
  loadProximoJogo();
  loadProximos();
  loadResultados();
  loadGols();
  loadArtilheiros();
  loadClassificacao();
  loadChaveamento();
  loadElenco();
  // atualiza o placar ao vivo a cada 30s (o backend serve do cache; não estoura a API)
  setInterval(loadAoVivo, 30000);
}

document.addEventListener('DOMContentLoaded', init);
