<!-- i18n:page_title -->
# Guide utilisateur
<!-- /i18n:page_title -->

<!-- i18n:intro -->
Cette carte visualise les effectifs de la Coupe du Monde 2026 sous l'angle du lieu de naissance.
Chaque pays est coloré selon son bilan net de talent — voir *La légende*, ci-dessous —
qui met en balance les joueurs nés dans ce pays et les joueurs qui y jouent.
<!-- /i18n:intro -->

<!-- i18n:quotes -->
## Les citations

L'en-tête affiche un carrousel de 15 citations littéraires célèbres —
de François Villon (1461) à Simone de Beauvoir (1949) — chacune détournée avec humour
en citation footballistique.

Naviguez entre les citations à l'aide des chevrons orientés vers la gauche, ou faites glisser vers la droite sur les écrans tactiles.
Maintenez appuyé (ou gardez le bouton de la souris enfoncé) sur une citation pour révéler la ligne originale ; relâchez pour revenir.

Faire glisser vers la gauche, en revanche, révèle un tout autre panneau — le panneau de contrôle,
qui régit le filtrage, le tri et l'affichage des pays.
<!-- /i18n:quotes -->

<!-- i18n:control_sidebar -->
# Le panneau de contrôle

Le bouton <kbd style="background:var(--bg-hover,#f0ede8);border:1px solid var(--border,#e4e0d8);color:var(--text-muted,#999);border-radius:0 4px 4px 0">‹</kbd> dans le coin supérieur droit de la fenêtre ouvre le panneau de contrôle, qui détermine ce qui apparaît sur la carte et dans la liste des pays.

![Panneau de contrôle](screenshots/control_sidebar-fr.png)

Le panneau comporte cinq parties : une **barre d'outils** en haut ; **tri** et **afficher** à gauche ; la matrice de **filtre** à droite ; et une **barre d'info** en bas.

## Barre d'outils

