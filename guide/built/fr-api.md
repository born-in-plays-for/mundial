<!-- i18n:api_page_title -->
# Guide API
<!-- /i18n:api_page_title -->

<!-- i18n:api_intro -->
Référence technique pour l'API de paramètres d'URL de l'application — comment créer un lien pointant directement vers une configuration de filtre/tri précise sur la page Carte.
<!-- /i18n:api_intro -->

<!-- i18n:api_url_params -->
## Paramètres d'URL

La barre latérale de filtre/tri de la page Carte (`js/control_sidebar.js`) lit toute sa configuration à partir d'une poignée de paramètres d'URL : `?explain`, `?sort=`, `?dir=`, `?stage=`, `?fifaconf=`, `?show=`. Tous sont optionnels et indépendants ; un paramètre omis conserve simplement la valeur par défaut du panneau pour ce réglage.

### `?explain` — inspecter la configuration actuelle

Le bouton `?` de la barre d'outils du filtre ouvre un panneau décrivant les **réglages actuels** du panneau — tri, direction, étape, cellules de filtre, confédération — en langage clair, avec un décompte des pays visibles. Ajoutez `?explain` à n'importe quelle URL pour qu'il s'ouvre automatiquement au chargement.

Ce panneau décrit le panneau tel qu'il est en direct, pas l'URL : il a exactement le même aspect qu'un réglage provienne d'un paramètre d'URL, d'une session restaurée, ou d'un simple clic dans le panneau. Rien, dans le panneau lui-même, ne permet de distinguer l'un de l'autre — c'est voulu, puisque ce qui compte est ce qui s'affiche à l'écran en ce moment. Fermez-le en cliquant à nouveau sur `?`, sur `×`, ou en appuyant sur Échap.

Dès qu'une URL contient un paramètre du panneau, les mêmes réglages actuels sont aussi journalisés dans la console du navigateur, indépendamment de `?explain`.

```
?stage=r16&show=QB&explain    → ouvre le panneau au chargement, reste ouvert pour consultation
```

### `?sort` — critère de tri

```
?sort=elo              classement Elo mondial (par défaut)
?sort=alpha            A–Z par nom de pays
?sort=pop              population
?sort=delta            joue-pour moins né-dans
?sort=elo+alpha        primaire : Elo, secondaire : A–Z
?sort=pop+delta+alpha  jusqu'à 4 clés ; seules les deux premières comptent pour le tri
```

`+` sépare les clés (`,` est aussi accepté). Les clés indiquées passent en premier dans l'ordre donné ; les clés non indiquées remplissent les emplacements restants du panneau. Se combine avec `?dir`.

### `?dir` — direction du tri

```
?dir=desc    décroissant (par défaut)
?dir=asc     croissant
```

S'applique uniquement à la clé de tri primaire. `?sort=alpha&dir=desc` donne Z–A.

### `?stage` — filtre par étape du tournoi

```
?stage=group       par défaut — tous les pays qualifiés et leurs exportateurs
?stage=r32         Seizièmes de finale
?stage=r16         Huitièmes de finale
?stage=qf          Quarts de finale
?stage=sf          Demi-finales
?stage=final       Finale
?stage=winner      Vainqueur uniquement
```

Reflète le carrousel d'étapes du panneau de filtre (Phase de groupes → Seizièmes de finale → Huitièmes de finale → Quarts de finale → Demi-finales → Finale → Vainqueur).

**Ne filtre la liste que lorsque l'onglet Tournoi est actif.** Là, c'est le seul filtre : les pays qualifiés sont réduits à ceux ayant « atteint » cette étape — encore en lice en l'abordant, ou l'ayant déjà remportée — et tout pays non qualifié est masqué d'office, quels que soient `?show`/`?fifaconf`. Sur la liste des pays (l'onglet par défaut), `?stage` déplace quand même le carrousel pour le préparer au prochain changement d'onglet, mais n'a aucun effet de filtrage là — c'est `?show` qui filtre sur cet onglet. Voir « Portée par onglet » ci-dessous.

Les valeurs inconnues sont silencieusement ignorées et les valeurs par défaut sont conservées.

### `?fifaconf` — filtre par confédération FIFA

```
?fifaconf=uefa       UEFA — Europe
?fifaconf=afc        AFC — Asie
?fifaconf=caf        CAF — Afrique
?fifaconf=conmebol   CONMEBOL — Amérique du Sud
?fifaconf=concacaf   CONCACAF — Amériques du Nord et Centrale
?fifaconf=ofc        OFC — Océanie
```

