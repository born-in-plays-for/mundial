<!-- i18n:auth_page_title -->
# Connexion au serveur
<!-- /i18n:auth_page_title -->

<!-- i18n:auth_intro -->
Cette application communique avec un petit serveur — hébergé sur la machine du développeur — pour la connexion, les mises à jour des matchs en direct et la mémorisation de votre session entre deux visites. Cette connexion peut se trouver dans l'un de ces quatre états, du meilleur au pire. Celui marqué ci-dessous est ce qui se passe en ce moment.
<!-- /i18n:auth_intro -->

<div class="ga-state" data-ga-state="online">

<!-- i18n:auth_state_online -->
<img class="ga-icon" src="/images/solar_linear/square-bottom-up-svgrepo-com.svg" alt="">

## Connecté

Tout fonctionne : vous pouvez vous connecter, la page du match en direct se met à jour en temps réel, et votre session est mémorisée lors de votre prochaine visite. L'icône en haut à droite affiche votre photo de profil, ou un simple bouton de connexion si vous n'êtes pas connecté — aucune icône d'avertissement.
<!-- /i18n:auth_state_online -->

</div>

<div class="ga-state" data-ga-state="connection">

<!-- i18n:auth_state_connection -->
<img class="ga-icon" src="/images/database-error-svgrepo-com.svg" alt="">

## Serveur injoignable

Votre connexion internet fonctionne, mais le serveur lui-même ne répond pas — il est peut-être éteint, ou sa connexion à internet a été coupée. La connexion, votre session et la page du match en direct sont suspendues ; la carte, le classement des pays, la liste des joueurs et tous les filtres/tris décrits dans l'autre guide continuent de fonctionner normalement, puisque rien de tout cela ne dépend du serveur.

Touchez l'icône d'avertissement pour obtenir un lien WhatsApp — envoyez un message à ce numéro et le serveur peut généralement être relancé en quelques minutes. Inutile de recharger la page : l'application retente la connexion en arrière-plan et se rétablit d'elle-même dès que le serveur répond à nouveau.
<!-- /i18n:auth_state_connection -->

</div>

<div class="ga-state" data-ga-state="server">

<!-- i18n:auth_state_server -->
<img class="ga-icon" src="/images/settings-off-svgrepo-com.svg" alt="">

## Serveur non configuré

Un cas plus rare : l'application n'a même pas d'adresse à essayer pour le serveur. C'est un accroc de déploiement plutôt qu'une panne en direct, il n'y a donc pas de raccourci WhatsApp pour celui-ci — il faut une correction côté code plutôt qu'un simple redémarrage. L'effet pratique est le même que « serveur injoignable » ci-dessus : la connexion et la page du match en direct sont suspendues, tout le reste fonctionne normalement.
<!-- /i18n:auth_state_server -->

</div>

<div class="ga-state" data-ga-state="offline">

<!-- i18n:auth_state_offline -->
<img class="ga-icon" src="/images/wifi-off-svgrepo-com.svg" alt="">

## Pas de connexion internet

Rien de ce qui nécessite le réseau ne fonctionne en ce moment — pas seulement la connexion, mais aussi la récupération de nouvelles données, les mises à jour en direct, ou même le rechargement de ce guide. Reconnectez votre appareil et l'application se rétablit automatiquement, sans besoin de recharger la page.
<!-- /i18n:auth_state_offline -->

</div>

<!-- i18n:auth_after_connect -->
# Une fois connecté

<div class="ga-feature">

<img class="ga-icon" src="/images/solar_linear/square-bottom-up-svgrepo-com.svg" alt="">

### Connexion Google

Pour l'instant, la connexion n'a d'importance que pour Christophe lui-même — l'unique compte administrateur du site. Connecté en tant qu'administrateur, la photo de profil dans la barre de navigation renvoie vers la page de gestion des utilisateurs et des sessions du serveur, et la page du match en direct affiche une icône de paramètres supplémentaire menant aux contrôles des rencontres et de la découverte.

Pour tout le monde d'autre, se connecter ne fait pour l'instant que mémoriser votre identité entre deux visites — il n'y a aucune fonctionnalité réservée aux administrateurs que vous manqueriez. D'autres fonctionnalités réservées aux visiteurs connectés pourraient arriver plus tard.

Dans la barre de navigation elle-même : avant de vous connecter, vous ne voyez que l'icône de connexion (<img class="gp-icon" src="/images/solar_linear/square-bottom-up-svgrepo-com.svg" alt="">). Après vous être connecté, celle-ci est remplacée par votre photo de profil (<img class="gp-icon" src="/images/Christophe.jpg" alt="" style="border-radius:50%"> — celle de Christophe lui-même, montrée ici à titre d'exemple ; la vôtre sera votre véritable photo de compte Google) à côté d'une petite icône de déconnexion (<img class="gp-icon" src="/images/solar_linear/square-bottom-down-svgrepo-com.svg" alt="">).

</div>

<div class="ga-feature">

<img class="ga-icon" src="/images/solar_linear/radio-minimalistic-svgrepo-com.svg" alt="">

### Mises à jour des matchs en direct

La page du match en direct affiche en temps réel les événements, statistiques et compositions des matchs de la Coupe du Monde 2026 — accessible à tous, connecté ou non. Elle utilise la même connexion au serveur décrite ci-dessus, donc son propre état suit les quatre états ci-dessus : en direct et à jour lorsque tout fonctionne, en pause avec la même icône d'avertissement dès que le serveur est injoignable ou que vous êtes hors ligne.

Une fois connecté, ce badge reflète aussi un état de suivi plus précis :

- **live** *(vert)* — un match est suivi ; les événements, statistiques et compositions se mettent à jour en temps réel.
- **à l'écoute** *(bleu)* — le serveur surveille les matchs, mais aucun n'est actif pour le moment.
- **Le serveur ne voit rien, n'entend rien, ne dit rien** *(gris)* — le serveur ne surveille aucun match pour le moment. Cliquez sur le badge pour obtenir un lien WhatsApp et demander à Christophe de le réactiver.

</div>
<!-- /i18n:auth_after_connect -->
