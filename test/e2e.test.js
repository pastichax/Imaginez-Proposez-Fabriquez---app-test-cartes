const fs = require('fs');
const { JSDOM } = require('jsdom');

const path = require('path');
const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(ROOT + '/index.html', 'utf8');

const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true });
const w = dom.window;
const d = w.document;

w.TextEncoder = require('util').TextEncoder;
w.TextDecoder = require('util').TextDecoder;
w.URL.createObjectURL = (blob) => { savedBlobs.push(blob); return 'blob:fake-' + Math.random(); };
w.URL.revokeObjectURL = () => {};
w.Element.prototype.setPointerCapture = function () {};
w.Element.prototype.releasePointerCapture = function () {};
w.Element.prototype.getBoundingClientRect = function () {
  return { left: 0, top: 0, right: 1000, bottom: 600, width: 1000, height: 600, x: 0, y: 0 };
};
let savedBlobs = [];
w.HTMLAnchorElement.prototype.click = function () {};

let pass = 0, fail = 0;
function ok(cond, label) {
  console.log((cond ? 'PASS' : 'FAIL') + ' - ' + label);
  cond ? pass++ : fail++;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function ptr(el, type, x, y, id = 1) {
  const e = new w.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y });
  Object.defineProperty(e, 'pointerId', { value: id });
  Object.defineProperty(e, 'pointerType', { value: 'touch' });
  el.dispatchEvent(e);
}

