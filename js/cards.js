'use strict';

/* Données des cartes : 3 types, pictogrammes SVG maison. */

const CARD_TYPES = {
  quoi: { label: 'Quoi', backColor: '#FF5A52', textColor: '#FFFFFF' },
  ou:   { label: 'Où',   backColor: '#2E7D32', textColor: '#FFFFFF' },
  qui:  { label: 'Avec / Pour qui', backColor: '#1E5AA8', textColor: '#FFFFFF' },
};

const PICTOS = {
  'Jouer': '<circle cx="32" cy="32" r="18"/><path d="M18 21 C29 30 35 36 45 44"/><path d="M45 21 C36 30 30 36 19 43"/>',
  'Jardiner': '<path d="M32 52 V32"/><path d="M32 38 C24 38 17 32 15 21 C26 22 32 29 32 38 Z"/><path d="M32 30 C32 21 39 14 49 13 C48 23 42 30 32 30 Z"/><path d="M18 52 H46"/>',
  'Profiter du paysage': '<path d="M6 50 L23 24 L33 38 L41 28 L58 50 Z"/><circle cx="49" cy="15" r="6"/>',
  'Se poser et discuter': '<path d="M10 16 H36 A4 4 0 0 1 40 20 V30 A4 4 0 0 1 36 34 H18 L10 42 Z"/><path d="M54 28 V40 A4 4 0 0 1 50 44 H34 L42 52 V44"/>',
  'Faire du sport ou bouger': '<path d="M16 32 H48"/><path d="M22 20 V44"/><path d="M42 20 V44"/><path d="M12 25 V39"/><path d="M52 25 V39"/>',
  'Se reposer': '<path d="M36 9 A21 21 0 1 0 55 45 A16 16 0 1 1 36 9 Z"/><path d="M42 14 H52 L42 24 H52"/>',
  "Exposer des oeuvres d'art": '<rect x="10" y="12" width="44" height="36" rx="2"/><path d="M16 42 L27 26 L35 36 L41 29 L48 42"/><circle cx="43" cy="20" r="3"/>',
  'Se souvenir ou apprendre l\'histoire': '<path d="M32 19 C27 14 18 14 10 17 V46 C18 43 27 43 32 48 C37 43 46 43 54 46 V17 C46 14 37 14 32 19 Z"/><path d="M32 19 V48"/>',
  'Protéger la nature': '<path d="M32 7 L52 15 V30 C52 44 42 52 32 57 C22 52 12 44 12 30 V15 Z"/><path d="M41 24 C32 26 27 34 27 41 C36 40 42 33 41 24 Z"/><path d="M27 41 C30 34 35 29 41 25"/>',
  'Apprendre des choses': '<circle cx="32" cy="26" r="12"/><path d="M27 38 H37"/><path d="M28 43 H36"/><path d="M30 48 H34"/><path d="M32 6 V2"/><path d="M14 14 L11 11"/><path d="M50 14 L53 11"/>',
  'Autre idée de projet': '<path d="M26 44 L20 56 L36 48"/><path d="M12 30 A20 17 0 1 1 26 44 A20 17 0 0 1 12 30 Z"/><path d="M26 25 C26 19 38 19 38 25 C38 30 32 29 32 35"/><path d="M32 40 V41"/>',
  "Pied d'immeuble": '<rect x="17" y="8" width="30" height="48"/><path d="M23 16 H29"/><path d="M35 16 H41"/><path d="M23 25 H29"/><path d="M35 25 H41"/><path d="M23 34 H29"/><path d="M35 34 H41"/><path d="M27 56 V45 H37 V56"/>',
  'Parc urbain': '<circle cx="26" cy="26" r="12"/><path d="M26 38 V52"/><path d="M42 46 H58"/><path d="M44 46 V54"/><path d="M56 46 V54"/><path d="M42 51 H58"/>',
  'Espace naturel': '<path d="M5 52 C20 42 44 42 59 52"/><path d="M22 52 V40"/><path d="M22 18 L32 40 H12 Z"/><path d="M42 52 V42"/><path d="M42 28 L50 42 H34 Z"/>',
  'Jardin partagé': '<rect x="11" y="34" width="42" height="16"/><path d="M22 34 V26"/><path d="M22 29 C17 29 15 24 15 19 C21 20 22 24 22 29 Z"/><path d="M34 34 V22"/><path d="M34 26 C29 26 27 21 27 16 C33 17 34 21 34 26 Z"/><path d="M46 34 V27"/><path d="M46 30 C51 30 53 26 53 21 C47 22 46 25 46 30 Z"/>',
  'Friche': '<rect x="9" y="18" width="46" height="20"/><path d="M28 18 L33 28 L26 38"/><path d="M16 54 V45"/><path d="M16 47 C11 47 9 42 9 37"/><path d="M48 54 V45"/><path d="M48 47 C53 47 55 42 55 37"/>',
  'Place': '<rect x="13" y="40" width="38" height="10"/><path d="M32 40 V25"/><path d="M32 30 C25 30 21 34 21 39"/><path d="M32 30 C39 30 43 34 43 39"/><circle cx="32" cy="22" r="3"/>',
  'Trottoir ou bord de route': '<path d="M19 8 V56"/><path d="M45 8 V56"/><path d="M32 13 V21"/><path d="M32 27 V35"/><path d="M32 41 V49"/>',
  'Autre': '<path d="M24 22 C24 12 40 12 40 22 C40 30 32 30 32 38"/><path d="M32 46 V48"/>',
  'Association': '<circle cx="20" cy="25" r="6"/><circle cx="44" cy="25" r="6"/><circle cx="32" cy="17" r="6"/><path d="M11 46 C11 36 26 36 27 44"/><path d="M53 46 C53 36 38 36 37 44"/><path d="M23 51 C23 40 41 40 41 51"/>',
  'Riverains': '<path d="M8 30 L27 13 L46 30"/><path d="M13 30 V50 H41 V30"/><path d="M23 50 V40 H31 V50"/><circle cx="52" cy="34" r="4"/><path d="M52 40 V51"/><path d="M46 51 H58"/>',
  'Commerçants': '<path d="M10 22 L15 9 H49 L54 22"/><path d="M10 22 C10 26 14 28 17 26 C19 25 20 24 20 22"/><path d="M20 22 C20 26 24 28 27 26 C29 25 30 24 30 22"/><path d="M30 22 C30 26 34 28 37 26 C39 25 40 24 40 22"/><path d="M40 22 C40 26 44 28 47 26 C49 25 50 24 54 22"/><path d="M13 30 V52 H51 V30"/><path d="M20 52 V40 H30 V52"/><rect x="36" y="36" width="11" height="9"/>',
  'Entreprises': '<rect x="15" y="9" width="34" height="46"/><path d="M15 20 H49"/><path d="M15 31 H49"/><path d="M15 42 H49"/><path d="M32 9 V55"/><path d="M26 55 V48 H38 V55"/>',
  "Usagers d'un lieu ou d'un équipement": '<path d="M30 7 C21 7 17 14 17 20 C17 29 30 42 30 42 C30 42 43 29 43 20 C43 14 39 7 30 7 Z"/><circle cx="30" cy="20" r="4"/><circle cx="50" cy="43" r="4"/><path d="M50 49 V59"/><path d="M44 59 H56"/>',
  'Commune ou métropole': '<path d="M8 25 L32 11 L56 25"/><path d="M14 25 V48"/><path d="M26 25 V48"/><path d="M38 25 V48"/><path d="M50 25 V48"/><path d="M8 48 H56"/><path d="M5 54 H59"/>',
  'Autre acteur public': '<path d="M32 9 L38 24 L54 25 L42 35 L46 51 L32 42 L18 51 L22 35 L10 25 L26 24 Z"/>',
  'Jeunes': '<circle cx="23" cy="38" r="6"/><path d="M23 44 V58"/><path d="M23 49 L15 53"/><path d="M23 49 L31 53"/><circle cx="45" cy="18" r="8"/><path d="M45 26 C45 34 39 36 37 42"/><circle cx="43" cy="44" r="4"/><path d="M43 50 V58"/>',
  'Personnes âgées': '<circle cx="29" cy="15" r="6"/><path d="M29 21 V41"/><path d="M29 41 L21 57"/><path d="M29 41 L36 57"/><path d="M29 29 L42 34"/><path d="M42 34 V57"/>',
  'Personnes isolées': '<circle cx="32" cy="20" r="7"/><path d="M32 27 V45"/><path d="M32 33 L21 40"/><path d="M32 33 L43 40"/><path d="M32 45 L24 58"/><path d="M32 45 L40 58"/><circle cx="32" cy="33" r="25" stroke-dasharray="4 7"/>',
};

