'use strict';

/* ============================================================
   Imaginez, Proposez, Fabriquez — app d'atelier citoyen
   Navigation : menu → exemples / session (5 étapes)
   ============================================================ */

const app = document.getElementById('app');

const STEP_LABELS = ['Ouvrir', 'Découvrir', 'Choisir', 'Décrire', 'Finaliser'];

const state = {
  session: null,
  exampleIndex: null,
};

/* ---------- utilitaires ---------- */

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clearScreen() {
  app.innerHTML = '';
}

function cardFaceEl(def) {
  const c = el('div', 'card face');
  c.style.setProperty('--type-color', CARD_TYPES[def.type].backColor);
  c.innerHTML = `<div class="card-picto">${cardSvg(def, 64)}</div><div class="card-title">${def.title}</div>`;
  return c;
}

function cardBackEl(def) {
  const c = el('div', 'card back');
  c.style.setProperty('--type-color', CARD_TYPES[def.type].backColor);
  c.innerHTML = `<div class="back-type">${CARD_TYPES[def.type].label}</div><div class="back-logo"><img src="assets/logo.png" alt=""></div>`;
  return c;
}

function miniCardEl(def, withRemove) {
  const m = el('div', 'mini-card');
  m.style.setProperty('--type-color', CARD_TYPES[def.type].backColor);
  m.innerHTML = `${cardSvg(def, 22)}<span>${def.title}</span>` + (withRemove ? '<button class="mini-remove" aria-label="Retirer">×</button>' : '');
  return m;
}

function showCardModal(def) {
  const overlay = el('div', 'modal-overlay');
  const card = cardFaceEl(def);
  card.classList.add('card-big');
  overlay.appendChild(card);
  overlay.appendChild(el('div', 'modal-hint', 'Touchez la carte pour fermer'));
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}

function stepsHeader(current) {
  const header = el('div', 'steps-header');
  const home = el('button', 'btn-home', '⌂<span> Menu</span>');
  home.addEventListener('click', () => {
    if (confirm("Quitter la session et revenir au menu ?")) renderMenu();
  });
  header.appendChild(home);
  const steps = el('div', 'steps-track');
  STEP_LABELS.forEach((label, i) => {
    const s = el('div', 'step' + (i + 1 === current ? ' current' : i + 1 < current ? ' done' : ''));
    s.innerHTML = `<span class="step-dot">${i + 1 < current ? '✓' : i + 1}</span><span class="step-label">${label}</span>`;
    steps.appendChild(s);
  });
  header.appendChild(steps);
  return header;
}

/* ---------- gestes : carte (glisser + pincer à deux doigts) ---------- */

function attachCardGestures(node, st, onTap, onMove, onDrop) {
  const pointers = new Map();
  let startX = 0, startY = 0, baseX = 0, baseY = 0, moved = false;
  let pinchBase = 0, pinchBaseScale = 1, pinchMid = null;

  node.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    node.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    node.style.zIndex = String(++cardZ);
    if (pointers.size === 1) {
      startX = e.clientX; startY = e.clientY;
      baseX = st._x; baseY = st._y;
      moved = false;
    } else if (pointers.size === 2) {
      const pts = [...pointers.values()];
      pinchBase = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchBaseScale = st._scale;
      pinchMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    }
  });

  node.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.hypot(dx, dy) > 6) moved = true;
      if (moved) {
        st._x = baseX + dx;
        st._y = baseY + dy;
        applyCardTransform(st);
        if (onMove) onMove();
      }
    } else if (pointers.size === 2) {
      moved = true;
      const pts = [...pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      st._scale = clamp(pinchBaseScale * (dist / (pinchBase || 1)), 0.7, 2.6);
      st._x += mid.x - pinchMid.x;
      st._y += mid.y - pinchMid.y;
      pinchMid = mid;
      applyCardTransform(st);
      if (onMove) onMove();
    }
  });

  const up = (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size === 0) {
      if (!moved && onTap) onTap();
      if (onDrop) onDrop();
    } else if (pointers.size === 1) {
      const [p] = pointers.values();
      startX = p.x; startY = p.y;
      baseX = st._x; baseY = st._y;
      moved = true;
    }
  };
  node.addEventListener('pointerup', up);
  node.addEventListener('pointercancel', up);
}

let cardZ = 10;

function applyCardTransform(st) {
  const node = st.el || st;
  node.style.transform =
    `translate(${st._x}px, ${st._y}px) rotate(${st._rot}deg) scale(${st._scale})`;
}

