<!-- i18n:auth_page_title -->
# Connexion au serveur
<!-- /i18n:auth_page_title -->

<!-- i18n:auth_intro -->
Cette application communique avec un petit serveur — hébergé sur la machine du développeur — pour la connexion, les mises à jour des matchs en direct et la mémorisation de votre session entre deux visites. Cette connexion peut se trouver dans l'un de ces quatre états, du meilleur au pire. Celui marqué ci-dessous est ce qui se passe en ce moment.
<!-- /i18n:auth_intro -->

<div class="ga-state" data-ga-state="online">

<!-- i18n:auth_state_online -->
## Connecté

Tout fonctionne : vous pouvez vous connecter, la page du match en direct se met à jour en temps réel, et votre session est mémorisée lors de votre prochaine visite. L'icône en haut à droite affiche votre photo de profil, ou un simple bouton de connexion si vous n'êtes pas connecté — aucune icône d'avertissement.
<!-- /i18n:auth_state_online -->

</div>

<div class="ga-state" data-ga-state="connection">

<!-- i18n:auth_state_connection -->
## Serveur injoignable

Votre connexion internet fonctionne, mais le serveur lui-même ne répond pas — il est peut-être éteint, ou sa connexion à internet a été coupée. La connexion, votre session et la page du match en direct sont suspendues ; la carte, le classement des pays, la liste des joueurs et tous les filtres/tris décrits dans l'autre guide continuent de fonctionner normalement, puisque rien de tout cela ne dépend du serveur.

Touchez l'icône d'avertissement pour obtenir un lien WhatsApp — envoyez un message à ce numéro et le serveur peut généralement être relancé en quelques minutes. Inutile de recharger la page : l'application retente la connexion en arrière-plan et se rétablit d'elle-même dès que le serveur répond à nouveau.
<!-- /i18n:auth_state_connection -->

</div>

<div class="ga-state" data-ga-state="server">

<!-- i18n:auth_state_server -->
## Serveur non configuré

Un cas plus rare : l'application n'a même pas d'adresse à essayer pour le serveur. C'est un accroc de déploiement plutôt qu'une panne en direct, il n'y a donc pas de raccourci WhatsApp pour celui-ci — il faut une correction côté code plutôt qu'un simple redémarrage. L'effet pratique est le même que « serveur injoignable » ci-dessus : la connexion et la page du match en direct sont suspendues, tout le reste fonctionne normalement.
<!-- /i18n:auth_state_server -->

</div>

<div class="ga-state" data-ga-state="offline">

<!-- i18n:auth_state_offline -->
## Pas de connexion internet

Rien de ce qui nécessite le réseau ne fonctionne en ce moment — pas seulement la connexion, mais aussi la récupération de nouvelles données, les mises à jour en direct, ou même le rechargement de ce guide. Reconnectez votre appareil et l'application se rétablit automatiquement, sans besoin de recharger la page.
<!-- /i18n:auth_state_offline -->

</div>