- <kbd style="font-size:.68em;font-family:var(--bs-font-monospace,ui-monospace,monospace);background:var(--bg-hover,#f0ede8);border:1px solid var(--border,#e4e0d8);color:#1C274C;border-radius:3px;padding:2px 4px;vertical-align:middle">ESC</kbd> réduit le panneau et le ramène à son bouton ‹.
- <img class="gp-icon" src="images/solar_linear/widget-5-svgrepo-com.svg" alt="confédération"> filtre la liste sur une seule confédération FIFA — voir *Filtre confédérations FIFA*, ci-dessous.
- <img class="gp-icon" src="images/solar_linear/share-svgrepo-com.svg" alt="partager"> et <img class="gp-icon" src="images/solar_linear/question-circle-svgrepo-com.svg" alt="paramètres"> forment une paire : **partager** copie dans le presse-papiers une URL qui reproduit la configuration exacte du panneau, prête à être collée sur un autre appareil ou envoyée à quelqu'un ; **paramètres** ouvre un résumé en langage clair de ces mêmes réglages actuels — tri, filtres, phase, et plus — le même panneau que `?explain` ouvre au chargement de n'importe quelle page (voir *Paramètres d'URL*, ci-dessous).

## Tri

Quatre critères réorganisables — **le classement Elo** (une cote indépendante qui évolue après chaque match selon le résultat et la force de l'adversaire — voir l'[onglet Sources de données](?guide=data) pour le détail exact), **population**, **Δ** (delta joue-pour moins né-dans), **A–Z** — plus un bouton de sens (↓↑) pour inverser croissant/décroissant. Seuls les deux premiers critères sont réellement actifs ; cliquez sur un critère pour le placer en tête de liste.

## Afficher

Deux lignes indépendantes de pastilles à cocher, sous le tri :

- **Export / natif / import** : quel rôle a valu à un joueur sa place dans le tableau — né ici et sélectionné ailleurs ; né et sélectionné ici ; né ailleurs et sélectionné ici.
- **Joueur / sélectionneur** : quel type de personne s'affiche.

Chaque case est cochée par défaut (tout le monde est affiché) ; décochez-en une pour masquer ce groupe. Actuellement actif uniquement dans *Le tableau des joueurs*, plus bas — les cases s'affichent mais restent désactivées ailleurs, pour l'instant.

## Filtre

La matrice croise deux **colonnes** (exportateur / non-exportateur) avec quatre **lignes** en deux groupes :

- **Qualifiés** — selon que le pays importe des joueurs ou non
- **Non qualifiés** — selon l'appartenance à la FIFA

Décochez une cellule pour masquer cette catégorie. Cliquez sur un en-tête de ligne ou de colonne pour basculer tout le groupe d'un coup.

## Barre d'info

Indique combien de pays sont actuellement visibles sur le total, ainsi que la source des données (et la date de mise à jour) pour le critère actuellement en tête de la colonne de tri.

## Filtre confédérations FIFA

Le bouton <img class="gp-icon" src="images/solar_linear/widget-5-svgrepo-com.svg" alt="confédération"> à côté de la ligne **FIFA** ouvre un menu déroulant pour filtrer la liste sur une seule confédération. Les pays non-FIFA ne sont pas affectés — ils restent visibles ou masqués selon le reste de la matrice de filtre.

La sélection d'une confédération met également en évidence sa frontière externe sur la carte et effectue un zoom pour l'ajuster à la vue. Sélectionnez **Toutes les confédérations FIFA** pour supprimer le filtre.

## Paramètres d'URL

L'état du filtre et du tri peut aussi être configuré directement depuis l'URL — `?sort=`, `?dir=`, `?stage=`, `?show=`, `?fifaconf=`, `?pshow=`, plus `?tab=` et `?select=` pour arriver directement sur un onglet donné avec un pays déjà sélectionné. Ajoutez `?explain` à n'importe quelle URL pour ouvrir un panneau résumant les réglages actuels du panneau — voir *« ?explain » — inspecter la configuration actuelle* sur l'[onglet Guide API](?guide=api) pour le détail exact de ce qu'il affiche et pourquoi. La référence complète avec tous les codes de cellule, alias de groupe et exemples s'y trouve aussi.

## À propos de la référence des pays

La carte et la liste utilisent [eloratings.net](https://www.eloratings.net/) comme source des pays — et non la liste des membres de la FIFA. Cela signifie que la liste inclut des territoires n'ayant aucune adhésion à la FIFA, comme le Groenland.

Elle inclut aussi les quatre nations britanniques — Angleterre, Écosse, Pays de Galles, Irlande du Nord — sous forme de quatre entrées distinctes plutôt qu'un seul « Royaume-Uni », pour une raison sans rapport : contrairement au Groenland, elles *sont* membres de la FIFA, chacune à part entière. Ce qui est inhabituel les concernant, c'est d'être des entités infranationales avec une adhésion individuelle à la FIFA (et à Elo), pas une absence dans l'une ou l'autre liste.

Le tri par défaut est par classement Elo ; d'autres critères de tri sont disponibles dans la colonne de tri.
<!-- /i18n:control_sidebar -->

<!-- i18n:tax_heading -->
## Catégories de pays
<!-- /i18n:tax_heading -->

<!-- i18n:tax_intro -->
Chaque pays est affiché sous forme de **pastille** dont le style CSS encode sa catégorie en un coup d'œil.
<!-- /i18n:tax_intro -->

<div class="taxonomy" style="display:flex;flex-direction:column;gap:16px;margin:1rem 0">

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555"><!-- i18n:tax_label_qualified -->
Qualifié vs. non qualifié
<!-- /i18n:tax_label_qualified --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cz.svg" alt="">
    <span class="elo-name" data-id="203">Czech Republic</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_border_yes -->
Bordure pleine — qualifié et toujours en lice.
<!-- /i18n:tax_desc_border_yes --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--knocked-out" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/ir.svg" alt="">
    <span class="elo-name" data-id="364">Iran</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_border_dashed -->
Bordure pointillée — qualifié mais éliminé.
<!-- /i18n:tax_desc_border_dashed --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/ua.svg" alt="">
    <span class="elo-name" data-id="804">Ukraine</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_border_no -->
Pas de bordure — non qualifié.
<!-- /i18n:tax_desc_border_no --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555"><!-- i18n:tax_label_fifa -->
FIFA vs. non-FIFA
<!-- /i18n:tax_label_fifa --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/is.svg" alt="">
    <span class="elo-name" data-id="352">Iceland</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_text_dark -->
Texte foncé — membre de la FIFA.
<!-- /i18n:tax_desc_text_dark --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--nonfifa" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/gl.svg" alt="">
    <span class="elo-name" data-id="304">Greenland</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_text_light -->
Texte clair — non membre de la FIFA.
<!-- /i18n:tax_desc_text_light --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555"><!-- i18n:tax_label_born -->
Né ici / joue pour
<!-- /i18n:tax_label_born --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--exp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/it.svg" alt="">
    <span class="elo-name" data-id="380">Italy</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#1d4ed8">▶</span> <!-- i18n:tax_desc_exp -->
Des joueurs nés dans ce pays jouent pour un autre pays qualifié.
<!-- /i18n:tax_desc_exp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cw.svg" alt="">
    <span class="elo-name" data-id="531">Curaçao</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#dc2626">◀</span> <!-- i18n:tax_desc_imp -->
Des joueurs nés dans un autre pays jouent pour ce pays.
<!-- /i18n:tax_desc_imp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/fr.svg" alt="">
    <span class="elo-name" data-id="250">France</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#dc2626">◀</span><span style="color:#1d4ed8">▶</span> <!-- i18n:tax_desc_both -->
Des joueurs nés ailleurs jouent pour ce pays, et des joueurs nés ici jouent pour d'autres pays.
<!-- /i18n:tax_desc_both --></span>
</div>
<div style="font-size:.8rem;color:#777;margin:6px 0"><!-- i18n:tax_note_gradient -->
L'arrière-plan de la pastille est lui-même un dégradé rouge (imports) → blanc (natifs) → bleu (exports) — plus la bande d'une couleur est large, plus la part de ce groupe dans l'effectif total du pays est grande.
<!-- /i18n:tax_note_gradient --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="--exp-color: rgb(59,130,246); --imp-color: rgb(248,173,173); --imp-pivot: 2.8%; --native-pivot: 25.0%; flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/fr.svg" alt="">
    <span class="elo-name" data-id="250">France</span>
    <span class="elo-pts"><span class="elo-pts-primary">3 · 81</span></span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_gradient_exp -->
Majoritairement bleu — un gros exportateur (81) avec seulement une poignée d'imports (3).
<!-- /i18n:tax_desc_gradient_exp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="--exp-color: rgb(160,197,250); --imp-color: rgb(248,167,167); --imp-pivot: 18.4%; --native-pivot: 86.4%; flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/us.svg" alt="">
    <span class="elo-name" data-id="840">United States</span>
    <span class="elo-pts"><span class="elo-pts-primary">7 · 11</span></span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_gradient_mixed -->
Une bande rouge visible à côté du bleu — un mélange plus équilibré d'exports (11) et d'imports (7).
<!-- /i18n:tax_desc_gradient_mixed --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--qualified elo-item--knocked-out elo-item--imp" style="--imp-color: rgb(239,68,68); --imp-pivot: 96.3%; --native-pivot: 100.0%; flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cw.svg" alt="">
    <span class="elo-name" data-id="531">Curaçao</span>
    <span class="elo-pts"><span class="elo-pts-primary">26</span></span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_gradient_imp -->
Presque entièrement rouge — la quasi-totalité de l'effectif (26) est née ailleurs.
<!-- /i18n:tax_desc_gradient_imp --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:2px;color:#555"><!-- i18n:tax_label_offmap -->
Hors carte
<!-- /i18n:tax_label_offmap --></div>
<div style="font-size:.8rem;color:#777;margin-bottom:6px"><!-- i18n:tax_note_offmap -->
Orthogonal aux catégories ci-dessus.
<!-- /i18n:tax_note_offmap --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--no-map" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/sg.svg" alt="">
    <span class="elo-name" data-id="702">Singapore</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_nomap -->
Drapeau estompé — absent des données géographiques utilisées par la carte (généralement parce que le territoire est trop petit).
<!-- /i18n:tax_desc_nomap --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--nonfifa elo-item--no-map" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/mc.svg" alt="">
    <span class="elo-name" data-id="492">Monaco</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_nomap_nonfifa -->
Idem, ici combiné avec non-FIFA.
<!-- /i18n:tax_desc_nomap_nonfifa --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:2px;color:#555"><!-- i18n:tax_label_fixture -->
Rencontres (vue matchs)
<!-- /i18n:tax_label_fixture --></div>
<div style="font-size:.8rem;color:#777;margin-bottom:6px"><!-- i18n:tax_note_fixture -->
Visible uniquement en vue matchs — voir Vue équipes / matchs, ci-dessus.
<!-- /i18n:tax_note_fixture --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-pair" style="display:inline-flex">
    <span class="elo-item-wrap">
      <span class="elo-item elo-item--qualified" style="flex-shrink:0">
        <span class="elo-flag-wrap"><img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/ma.svg" alt=""></span>
        <span class="elo-name" data-id="504">Morocco</span>
      </span>
    </span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_won -->
Coche verte sur la pastille — a gagné une rencontre décidée.
<!-- /i18n:tax_desc_won --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--lost" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/br.svg" alt="">
    <span class="elo-name" data-id="76">Brazil</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_lost -->
Drapeau en niveaux de gris — a perdu une rencontre décidée.
<!-- /i18n:tax_desc_lost --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-viz--match" style="display:inline-flex">
    <span class="elo-item elo-item--qualified elo-item--pending" style="flex-shrink:0">
      <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/de.svg" alt="">
      <span class="elo-name" data-id="276">Germany</span>
    </span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_pending -->
Bordure ondulée — rencontre pas encore jouée.
<!-- /i18n:tax_desc_pending --></span>
</div>
</div>

</div>

<!-- i18n:map -->
# La carte

## Choroplèthe et drapeaux

Chaque pays est coloré selon son bilan net de talent — contribution locale (exports plus joueurs natifs) moins les imports (voir *La légende*, ci-dessous). Plus ce bilan est marqué, dans un sens ou dans l'autre, plus la teinte est foncée ; un pays proche de l'équilibre neutre apparaît pâle. Les pays sans donnée pour cette mesure apparaissent dans un ton pâle neutre.
Les pays actuellement inclus dans le filtre affichent un drapeau circulaire.

![Drapeaux des équipes qualifiées](screenshots/qualified_flags.png)

## Zoom et déplacement

Faites défiler (ou pincez) pour zoomer · faites glisser pour déplacer. Deux boutons ronds se trouvent dans la barre sous la carte, à gauche de la légende :

- <img class="gp-icon" src="images/solar_linear/global-svgrepo-com.svg" alt="réinitialiser"> dézoome vers la vue par défaut — tous les pays réellement affichés par la carte, ajustés dans le cadre. Une poignée de petits territoires n'ont aucune présence sur la carte et ne sont jamais inclus ; voir *Hors carte*, ci-dessus.
- <img class="gp-icon" src="images/solar_linear/maximize-square-2-svgrepo-com.svg" alt="ajuster"> zoome et déplace pour faire tenir tout ce qui est actuellement visible sur la carte — tous les drapeaux affichés par défaut, ou seulement l'ensemble mis en évidence pendant qu'un pays est sélectionné (ou qu'un groupe de la phase de groupes est isolé).

## La légende

La carte colore chaque pays selon son bilan net de talent — contribution locale (exports plus joueurs natifs) moins les imports. Les exportateurs nets et les importateurs nets se lisent en deux couleurs différentes de part et d'autre d'un point neutre.

La barre de couleur en bas de l'en-tête se lit de gauche à droite comme une droite numérique — extrême négatif, 0 neutre au milieu, extrême positif — avec une graduation de référence à chaque extrémité et au milieu, et un point isolé *à chaque extrémité* pour le pays le plus hors échelle de ce côté (plus gros importateur net, plus gros exportateur net).

![Légende](screenshots/legend.png)

Les deux points isolés sont toujours les deux mêmes pays : **Curaçao**, le plus gros importateur net (tout son effectif est né aux Pays-Bas), du côté négatif, et **France**, le plus gros exportateur net, du côté positif.

## Infobulles

Survolez un pays pour voir les détails. Les infobulles ne s'affichent pas sur mobile.

- **Pays de naissance** : nombre d'exports et meilleurs joueurs, chacun avec le drapeau de destination
- **Pays qualifiés qui recrutent aussi** : une colonne de droite ajoute le côté import
- **Pays de naissance non qualifiés** : un badge *non qualifié* remplace le panneau de sélection
<!-- /i18n:map -->

<!-- i18n:bottom_panel -->
# Le panneau inférieur

La zone défilante sous la carte comporte trois onglets.

## <img class="gp-icon" src="images/solar_linear/ranking-svgrepo-com.svg" alt=""> La liste des pays

L'onglet par défaut liste tous les pays — qualifiés ou non — sous forme de pastilles, sans carrousel de tournoi.
Le panneau de contrôle détermine quelles pastilles apparaissent et dans quel ordre ;
le tri par défaut est par [classement Elo mondial](https://www.eloratings.net/).

Cliquer sur une pastille sélectionne ce pays et zoome la carte dessus.

Pour les pays avec des connexions **né ici / joue pour**, des flèches colorées apparaissent aussi sur la carte :

- {{ARROW_BLUE}} **flèches bleues** : sélections qui incluent des joueurs nés dans le pays sélectionné
- {{ARROW_RED}} **flèches rouges** : pays où des joueurs nés ailleurs jouent pour cette sélection

*L'épaisseur des flèches varie selon le nombre de joueurs.*

Les boutons de zoom décrits dans *Zoom et déplacement*, ci-dessus, se comportent de la même façon ici : **ajuster** fait alors tenir précisément les pays mis en évidence, **réinitialiser** revient à la vue par défaut.

Cliquez à nouveau sur la pastille active, cliquez ailleurs sur la carte, ou appuyez sur **Échap** pour désélectionner.

## <img class="gp-icon" src="images/world-cup-svgrepo-com.svg" alt=""> Tournoi

La même liste de pastilles, cette fois limitée aux 48 pays **qualifiés**, avec un petit carrousel au-dessus parcourant sept positions : **Phase de groupes → 16es de finale → 8es de finale → Quarts de finale → Demi-finales → Finale → Vainqueur**.

- Utilisez les flèches ‹ ›, ou faites glisser vers la gauche/droite sur écran tactile, pour changer de phase.
- Chaque position filtre les pays qualifiés jusqu'à ceux qui ont « atteint » cette phase — encore en lice à son coup d'envoi, ou l'ayant déjà remportée.
- La navigation est limitée à la phase la plus avancée réellement atteinte par le tournoi ; les positions suivantes restent verrouillées tant que les matchs correspondants ne sont pas joués.

Le carrousel est le seul filtre qui s'applique ici : l'avancer jusqu'aux, disons, 8es de finale affiche exactement
les équipes ayant atteint cette phase, quels que soient les cases cochées du panneau de contrôle ou le filtre de
confédération — ceux-ci n'affectent que l'onglet Équipes par défaut, qui n'a pas de notion de phase.
Les pays non qualifiés n'apparaissent jamais dans cet onglet non plus, quelles que soient leurs propres cases cochées.

À la **phase de groupes**, la liste de pastilles est remplacée par les classements de groupe — les 12 groupes (A–L) affichés ensemble par défaut, ou réduits à un seul via le sélecteur, avec le résultat de chaque match et les équipes qualifiées pour les 16es mises en évidence selon les résultats réels (un match nul ne donne de coche à personne).

Passé la phase de groupes, les pays sont automatiquement regroupés par rencontre : chaque ligne apparie les deux adversaires de part et d'autre de la date/du score —

- Pas encore joué : la date du coup d'envoi, et une bordure ondulée en haut et en bas des deux pastilles — un aspect « en cours de décision » pour une rencontre qui peut encore tourner dans un sens ou dans l'autre.
- Joué : le score (plus le résultat des tirs au but, le cas échéant) à la place de la date, et le drapeau de l'équipe perdante grisé.

À la position **Finale**, les deux perdants des demi-finales forment leur propre paire — la petite finale — dans une liste distincte et intitulée sous la vraie finale, pour que les deux rencontres ne soient jamais mélangées.

Cliquer sur une pastille, les flèches et les boutons de zoom se comportent tous de la même façon ici que dans *La liste des pays*, ci-dessus.

## <img class="gp-icon" src="images/solar_linear/user-circle-svgrepo-com.svg" alt=""> Le tableau des joueurs

Toujours le même tableau à plat — **nom**, **né dans**, **joue pour**, **sélections** — quelle que soit la sélection en cours. Cliquez sur un en-tête de colonne pour trier selon ce critère ; cliquez à nouveau pour inverser l'ordre. Les noms des joueurs renvoient vers leur page Wikipedia dans la langue de l'interface lorsqu'elle est disponible.

Seules les lignes changent selon la sélection en cours :

- **Aucune sélection** : tous les joueurs et entraîneurs des 48 sélections qualifiées actuellement visibles sur la carte.
- **Un pays sélectionné** : tous les joueurs et entraîneurs qui lui sont liés — nés là-bas, nés et sélectionnés là-bas, ou nés ailleurs et sélectionnés là-bas.
- **Une rencontre sélectionnée** : les joueurs des deux équipes combinés.

La ligne **afficher** du panneau de contrôle (voir ci-dessus) affine encore ces lignes tant que cet onglet est ouvert.

Sans sélection, les villes de naissance sont aussi représentées sur la carte sous forme de bulles — un point par ville de naissance unique parmi les joueurs listés, plus grand là où plus de joueurs partagent une même ville :

![Bulles des villes de naissance](screenshots/bubbles.png)

Survolez un point pour voir le nom de la ville et les joueurs qui y sont nés.

## <img class="gp-icon" src="images/wc2026.svg" alt=""> Chaînes

Des séquences de pays reliés par des connexions né ici / joue pour — un joueur né en A joue pour B, un joueur né en B joue pour C, et ainsi de suite, formant une chaîne de nationalités à travers le tournoi — sont explorées sur leur propre [page dédiée](/chains/wc2026_chain_longest.html).
<!-- /i18n:bottom_panel -->