/* ---------- gestes : paquet (manipuler + découper de droite à gauche en haut) ---------- */

function attachPack(pack, onOpen) {
  let pid = null, sx = 0, sy = 0, cutting = false, canCut = false, progress = 0, done = false;
  const seal = pack.querySelector('.pack-seal');
  const fallen = pack.querySelector('.pack-seal-fallen');
  const cutLine = pack.querySelector('.pack-cut');
  const hint = pack.querySelector('.pack-hint');

  const applyCut = (p) => {
    seal.style.clipPath = `inset(0 ${p * 100}% 0 0)`;
    fallen.style.clipPath = `inset(0 0 0 ${(1 - p) * 100}%)`;
    fallen.style.transform = `translate(${p * 12}px, ${p * 30}px) rotate(${p * 12}deg)`;
    fallen.style.opacity = String(1 - p * 0.55);
    cutLine.style.left = `calc(${(1 - p) * 100}% - 1px)`;
    cutLine.style.opacity = p > 0 && p < 1 ? '1' : '0';
  };

  pack.addEventListener('pointerdown', (e) => {
    if (pid !== null || done) return;
    pid = e.pointerId;
    pack.setPointerCapture(pid);
    sx = e.clientX; sy = e.clientY;
    const rect = pack.getBoundingClientRect();
    canCut = e.clientY - rect.top < rect.height * 0.45;
    cutting = false;
    pack.classList.remove('snap-back');
  });

  pack.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pid || done) return;
    const dx = e.clientX - sx;
    const dy = sy - e.clientY;
    if (!cutting && canCut && dx < -8) cutting = true;
    if (!cutting) {
      pack.style.transform =
        `perspective(900px) rotateY(${clamp(dx * 0.35, -32, 32)}deg) rotateX(${clamp(-dy * 0.3, -16, 16)}deg)`;
    } else {
      progress = clamp(-dx / (pack.offsetWidth * 1.1), 0, 1);
      applyCut(progress);
      if (progress >= 1) {
        done = true;
        pid = null;
        cutLine.style.opacity = '0';
        pack.classList.add('pack-opened');
        if (hint) hint.style.opacity = '0';
        setTimeout(onOpen, 650);
      }
    }
  });

  const up = (e) => {
    if (e.pointerId !== pid) return;
    pid = null;
    if (cutting && !done) {
      cutting = false; progress = 0;
      pack.classList.add('snap-back');
      applyCut(0);
      pack.style.transform = '';
      setTimeout(() => pack.classList.remove('snap-back'), 350);
    }
  };
  pack.addEventListener('pointerup', up);
  pack.addEventListener('pointercancel', up);
}

function packEl(variant) {
  const p = el('div', 'pack' + (variant ? ' pack-' + variant : ''));
  p.innerHTML = `
    <div class="pack-body">
      <img class="pack-logo" src="assets/logo.png" alt="Imaginez, Proposez, Fabriquez">
      <div class="pack-shine"></div>
    </div>
    <div class="pack-seal-fallen"></div>
    <div class="pack-seal"><span>✂ glissez de droite à gauche</span></div>
    <div class="pack-cut"></div>
    <div class="pack-hint">Paquet scellé — découpez en haut, de droite à gauche</div>`;
  return p;
}

/* ============================================================
   ÉCRAN : MENU
   ============================================================ */

function renderMenu() {
  state.session = null;
  state.exampleIndex = null;
  clearScreen();
  const s = el('div', 'screen menu-screen');
  s.appendChild(el('div', 'menu-bg-cards'));

  const logoWrap = el('div', 'menu-logo');
  logoWrap.innerHTML = '<img src="assets/logo.png" alt="Imaginez, Proposez, Fabriquez">';
  s.appendChild(logoWrap);

  s.appendChild(el('p', 'menu-sub', 'Atelier cartes — exprimez votre idée d\'aménagement'));

  const btns = el('div', 'menu-buttons');
  const b1 = el('button', 'btn btn-primary', '<span class="btn-ico">🃏</span> Exemples');
  b1.addEventListener('click', renderExamples);
  const b2 = el('button', 'btn btn-accent', '<span class="btn-ico">✨</span> Lancer la session');
  b2.addEventListener('click', startSession);
  btns.append(b1, b2);
  s.appendChild(btns);

  app.appendChild(s);
}

