# Imaginez, Proposez, Fabriquez — app d'atelier cartes

Application web tactile (téléphone et tablette, format **paysage**) d'aide à l'animation
d'ateliers rapides avec un citoyen : le participant ouvre un paquet de cartes scellé,
découvre les cartes, choisit sa main, décrit son idée et finalise un projet exporté
en fichier XLSX.

## Lancer l'application

Aucune dépendance ni build : servir le dossier et ouvrir la page dans un navigateur.

```bash
# au choix :
python3 -m http.server 8080
npx serve .
```

Puis ouvrir `http://<adresse>:8080` sur la tablette/le téléphone.
Astuce : « Ajouter à l'écran d'accueil » pour un usage plein écran comme une app.

L'application fonctionne entièrement hors ligne (aucun CDN, génération XLSX locale).

## Déroulé d'une session (5 étapes)

1. **Ouvrir le paquet** — paquet plastique blanc 3D avec le logo ; manipulation libre au
   doigt, puis découpe en glissant de droite à gauche en haut du paquet (une ligne de
   coupe suit le doigt et scinde le paquet). Les cartes surgissent du paquet.
2. **Découvrir les cartes** — les cartes se déposent en trois groupes selon leur couleur :
   « Quoi » (dos rouge), « Où » (dos vert), « Avec / Pour qui » (dos bleu) ; l'ordre à
   l'intérieur de chaque groupe est aléatoire. Déplacement au glisser, zoom à deux
   doigts, tap pour agrandir.
3. **Choisir sa main** — une pochette s'ouvre sur le côté ; on y dépose les cartes
   voulues (autant que souhaité) et on peut les en retirer. Bouton « Mon choix est fait ».
4. **Décrire son idée** — les cartes choisies en vignettes en haut (tap pour consulter),
   champ texte clavier en dessous.
5. **Finaliser** — nom, prénom, adresse mail (facultatifs), puis « Enregistrer mon
   projet » : génération d'un fichier XLSX (cartes sélectionnées, description,
   coordonnées, date) téléchargé sur l'appareil, puis retour au menu.

## Exemples

Le menu « Exemples » propose 3 paquets scellés. On en sélectionne un, on le découpe en
glissant de droite à gauche en haut du paquet : les cartes sortent dans un ordre aléatoire et se disposent à
l'écran, avec le titre du projet en haut et sa description dans un encadré à côté.
Bouton « Retour » vers la sélection, puis vers le menu principal.

## Structure

```
index.html          Page unique
css/style.css       Styles (paysage, tactile, paquet 3D, pochette)
js/cards.js         Données des 29 cartes, pictogrammes SVG, 3 exemples
js/xlsx.js          Générateur XLSX autonome (ZIP + Office Open XML, sans dépendance)
js/app.js           Navigation, gestes (glisser, pincer, swipe), écrans
assets/logo.png     Logo « Imaginez / Proposez / Fabriquez »
```

## Tests

Un test fonctionnel headless (jsdom) couvre le parcours complet : menu → session
(5 étapes, glisser/déposer dans la pochette, retrait) → génération et contenu du XLSX →
retour menu → exemples.

```bash
npm i jsdom && node test/e2e.test.js   # depuis la racine du projet
```