Filtre la liste sur les seuls membres FIFA de la confédération indiquée — sur la liste des pays ; sur l'onglet Tournoi, ce filtrage de liste est totalement contourné, tout comme `?show` (voir « Portée par onglet » ci-dessous). Les pays non-FIFA ne sont pas affectés par le filtre lui-même — ils restent visibles ou masqués selon `?show`. Mettre en évidence la frontière de la confédération et y effectuer un zoom se produit quel que soit l'onglet actif.

Les valeurs inconnues sont silencieusement ignorées et les valeurs par défaut sont conservées.

### `?show` — liste blanche de filtre

```
?show=<jeton>[,<jeton>...]
```

Codes de cellule et/ou alias de groupe séparés par des virgules. Quand `show` est présent, il **remplace** entièrement les valeurs par défaut — toute cellule non listée est décochée. En son absence, les valeurs par défaut s'appliquent.

Ne filtre la liste que sur la liste des pays — sur l'onglet Tournoi, `?stage` est le seul filtre et `?show` est totalement ignoré ; voir « Portée par onglet » ci-dessous.

## Codes de cellule

La matrice de filtre reflète la disposition du panneau — deux colonnes (exportateur / conserve ses joueurs) croisées avec quatre groupes de lignes. Chaque code fait exactement **2 lettres** : la position 1 choisit la portée de la ligne, la position 2 choisit la colonne.

|  | **exportateur (`E`)** | **conserve ses joueurs (`K`)** |
|---|:---:|:---:|
| **qualifié · importe (`I`)** | `IE`&nbsp;&nbsp;✓  | `IK`&nbsp;&nbsp;✓ |
| **qualifié · local, sans import (`H`)** | `HE`&nbsp;&nbsp;✓ | `HK`&nbsp;&nbsp;✓ |
| **non qualifié · FIFA (`F`)** | `FE`&nbsp;&nbsp;○ | `FK`&nbsp;&nbsp;○ |
| **non qualifié · non-FIFA (`N`)** | `NE`&nbsp;&nbsp;○ | `NK`&nbsp;&nbsp;○ |

✓ activé par défaut · ○ désactivé par défaut

Mnémoniques des lettres — position 1 (portée de la ligne) :

- `I` — qualifié, a des **I**mportations
- `H` — qualifié, local (**H**omegrown — sélection entièrement née là, sans import)
- `Q` — tous les **Q**ualifiés (les deux lignes)
- `F` — membre **F**IFA, non qualifié
- `N` — **N**on-FIFA
- `U` — tous les non qualifiés (**U**nqualified, les deux lignes)
- `A` — **A**bsolument tout (toutes les lignes)

Position 2 (portée de la colonne) :

- `E` — **E**xportateurs
- `K` — **K**eeps its players — conserve ses joueurs (non-exportateurs)
- `B` — les deux colonnes (**B**oth)

Chacun de ces codes à 2 lettres fonctionne aussi comme raccourci clavier dans le panneau — voir « Raccourci clavier » ci-dessous.

### À propos de la terminologie

Le cadre officiel de ce projet est **Né dans / Joue pour** : un joueur est *né dans* un pays et *joue pour* un autre. Dans la matrice de filtre, la même relation est exprimée du point de vue du pays comme **imports / exports** : un pays *exporte* un joueur quand une personne née là joue pour une autre sélection ; il *importe* un joueur quand une personne née ailleurs joue pour sa sélection. Les deux formulations sont interchangeables :

- « La France exporte 17 joueurs » = « 17 joueurs nés en France jouent pour la sélection d'un autre pays. »
- « Le Maroc importe 4 joueurs » = « 4 joueurs nés hors du Maroc jouent pour la sélection marocaine. »
- « Un pays `IE` importe et exporte à la fois » = « une sélection qualifiée qui compte des joueurs nés à l'étranger *et* a des joueurs nés là qui représentent d'autres nations. »

## Alias de groupe

| Alias  | Développe en       | Signification                              |
|--------|--------------------|--------------------------------------|
| `QB`   | `IE,IK,HE,HK`     | Toutes les lignes qualifiées                   |
| `UB`   | `FE,NE,FK,NK`     | Toutes les lignes non qualifiées               |
| `AE`   | `IE,HE,FE,NE`     | Colonne exportateur                      |
| `AK`   | `IK,HK,FK,NK`     | Colonne « conserve ses joueurs »             |
| `IB`   | `IE,IK`           | Lignes des importateurs (avec ou sans exports) |
| `HB`   | `HE,HK`           | Lignes locales (qualifiées, sans import) |
| `FB`   | `FE,FK`           | Lignes membres FIFA (non qualifiées)     |
| `NB`   | `NE,NK`           | Lignes non-FIFA                        |
| `AB`   | les 8 codes        | Toutes les cellules (y compris `FK` et `NK`) |