/* ============================================================
   SESSION
   ============================================================ */

function startSession() {
  const deck = shuffle(CARDS).map((def) => ({
    def,
    selected: false,
    _x: 0, _y: 0, _rot: 0, _scale: 1,
  }));
  state.session = { step: 1, deck, description: '', nom: '', prenom: '', email: '' };
  renderStep1();
}

function setStep(n) {
  state.session.step = n;
}

/* ----- étape 1 : ouvrir le paquet ----- */

function renderStep1() {
  setStep(1);
  clearScreen();
  const s = el('div', 'screen session-screen step1');

  s.appendChild(stepsHeader(1));

  const stage = el('div', 'pack-stage');
  const pack = packEl();
  stage.appendChild(pack);
  s.appendChild(stage);

  s.appendChild(el('div', 'pack-instruction', 'Manipulez le paquet du bout des doigts, puis <b>glissez de droite à gauche en haut du paquet</b> pour le découper.'));

  app.appendChild(s);

  attachPack(pack, () => renderStep2(true));
}

/* ----- étapes 2 & 3 : table de cartes (+ pochette) ----- */

function renderStep2(flyOut) {
  setStep(2);
  clearScreen();
  const sess = state.session;
  const s = el('div', 'screen session-screen step23');

  s.appendChild(stepsHeader(2));

  const table = el('div', 'cards-table');
  s.appendChild(table);

  const footer = el('div', 'session-footer');
  const actionBtn = el('button', 'btn btn-accent', 'Choisir mes cartes');
  footer.appendChild(actionBtn);
  s.appendChild(footer);

  app.appendChild(s);

  const rect = table.getBoundingClientRect();

  /* trois groupes par couleur de dos, ordre aléatoire à l'intérieur */
  const groupDefs = [
    { type: 'quoi', label: 'Quoi' },
    { type: 'ou', label: 'Où' },
    { type: 'qui', label: 'Avec / Pour qui' },
  ];
  const pad = 14;
  const zw = (rect.width - pad * 4) / 3;
  const th = rect.height - 34;

  const groups = groupDefs.map((g) => ({
    ...g,
    cards: shuffle(sess.deck.filter((c) => c.def.type === g.type)),
  }));

  function bestCardSize(nCards) {
    let best = 55;
    for (let c = 1; c <= nCards; c++) {
      const r = Math.ceil(nCards / c);
      const cw = Math.min(zw / c - 10, th / (1.45 * r) - 12);
      if (cw > best) best = cw;
    }
    return best;
  }
  const cardW = clamp(Math.min(...groups.map((g) => bestCardSize(g.cards.length))), 55, 120);
  const cardH = cardW * 1.45;

  groups.forEach((g, gi) => {
    const zoneX = pad + gi * (zw + pad);
    const label = el('div', 'group-label', g.label);
    label.style.left = zoneX + 'px';
    label.style.width = zw + 'px';
    label.style.color = CARD_TYPES[g.type].backColor;
    table.appendChild(label);

    const nCards = g.cards.length;
    const rowsFit = Math.max(1, Math.floor(th / (cardH + 12)));
    const cols = Math.max(1, Math.ceil(nCards / rowsFit));
    const gridW = cols * (cardW + 8) - 8;
    const offsetX = zoneX + (zw - gridW) / 2;

    g.cards.forEach((card, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const jitterX = ((i * 37) % 13) - 6;
      const jitterY = ((i * 53) % 11) - 5;
      card._rot = ((i * 29) % 11) - 5;
      card._scale = 1;
      card._w = cardW; card._h = cardH;
      card._x = offsetX + col * (cardW + 8) + jitterX;
      card._y = 26 + row * (cardH + 12) + jitterY;

      const elCard = cardFaceEl(card.def);
      elCard.style.width = cardW + 'px';
      elCard.style.height = cardH + 'px';
      elCard.style.position = 'absolute';
      elCard.style.left = '0';
      elCard.style.top = '0';
      elCard.style.touchAction = 'none';
      table.appendChild(elCard);
      card.el = elCard;

      attachCardHandlers(card, elCard);

      if (flyOut) {
        elCard.style.transform = `translate(${rect.width / 2 - cardW / 2}px, ${rect.height / 2 - cardH / 2}px) rotate(${((i * 47) % 60) - 30}deg) scale(0.15)`;
        elCard.style.opacity = '0';
        elCard.style.transition = `transform .6s cubic-bezier(.2,.8,.3,1.1) ${i * 28}ms, opacity .25s ${i * 28}ms`;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          elCard.style.opacity = '1';
          applyCardTransform(card);
        }));
        setTimeout(() => { elCard.style.transition = ''; }, 900 + nCards * 28);
      } else {
        applyCardTransform(card);
      }
    });
  });

  /* pochette (étape 3) */
  const pocket = el('div', 'pocket');
  pocket.innerHTML = `
    <div class="pocket-inner">
      <div class="pocket-flap"></div>
      <div class="pocket-title">Ma pochette</div>
      <div class="pocket-count">0 carte</div>
      <div class="pocket-stack"></div>
    </div>`;
  s.appendChild(pocket);

  function updateCount() {
    const count = sess.deck.filter((c) => c.selected).length;
    pocket.querySelector('.pocket-count').textContent = count + (count > 1 ? ' cartes' : ' carte');
  }

  function isOverPocket(card) {
    const pr = pocket.getBoundingClientRect();
    const cx = card._x + card._w / 2;
    const cy = card._y + card._h / 2;
    return cx > pr.left && cx < pr.right && cy > pr.top && cy < pr.bottom;
  }

  function selectCard(card) {
    if (card.selected || !card.el) return;
    card.selected = true;
    const pr = pocket.getBoundingClientRect();
    card.el.style.transition = 'transform .28s ease-in, opacity .28s';
    card.el.style.transform = `translate(${pr.left + pr.width / 2 - card._w / 2}px, ${pr.top + pr.height * 0.45 - card._h / 2}px) rotate(0deg) scale(0.2)`;
    card.el.style.opacity = '0';
    setTimeout(() => {
      card.el.remove();
      card.el = null;
      rebuildPocketStack();
      updateCount();
    }, 260);
    updateCount();
  }

  function unselectCard(card) {
    if (card.el) return;
    card.selected = false;
    rebuildPocketStack();
    updateCount();
    card._scale = 1;
    const free = findFreeSpot(card);
    card._x = free.x; card._y = free.y;
    mountCardOnTable(card);
    applyCardTransform(card);
  }

  function rebuildPocketStack() {
    const stack = pocket.querySelector('.pocket-stack');
    stack.innerHTML = '';
    sess.deck.filter((c) => c.selected).forEach((c) => {
      const mini = miniCardEl(c.def, true);
      mini.querySelector('.mini-remove').addEventListener('click', (ev) => {
        ev.stopPropagation();
        unselectCard(c);
      });
      stack.appendChild(mini);
    });
  }

  function mountCardOnTable(card) {
    const elCard = cardFaceEl(card.def);
    elCard.style.width = card._w + 'px';
    elCard.style.height = card._h + 'px';
    elCard.style.position = 'absolute';
    elCard.style.touchAction = 'none';
    table.appendChild(elCard);
    card.el = elCard;
    attachCardHandlers(card, elCard);
  }

  function attachCardHandlers(card, elCard) {
    attachCardGestures(
      elCard,
      card,
      () => showCardModal(card.def),
      () => {
        if (state.session.step === 3) pocket.classList.toggle('over', isOverPocket(card));
      },
      () => {
        pocket.classList.remove('over');
        if (state.session.step === 3 && isOverPocket(card)) selectCard(card);
      }
    );
  }

  function findFreeSpot(card) {
    const gi = groupDefs.findIndex((g) => g.type === card.def.type);
    const zoneX = pad + Math.max(0, gi) * (zw + pad);
    return { x: zoneX + zw / 2 - card._w / 2, y: th / 2 - card._h / 2 };
  }

  actionBtn.addEventListener('click', () => {
    if (state.session.step === 2) {
      setStep(3);
      pocket.classList.add('open');
      actionBtn.textContent = 'Mon choix est fait';
      actionBtn.classList.add('pulse');
      updateStepHeader(s, 3);
    } else {
      const count = sess.deck.filter((c) => c.selected).length;
      if (count === 0) {
        actionBtn.classList.add('shake');
        setTimeout(() => actionBtn.classList.remove('shake'), 500);
        return;
      }
      renderStep4();
    }
  });

  updateCount();
}

