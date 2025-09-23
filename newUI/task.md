Nouvelle couleur :
000000 : --black
14213D : --semi black
FCA311 : --yellow
E5E5E5 : --grey
FFFFFF : --white

Faire des background gradient glass effect pour les card
faire des ring gradient glass effect avec --yellow pour les ring de echo-card

Le background de l'application est noir, il faut donc bien jouer avec les contrastes pour que l'application respectent les normes en matieres d'UI.

## Questions:

1. **Echo-card**: Où se trouve ce composant dans le code? Dois-je le chercher ou avez-vous le chemin? Les echo-card sont dans @corepage.css et @resonancepage.css

2. **Nouvelles couleurs**: Dois-je remplacer les variables actuelles ou les ajouter? Par exemple, `--primary` devient `--yellow` ou on garde les deux? Remplace les, remplaces tout les appels dans le code de l'extension. N'invite pas des variables, sauf pour les gradients glass effect

3. **Background noir**: Le background principal de l'app doit-il être changé pour `--black` (#000000) ou c'est déjà le cas? cest déjà le cas

4. **Cards concernées**: Toutes les cards existantes ou des cards spécifiques? (j'ai vu des références à des cards dans le code) toutes les cards

5. **Contraste**: Pour l'accessibilité avec le fond noir, voulez-vous que je vérifie/ajuste les couleurs de texte automatiquement? oui ajutes les couleurs de texte, mais utilise toujours les var()