Les alias et les codes individuels peuvent être librement combinés ; le résultat est une union. Les jetons inconnus sont silencieusement ignorés — si tous les jetons sont non reconnus, le paramètre est ignoré entièrement et les valeurs par défaut sont conservées.

## Portée par onglet — `?stage`, `?show` et `?fifaconf` ne se combinent pas tous

Ces trois-là ne s'empilent pas en un seul filtre combiné — chacun des deux onglets de la page Carte ne lit qu'un seul d'entre eux pour le filtrage effectif de la liste :

- **La liste des pays** (l'onglet par défaut) : `?show` et `?fifaconf` filtrent ensemble comme d'habitude ; `?stage` se contente de garer le carrousel pour plus tard — aucun effet de filtrage pour l'instant.
- **Onglet Tournoi** : `?stage` est le seul filtre — les pays qualifiés sont réduits à ceux ayant atteint cette étape, tout pays non qualifié est masqué d'office ; `?show` et `?fifaconf` sont tous deux ignorés.

L'onglet actif au chargement de la page provient de votre dernière visite (`localStorage`), ou de la liste des pays en l'absence de préférence enregistrée — jamais de l'URL elle-même. Un lien combinant `?stage=r16&show=QB`, par exemple, prérègle les deux valeurs, mais une seule des deux moitiés filtre réellement quelque chose, selon l'onglet sur lequel vous atterrissez.

## Raccourci clavier

Chaque code de cellule et alias ci-dessus fonctionne aussi comme raccourci clavier dans le panneau de filtre : appuyez sur **`v`** ou **`x`**, puis tapez le code à 2 lettres. `v` **affiche** (coche) les cellules indiquées ; `x` **masque** (décoche) ces mêmes cellules — les cellules hors de la portée du code ne sont jamais touchées. Deux préfixes avec un état cible fixe, plutôt qu'un seul préfixe qui bascule, car un raccourci clavier ne voit pas l'état des cases à cocher qu'il s'apprête à modifier, contrairement à un clic de souris sur la case visible — le même raccourci afficherait ou masquerait selon ce qui était déjà coché. `v`/`x` reprennent le mnémonique copier-coller (coller = insérer / couper = retirer) plutôt que d'épeler « afficher »/« masquer ». Pas de touche modificatrice — les raccourcis basés sur Ctrl/Cmd risquent de tomber sur `Cmd-Q` (qui quitte tout le navigateur sur macOS) en cas d'erreur de frappe, donc ceci utilise un préfixe simple à la place, le même schéma que GitHub utilise pour sa propre navigation en `g` `i`. Il ne se déclenche que lorsque le focus n'est pas dans un champ de texte.

Comme chaque code fait exactement 2 lettres, le raccourci se résout toujours dès que la deuxième lettre est tapée — pas d'attente, pas d'ambiguïté entre par exemple `IE` et un code plus long qui commencerait pareil (il n'y en a pas).

```
v I E    affiche la cellule IE (qualifié, imports, exports)
x I E    masque la cellule IE
v Q B    affiche toutes les lignes qualifiées
x A B    masque tout
```

Enchaîner deux raccourcis permet d'atteindre un état cible exact quel que soit l'état de départ — par exemple, « uniquement `FK`, quel que soit l'état initial » s'obtient avec `x A B` (tout masquer) puis `v F K` (afficher seulement `FK`).

`Échap` à tout moment pendant un raccourci l'annule ; un raccourci inactif se réinitialise aussi automatiquement après ~1,5 s.

## Exemples

```
?show=QB                        Liste des pays : les 48 pays qualifiés ; non qualifiés masqués.
?show=QB&sort=pop&dir=asc       Liste des pays : pays qualifiés triés par population croissante.
?show=IE                        Liste des pays : uniquement les pays qui importent et exportent des joueurs.
?sort=delta&dir=asc&show=QB     Liste des pays : pays qualifiés avec le plus faible écart joue-pour / né-dans en premier.
?show=AB                        Liste des pays : les 8 cellules, y compris FK et NK normalement masquées.
?show=QB,FE                     Liste des pays : pays qualifiés + exportateurs FIFA non qualifiés.
?fifaconf=uefa                  Liste des pays : membres UEFA uniquement (filtre FIFA ; non-FIFA non affectés).
?fifaconf=caf&show=AE           Liste des pays : exportateurs africains uniquement.
?stage=r16                      Onglet Tournoi : pays qualifiés ayant atteint les Huitièmes de finale.
?stage=winner                   Onglet Tournoi : uniquement le champion final.
```
<!-- /i18n:api_url_params -->