function updateStepHeader(screenEl, current) {
  const old = screenEl.querySelector('.steps-header');
  if (old) old.replaceWith(stepsHeader(current));
}

/* ----- étape 4 : décrire son idée ----- */

function renderStep4() {
  setStep(4);
  clearScreen();
  const sess = state.session;
  const s = el('div', 'screen session-screen step4');
  s.appendChild(stepsHeader(4));

  const sel = sess.deck.filter((c) => c.selected);

  const strip = el('div', 'selected-strip');
  sel.forEach((card) => {
    const t = el('button', 'thumb');
    t.style.setProperty('--type-color', CARD_TYPES[card.def.type].backColor);
    t.innerHTML = `${cardSvg(card.def, 34)}<span>${card.def.title}</span>`;
    t.addEventListener('click', () => showCardModal(card.def));
    strip.appendChild(t);
  });
  s.appendChild(strip);

  s.appendChild(el('div', 'step4-title', 'Décrivez votre idée'));

  const ta = el('textarea', 'idea-input');
  ta.placeholder = 'Expliquez votre projet : que souhaitez-vous ? où ? avec et pour qui ?…';
  ta.value = sess.description;
  ta.addEventListener('input', () => { sess.description = ta.value; });
  s.appendChild(ta);

  const footer = el('div', 'session-footer');
  const btn = el('button', 'btn btn-accent', 'Continuer');
  btn.addEventListener('click', () => renderStep5());
  footer.appendChild(btn);
  s.appendChild(footer);

  app.appendChild(s);
}