const CARDS = [
  { type: 'quoi', title: 'Jouer' },
  { type: 'quoi', title: 'Jardiner' },
  { type: 'quoi', title: 'Profiter du paysage' },
  { type: 'quoi', title: 'Se poser et discuter' },
  { type: 'quoi', title: 'Faire du sport ou bouger' },
  { type: 'quoi', title: 'Se reposer' },
  { type: 'quoi', title: "Exposer des oeuvres d'art" },
  { type: 'quoi', title: "Se souvenir ou apprendre l'histoire" },
  { type: 'quoi', title: 'Protéger la nature' },
  { type: 'quoi', title: 'Apprendre des choses' },
  { type: 'quoi', title: 'Autre idée de projet' },
  { type: 'ou', title: "Pied d'immeuble" },
  { type: 'ou', title: 'Parc urbain' },
  { type: 'ou', title: 'Espace naturel' },
  { type: 'ou', title: 'Jardin partagé' },
  { type: 'ou', title: 'Friche' },
  { type: 'ou', title: 'Place' },
  { type: 'ou', title: 'Trottoir ou bord de route' },
  { type: 'ou', title: 'Autre' },
  { type: 'qui', title: 'Association' },
  { type: 'qui', title: 'Riverains' },
  { type: 'qui', title: 'Commerçants' },
  { type: 'qui', title: 'Entreprises' },
  { type: 'qui', title: "Usagers d'un lieu ou d'un équipement" },
  { type: 'qui', title: 'Commune ou métropole' },
  { type: 'qui', title: 'Autre acteur public' },
  { type: 'qui', title: 'Jeunes' },
  { type: 'qui', title: 'Personnes âgées' },
  { type: 'qui', title: 'Personnes isolées' },
];

