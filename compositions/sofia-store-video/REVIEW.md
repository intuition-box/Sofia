# Relecture, version 2

**Film :** A, « Une page, un voyage », refait dans l'esprit des films produit d'Apple. 30 s, 1920×1080, 30 i/s. Rendu : `renders/sofia-web-store-v2.mp4`. La v1 est conservée dans `renders/sofia-web-store-v1.mp4`.

## Méthode

Chaque objet a d'abord été modélisé seul dans `board.html` (fenêtre, menu, curseur, toast, carte, tuiles, logo, titres), puis animé. Les règles sont dans `SPEC.md`.

## Choix faits

- **Page :** l'article Wikipedia « Photography », qui est dans le vrai Trending. Reddit n'y est pas, sa carte aurait donc été inventée.
- **Chiffres :** carte et tuiles relevées sur la prod le 9/11/2026, fenêtre 7 jours.
- **Lumière :** fond studio clair, ombres sur trois couches, un reflet par objet principal, mises au point floues pour les passages au texte. Ni lueur, ni particules.
- **Mention légale :** reprise du produit, comme le demande `docs/LEXICON.md`.

## Vérifié

- `check` passe. J'ai regardé des images clés et les transitions, ainsi que des images extraites du MP4.
- Le son est présent, mais personne ne l'a écouté. Il n'y a que des bruitages, pas de musique.

## Limites

- Menu clic droit et toast redessinés avec les vrais libellés de `apps/extension/background/addToSofia.ts`, sans capture Chrome.
- Les avertissements de contraste viennent du texte gris volontaire et du reflet qui passe sur les titres.
- Plan le plus faible : l'ouverture de la fenêtre (3 à 4 s), qui reste petite dans le cadre avant le zoom.