(async () => {
  const all = ['cards.js', 'xlsx.js', 'app.js']
    .map((f) => fs.readFileSync(ROOT + '/js/' + f, 'utf8'))
    .join('\n;\n') + '\n;window.__T = { CARDS, EXAMPLES, PICTOS, state, buildXlsx };';
  w.eval(all);
  const T = w.__T;

  ok(d.querySelector('.menu-screen') !== null, 'menu affiché');
  ok(d.querySelector('.menu-logo img') !== null, 'logo sur le menu');
  ok(T.CARDS.length === 29, '29 cartes définies');
  ok(T.CARDS.filter((c) => c.type === 'quoi').length === 11, '11 cartes Quoi');
  ok(T.CARDS.filter((c) => c.type === 'ou').length === 8, '8 cartes Où');
  ok(T.CARDS.filter((c) => c.type === 'qui').length === 10, '10 cartes Avec/Pour qui');
  ok(T.EXAMPLES.length === 3, '3 exemples définis');
  ok(T.CARDS.every((c) => T.PICTOS[c.title]), 'chaque carte a un pictogramme');

  // session
  [...d.querySelectorAll('.menu-buttons .btn')].find((b) => b.textContent.includes('Lancer la session')).click();
  ok(d.querySelector('.step1') !== null, 'étape 1 atteinte');
  const pack = d.querySelector('.pack');
  ok(pack !== null, 'paquet scellé affiché');
  ok(d.querySelector('.pack-topline:not(.half)') !== null, 'ligne brillante de découpe');
  ok(d.querySelector('.pack-top-flap') !== null, 'partie supérieure au-dessus de la ligne');
  ok(d.querySelector('.pack-seal') === null && d.querySelector('.pack-hint') === null, 'ni bande hachurée ni consigne sur le paquet');

  // manipulation sans ouverture
  ptr(pack, 'pointerdown', 500, 300);
  ptr(pack, 'pointermove', 540, 300);
  ptr(pack, 'pointerup', 540, 300);
  ok(d.querySelector('.step1') !== null, 'paquet manipulé sans ouverture');

  // découpe de droite à gauche en haut du paquet
  ptr(pack, 'pointerdown', 500, 200);
  ptr(pack, 'pointermove', 400, 200);
  ptr(pack, 'pointermove', 300, 200);
  ptr(pack, 'pointerup', 300, 200);
  await sleep(800);
  ok(d.querySelector('.step23') !== null, 'étape 2 : cartes révélées');
  ok(d.querySelector('.pack.ghost') !== null, 'paquet fantôme qui quitte l\'écran');
  ok(d.querySelectorAll('.cards-table .card').length === 29, '29 cartes sur la table');
  ok(d.querySelectorAll('.card-picto svg').length === 29, '29 pictogrammes');
  ok(d.querySelectorAll('.group-label').length === 3, '3 libellés de groupes');
  const padZ = 14, zwZ = (1000 - padZ * 4) / 3;
  const inZone = (x, gi) => x >= padZ + gi * (zwZ + padZ) - 12 && x <= padZ + gi * (zwZ + padZ) + zwZ + 12;
  const groupedOk = ['quoi', 'ou', 'qui'].every((tp, gi) =>
    T.state.session.deck.filter((c) => c.def.type === tp).every((c) => inZone(c._x, gi)));
  ok(groupedOk, 'cartes déposées en 3 groupes par couleur');
  const orders = JSON.stringify(T.state.session.deck.map((c) => c.def.title));
  ok(!orders.startsWith('["Jouer'), 'ordre aléatoire à l\'intérieur des groupes');

  // déplacer une carte
  const c0 = d.querySelectorAll('.cards-table .card')[0];
  ptr(c0, 'pointerdown', 100, 100);
  ptr(c0, 'pointermove', 160, 160);
  ptr(c0, 'pointerup', 160, 160);
  ok(c0.style.transform.includes('translate'), 'carte déplacée (transform appliqué)');

  // tap → aperçu
  ptr(c0, 'pointerdown', 160, 160);
  ptr(c0, 'pointerup', 160, 160);
  ok(d.querySelector('.modal-overlay .card-big') !== null, 'aperçu plein écran au tap');
  d.querySelector('.modal-overlay').click();
  ok(d.querySelector('.modal-overlay') === null, 'aperçu fermé au tap');

  // étape 3
  [...d.querySelectorAll('.session-footer .btn')].find((b) => b.textContent.includes('Choisir mes cartes')).click();
  ok(d.querySelector('.pocket.open') !== null, 'pochette ouverte');

  const dropToPocket = async (idx) => {
    const c = d.querySelectorAll('.cards-table .card')[idx];
    const st = T.state.session.deck.find((x) => x.el === c);
    const dx = 500 - (st._x + st._w / 2);
    const dy = 300 - (st._y + st._h / 2);
    ptr(c, 'pointerdown', 200, 200);
    ptr(c, 'pointermove', 200 + dx, 200 + dy);
    ptr(c, 'pointerup', 200 + dx, 200 + dy);
    await sleep(400);
  };
  await dropToPocket(0);
  await dropToPocket(1);
  await dropToPocket(2);
  ok(d.querySelector('.pocket-count').textContent.startsWith('3'), '3 cartes dans la pochette');

  d.querySelector('.mini-remove').click();
  await sleep(100);
  ok(d.querySelector('.pocket-count').textContent.startsWith('2'), 'retrait d\'une carte de la pochette');
  await dropToPocket(0);
  ok(d.querySelector('.pocket-count').textContent.startsWith('3'), 're-dépôt dans la pochette');

  [...d.querySelectorAll('.session-footer .btn')].find((b) => b.textContent.includes('Mon choix est fait')).click();
  ok(d.querySelector('.step4') !== null, 'étape 4 : décrire son idée');
  ok(d.querySelectorAll('.thumb').length === 3, '3 vignettes en haut');

  d.querySelector('.thumb').click();
  ok(d.querySelector('.modal-overlay .card-big') !== null, 'consultation d\'une carte sélectionnée');
  d.querySelector('.modal-overlay').click();

  const ta = d.querySelector('.idea-input');
  ta.value = 'Je souhaite un parcours de santé accessible près de chez moi.';
  ta.dispatchEvent(new w.Event('input', { bubbles: true }));
  ok(T.state.session.description.includes('parcours de santé'), 'texte de description enregistré');

  [...d.querySelectorAll('.session-footer .btn')].find((b) => b.textContent.includes('Continuer')).click();
  ok(d.querySelector('.step5') !== null, 'étape 5 : finalisation');
  ok(d.querySelectorAll('.recap-line').length >= 1, 'récapitulatif des cartes');

  const fields = d.querySelectorAll('.field');
  fields[0].value = 'Dupont';
  fields[0].dispatchEvent(new w.Event('input', { bubbles: true }));
  fields[1].value = 'Marie';
  fields[1].dispatchEvent(new w.Event('input', { bubbles: true }));
  fields[2].value = 'marie.dupont@example.fr';
  fields[2].dispatchEvent(new w.Event('input', { bubbles: true }));
  ok(T.state.session.nom === 'Dupont' && T.state.session.prenom === 'Marie' && T.state.session.email === 'marie.dupont@example.fr', 'coordonnées enregistrées');

  // sauvegarde XLSX
  const a = d.createElement('a');
  [...d.querySelectorAll('.session-footer .btn')].find((b) => b.textContent.includes('Enregistrer mon projet')).click();
  const saved = savedBlobs[savedBlobs.length - 1];
  ok(saved !== undefined, 'fichier XLSX généré');
  const buf = Buffer.from(await saved.arrayBuffer());
  fs.writeFileSync('/tmp/e2e_projet.xlsx', buf);
  ok(buf.length > 2000, 'fichier XLSX non vide (' + buf.length + ' o)');

  ok(d.querySelector('.saved-screen') !== null, 'écran de confirmation');
  await sleep(3200);
  ok(d.querySelector('.menu-screen') !== null, 'retour automatique au menu');

  // exemples
  [...d.querySelectorAll('.menu-buttons .btn')].find((b) => b.textContent.includes('Exemples')).click();
  ok(d.querySelectorAll('.examples-screen .example-item').length === 3, '3 paquets d\'exemples');
  [...d.querySelectorAll('.btn')].find((b) => b.textContent.includes('Retour')).click();
  ok(d.querySelector('.menu-screen') !== null, 'retour exemples → menu');

  [...d.querySelectorAll('.menu-buttons .btn')].find((b) => b.textContent.includes('Exemples')).click();
  d.querySelectorAll('.example-item .pack')[1].click();
  ok(d.querySelector('.example-detail') !== null, 'détail de l\'exemple 2');
  const p2 = d.querySelector('.pack');
  ptr(p2, 'pointerdown', 500, 200);
  ptr(p2, 'pointermove', 400, 200);
  ptr(p2, 'pointermove', 300, 200);
  ptr(p2, 'pointerup', 300, 200);
  await sleep(2400);
  ok(d.querySelector('.example-open') !== null, 'exemple ouvert');
  ok(d.querySelector('.example-title').textContent.length > 5, 'titre du projet affiché');
  ok(d.querySelector('.example-desc').textContent.includes('Oissel'), 'description affichée');
  ok(d.querySelectorAll('.example-cards .card').length === 6, '6 cartes de l\'exemple disposées');
  [...d.querySelectorAll('.btn')].find((b) => b.textContent.includes('Retour')).click();
  ok(d.querySelector('.examples-screen') !== null, 'retour → sélection d\'exemples');
  [...d.querySelectorAll('.btn')].find((b) => b.textContent.includes('Retour')).click();
  ok(d.querySelector('.menu-screen') !== null, 'retour → menu principal');

  console.log(`\n${pass} PASS / ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