const CARD_COLORS = {
  'Jouer': '#FF5A52',
  'Jardiner': '#4CAF50',
  'Profiter du paysage': '#2196F3',
  'Se poser et discuter': '#FF9800',
  'Faire du sport ou bouger': '#E91E63',
  'Se reposer': '#9C27B0',
  "Exposer des oeuvres d'art": '#673AB7',
  "Se souvenir ou apprendre l'histoire": '#795548',
  'Protéger la nature': '#2E7D32',
  'Apprendre des choses': '#00ACC1',
  'Autre idée de projet': '#607D8B',
  "Pied d'immeuble": '#8D6E63',
  'Parc urbain': '#388E3C',
  'Espace naturel': '#00897B',
  'Jardin partagé': '#7CB342',
  'Friche': '#A1887F',
  'Place': '#039BE5',
  'Trottoir ou bord de route': '#546E7A',
  'Autre': '#78909C',
  'Association': '#F57C00',
  'Riverains': '#1E88E5',
  'Commerçants': '#FB8C00',
  'Entreprises': '#0288D1',
  "Usagers d'un lieu ou d'un équipement": '#3949AB',
  'Commune ou métropole': '#1565C0',
  'Autre acteur public': '#5E35B1',
  'Jeunes': '#FF7043',
  'Personnes âgées': '#6D4C41',
  'Personnes isolées': '#455A64',
};

function cardSvg(def, size) {
  const picto = PICTOS[def.title] || PICTOS['Autre'];
  const color = CARD_COLORS[def.title] || '#333';
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${picto}</svg>`;
}

const EXAMPLES = [
  {
    label: 'Exemple 1',
    cards: ['Trottoir ou bord de route', 'Faire du sport ou bouger', 'Jouer', 'Commune ou métropole', 'Jeunes'],
    title: "Des prises d'escalade sur un bord de route",
    description: "Des habitants d'Ostrava ont installé des prises d'escalade sur un mur d'environ 4 mètres de haut soutenant une route.",
  },
  {
    label: 'Exemple 2',
    cards: ["Pied d'immeuble", 'Place', 'Riverains', 'Se poser et discuter', 'Jouer', 'Jardiner'],
    title: "Discuter à l'ombre pendant que les enfants jouent",
    description: "Autour d'une aire de jeux, une habitante d'Oissel aimerait installer de quoi s'asseoir, et des jardinières avec des treilles et des plantes grimpantes pour faire de l'ombre.",
  },
  {
    label: 'Exemple 3',
    cards: ['Parc urbain', 'Faire du sport ou bouger', 'Jouer', 'Entreprises', 'Personnes âgées'],
    title: 'Un parcours de mobilité dans un parc de Oissel',
    description: 'Une professionnelle de santé du territoire aimerait que le parc proche de son cabinet dispose d\'un espace de mobilité, notamment pour les personnes âgées (mais pas seulement).',
  },
];

function cardByTitle(title) {
  return CARDS.find((c) => c.title === title);
}