/* ----- étape 5 : finaliser ----- */

function renderStep5() {
  setStep(5);
  clearScreen();
  const sess = state.session;
  const s = el('div', 'screen session-screen step5');
  s.appendChild(stepsHeader(5));

  const sel = sess.deck.filter((c) => c.selected);

  const recap = el('div', 'recap');
  recap.appendChild(el('h2', '', 'Récapitulatif de votre choix'));
  ['quoi', 'ou', 'qui'].forEach((t) => {
    const cards = sel.filter((c) => c.def.type === t);
    if (cards.length) {
      const line = el('div', 'recap-line');
      line.innerHTML = `<span class="recap-type" style="background:${CARD_TYPES[t].backColor}">${CARD_TYPES[t].label}</span> ${cards.map((c) => c.def.title).join(' · ')}`;
      recap.appendChild(line);
    }
  });
  const descLine = el('div', 'recap-desc', sess.description ? '« ' + sess.description + ' »' : '<em>Aucune description saisie</em>');
  recap.appendChild(descLine);
  s.appendChild(recap);

  const form = el('div', 'final-form');
  form.appendChild(el('p', 'form-note', 'Renseignez vos coordonnées si vous le souhaitez (facultatif) :'));
  const row = el('div', 'form-row');
  const nom = el('input', 'field'); nom.placeholder = 'Nom'; nom.value = sess.nom;
  const prenom = el('input', 'field'); prenom.placeholder = 'Prénom'; prenom.value = sess.prenom;
  row.append(nom, prenom);
  const email = el('input', 'field field-wide'); email.type = 'email'; email.placeholder = 'Adresse mail'; email.value = sess.email;
  nom.addEventListener('input', () => sess.nom = nom.value);
  prenom.addEventListener('input', () => sess.prenom = prenom.value);
  email.addEventListener('input', () => sess.email = email.value);
  form.append(row, email);
  s.appendChild(form);

  const footer = el('div', 'session-footer');
  const back = el('button', 'btn btn-ghost', '← Modifier');
  back.addEventListener('click', () => renderStep4());
  const save = el('button', 'btn btn-accent', '💾 Enregistrer mon projet');
  save.addEventListener('click', () => {
    try {
      const blob = buildXlsx(buildProjectRows(sess));
      const d = new Date();
      const pad = (x) => String(x).padStart(2, '0');
      const fname = `projet_atelier_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fname;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      showSavedScreen();
    } catch (err) {
      alert("Une erreur est survenue lors de la génération du fichier : " + err.message);
    }
  });
  footer.append(back, save);
  s.appendChild(footer);

  app.appendChild(s);
}

function showSavedScreen() {
  clearScreen();
  const s = el('div', 'screen saved-screen');
  s.innerHTML = `
    <div class="saved-card">
      <div class="saved-check">✔</div>
      <h1>Projet enregistré !</h1>
      <p>Le fichier XLSX a été généré et téléchargé sur l'appareil.</p>
      <p class="saved-sub">Merci d'avoir participé à l'atelier.</p>
    </div>`;
  app.appendChild(s);
  setTimeout(renderMenu, 3000);
}

/* ============================================================
   ÉCRANS : EXEMPLES
   ============================================================ */

function renderExamples() {
  state.exampleIndex = null;
  clearScreen();
  const s = el('div', 'screen examples-screen');

  const header = el('div', 'examples-header');
  const back = el('button', 'btn btn-ghost', '← Retour');
  back.addEventListener('click', renderMenu);
  header.append(back, el('h1', '', 'Choisissez un paquet d\'exemples'));
  s.appendChild(header);

  const grid = el('div', 'examples-grid');
  EXAMPLES.forEach((ex, i) => {
    const item = el('div', 'example-item');
    const p = packEl('small');
    p.addEventListener('click', () => renderExampleDetail(i));
    const lbl = el('div', 'example-label', ex.label);
    item.append(p, lbl);
    grid.appendChild(item);
  });
  s.appendChild(grid);
  app.appendChild(s);
}

function renderExampleDetail(index) {
  state.exampleIndex = index;
  const ex = EXAMPLES[index];
  clearScreen();
  const s = el('div', 'screen example-detail');

  const header = el('div', 'examples-header');
  const back = el('button', 'btn btn-ghost', '← Retour');
  back.addEventListener('click', renderExamples);
  header.append(back, el('h1', '', ex.label + ' — paquet scellé'));
  s.appendChild(header);

  const stage = el('div', 'pack-stage pack-stage-example');
  const pack = packEl('example');
  stage.appendChild(pack);
  s.appendChild(stage);
  s.appendChild(el('div', 'pack-instruction', 'Sélectionnez ce paquet puis <b>glissez de droite à gauche en haut du paquet</b> pour découvrir le projet.'));

  app.appendChild(s);
  attachPack(pack, () => openExample(index));
}

function openExample(index) {
  const ex = EXAMPLES[index];
  clearScreen();
  const s = el('div', 'screen example-open');

  const header = el('div', 'examples-header');
  const back = el('button', 'btn btn-ghost', '← Retour');
  back.addEventListener('click', renderExamples);
  header.append(back);
  s.appendChild(header);

  s.appendChild(el('h1', 'example-title', ex.title));

  const body = el('div', 'example-body');
  const cardsArea = el('div', 'example-cards');
  const desc = el('div', 'example-desc');
  desc.innerHTML = `<div class="example-desc-title">Le projet</div><p>${ex.description}</p>`;
  body.append(cardsArea, desc);
  s.appendChild(body);
  app.appendChild(s);

  const defs = shuffle(ex.cards.map(cardByTitle).filter(Boolean));
  const rect = cardsArea.getBoundingClientRect();
  const n = defs.length;
  const perRow = Math.min(3, n);
  const rows = Math.ceil(n / perRow);
  const cardW = clamp(Math.min(rect.width / (perRow + 0.4) - 12, (rect.height / (rows + 0.3) - 12) / 1.45), 70, 150);
  const cardH = cardW * 1.45;

  defs.forEach((def, i) => {
    const col = i % perRow, row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, n - row * perRow);
    const cellW = rect.width / perRow;
    const cellH = rect.height / rows;
    const fx = (col + 0.5) * cellW - cardW / 2 + (row * 13 % 10) - 5;
    const fy = (row + 0.5) * cellH - cardH / 2 + ((i * 29) % 10) - 5;
    const rot = ((i * 31) % 9) - 4;

    const c = cardFaceEl(def);
    c.style.width = cardW + 'px';
    c.style.height = cardH + 'px';
    c.style.position = 'absolute';
    c.style.left = '0'; c.style.top = '0';
    c._x = fx; c._y = fy; c._rot = rot; c._scale = 1;
    applyCardTransform(c);

    c.style.transform = `translate(${rect.width / 2 - cardW / 2}px, ${rect.height / 2 - cardH / 2}px) rotate(0) scale(0.15)`;
    c.style.opacity = '0';
    c.style.transition = `transform .5s cubic-bezier(.2,.8,.3,1.1) ${i * 90}ms, opacity .3s ${i * 90}ms`;
    cardsArea.appendChild(c);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      c.style.opacity = '1';
      applyCardTransform(c);
    }));
    setTimeout(() => {
      c.style.transition = '';
      attachCardGestures(c, c, () => showCardModal(def));
    }, 600 + n * 90);
  });
}

/* ---------- démarrage ---------- */

renderMenu();
