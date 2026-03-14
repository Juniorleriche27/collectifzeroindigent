const fs = require('fs');
const ts = require('typescript');
const { execFileSync } = require('child_process');

const files = execFileSync('rg', ['--files', 'app', 'components', 'lib', '-g', '*.ts', '-g', '*.tsx'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);

function replaceText(input) {
  let text = input;
  const exact = [
    ['Collectif Zero Indigent', 'Collectif Zéro Indigent'],
    ['A propos du CZI', 'À propos du CZI'],
    ['A propos', 'À propos'],
    ['Communiques', 'Communiqués'],
    ['Communaute CZI', 'Communauté CZI'],
    ['Communaute', 'Communauté'],
    ['Communautes', 'Communautés'],
    ['Parametres', 'Paramètres'],
    ['Communes/Regions', 'Communes/Régions'],
    ['Campagnes email', 'Campagnes e-mail'],
    ['Mot de passe oublie ?', 'Mot de passe oublié ?'],
    ['Mot de passe oublie', 'Mot de passe oublié'],
    ['Reinitialiser le mot de passe', 'Réinitialiser le mot de passe'],
    ['Un email de reinitialisation a ete envoye. Ouvrez le lien pour definir un nouveau mot de passe.', 'Un e-mail de réinitialisation a été envoyé. Ouvrez le lien pour définir un nouveau mot de passe.'],
    ['Session de reinitialisation invalide ou expiree.', 'Session de réinitialisation invalide ou expirée.'],
    ['Le mot de passe doit contenir au moins 8 caracteres.', 'Le mot de passe doit contenir au moins 8 caractères.'],
    ['Mot de passe mis a jour. Redirection vers la connexion...', 'Mot de passe mis à jour. Redirection vers la connexion...'],
    ['Lien invalide ou expire. Redemandez un nouvel email de reinitialisation.', 'Lien invalide ou expiré. Redemandez un nouvel e-mail de réinitialisation.'],
    ['Verification de la session...', 'Vérification de la session...'],
    ['Creez un compte pour demarrer votre onboarding.', 'Créez un compte pour démarrer votre inscription.'],
    ['Compte cree. Verifiez votre email pour confirmer l\'inscription, puis connectez-vous.', 'Compte créé. Vérifiez votre e-mail pour confirmer l\'inscription, puis connectez-vous.'],
    ['Creation...', 'Création...'],
    ['Creer mon compte', 'Créer mon compte'],
    ['Deja inscrit?', 'Déjà inscrit ?'],
    ['Accedez a votre espace membre pour continuer.', 'Accédez à votre espace membre pour continuer.'],
    ['Supabase non configure. Ajoutez les variables d\'environnement.', 'Supabase non configuré. Ajoutez les variables d\'environnement.'],
    ['Contribuer a eliminer l\'extreme pauvrete et la faim.', 'Contribuer à éliminer l\'extrême pauvreté et la faim.'],
    ['Le collectif est fonde le 17 avril 2020.', 'Le collectif est fondé le 17 avril 2020.'],
    ['Annee de creation', 'Année de création'],
    ['Axe structurants', 'Axes structurants'],
    ['Promouvoir l\'autonomisation economique des femmes et des jeunes.', 'Promouvoir l\'autonomisation économique des femmes et des jeunes.'],
    ['Contribuer a l\'amelioration de la sante des populations.', 'Contribuer à l\'amélioration de la santé des populations.'],
    ['Faciliter la transition ecole-marche du travail des jeunes.', 'Faciliter la transition école-marché du travail des jeunes.'],
    ['Promouvoir des mecanismes d\'inclusion pour les publics vulnerables.', 'Promouvoir des mécanismes d\'inclusion pour les publics vulnérables.'],
    ['Developper la resilience face au rechauffement climatique.', 'Développer la résilience face au réchauffement climatique.'],
    ['Renforcer la collaboration Etat-jeunesse pour la paix sociale.', 'Renforcer la collaboration État-jeunesse pour la paix sociale.'],
    ['Citoyennete et developpement local', 'Citoyenneté et développement local'],
    ['Sante et bien-etre', 'Santé et bien-être'],
    ['Inclusion, securite et droits humains', 'Inclusion, sécurité et droits humains'],
    ['Insertion professionnelle et croissance economique', 'Insertion professionnelle et croissance économique'],
    ['Climat et energies renouvelables', 'Climat et énergies renouvelables'],
    ['transformer l engagement citoyen en impact concret pour les communautes.', 'transformer l\'engagement citoyen en impact concret pour les communautés.'],
    ['Acceder a la plateforme', 'Accéder à la plateforme'],
    ['Une jeunesse qui agit pour des communautes plus resilientes.', 'Une jeunesse qui agit pour des communautés plus résilientes.'],
    ['Le Collectif Zero Indigent est un reseau de jeunes, d associations et d entrepreneurs mobilises pour', 'Le Collectif Zéro Indigent est un réseau de jeunes, d\'associations et d\'entrepreneurs mobilisés pour'],
    ['accelerer l atteinte des ODD, avec un focus prioritaire sur la lutte contre la pauvrete et', 'accélérer l\'atteinte des ODD, avec un focus prioritaire sur la lutte contre la pauvreté et'],
    ['Â« Faire de chaque jeune un acteur engage dans l atteinte des ODD. Â»', '« Faire de chaque jeune un acteur engagé dans l\'atteinte des ODD. »'],
    ['Contribuer, grace a la synergie d actions des jeunes, a l atteinte des ODD.', 'Contribuer, grâce à la synergie d\'actions des jeunes, à l\'atteinte des ODD.'],
    ['Outiller, orienter et accompagner la jeunesse vers l insertion et l impact local.', 'Outiller, orienter et accompagner la jeunesse vers l\'insertion et l\'impact local.'],
    ['Le Collectif Zero Indigent (CZI) est un cadre d engagement citoyen et entrepreneurial fonde par des', 'Le Collectif Zéro Indigent (CZI) est un cadre d\'engagement citoyen et entrepreneurial fondé par des'],
    ['Cette demande n\'est plus modifiable depuis votre espace car elle est deja en', 'Cette demande n\'est plus modifiable depuis votre espace car elle est déjà en'],
    ['Paiement bientot disponible', 'Paiement bientôt disponible'],
    ['Demande, photo et mode de remise de votre carte membre a 2900 F.', 'Demande, photo et mode de remise de votre carte membre à 2900 F.'],
    ['La carte membre devient disponible apres la creation de votre fiche membre.', 'La carte membre devient disponible après la création de votre fiche membre.'],
    ['Completer l\'onboarding', 'Compléter l\'inscription'],
    ['Aller au dashboard', 'Aller au tableau de bord'],
    ['Aucune photo enregistree.', 'Aucune photo enregistrée.'],
    ['Photo enregistree.', 'Photo enregistrée.'],
    ['Contact a definir', 'Contact à définir'],
    ['Photo rejetee', 'Photo rejetée'],
    ['precisez la remise', 'précisez la remise'],
    ['Commune, quartier, precision de remise', 'Commune, quartier, précision de remise'],
    ['Mettre a jour la demande', 'Mettre à jour la demande'],
    ['Demandee', 'Demandée'],
    ['Non demandee', 'Non demandée'],
    ['A completer', 'À compléter'],
    ['A fournir', 'À fournir'],
    ['Photo recue', 'Photo reçue'],
    ['Photo validee', 'Photo validée'],
    ['La photo est bien enregistree et pourra etre utilisee pour la generation.', 'La photo est bien enregistrée et pourra être utilisée pour la génération.'],
    ['Ajoutez une photo pour permettre l\'edition de la carte.', 'Ajoutez une photo pour permettre l\'édition de la carte.'],
    ['Numero', 'Numéro'],
    ['Non paye', 'Non payé'],
    ['Paye', 'Payé'],
    ['Echec', 'Échec'],
    ['Rembourse', 'Remboursé'],
    ['Prete', 'Prête'],
    ['Imprimee', 'Imprimée'],
    ['Livree', 'Livrée'],
    ['Annulee', 'Annulée'],
    ['Selectionner une region', 'Sélectionner une région'],
    ['Selectionner une prefecture', 'Sélectionner une préfecture'],
    ['Selectionner une commune', 'Sélectionner une commune'],
    ['Selectionner d\'abord une region', 'Sélectionner d\'abord une région'],
    ['Quartier/Localite (optionnel)', 'Quartier/localité (optionnel)'],
    ['Disponible pour activites hors commune', 'Disponible pour activités hors commune'],
    ['Zones de mobilite (optionnel)', 'Zones de mobilité (optionnel)'],
    ['Personal', 'Personnel'],
    ['Enterprise', 'Entreprise'],
    ['Jeune engage', 'Jeune engagé'],
    ['Responsable organisation', 'Responsable d\'organisation'],
    ['Frequence d\'engagement', 'Fréquence d\'engagement'],
    ['Action recente', 'Action récente'],
    ['Decrivez une action recente', 'Décrivez une action récente'],
    ['Stade business', 'Stade de l\'activité'],
    ['Idee', 'Idée'],
    ['Secteur business', 'Secteur d\'activité'],
    ['Besoins business', 'Besoins de l\'activité'],
    ['Role dans l\'organisation', 'Rôle dans l\'organisation'],
    ['Nom organisation declaree', 'Nom de l\'organisation déclarée'],
    ['Competences (separees par virgules)', 'Compétences (séparées par des virgules)'],
    ['Centres d\'interet (virgules)', 'Centres d\'intérêt (séparés par des virgules)'],
    ['Quel est votre objectif principal sur 3 a 6 mois ?', 'Quel est votre objectif principal sur 3 à 6 mois ?'],
    ['Disponibilite (optionnel)', 'Disponibilité (optionnel)'],
    ['Preference de contact', 'Préférence de contact'],
    ['Je souhaite une demande partenaire organisation', 'Je souhaite soumettre une demande de partenariat pour mon organisation'],
    ['Type organisation', 'Type d\'organisation'],
    ['J\'accepte l\'usage IA agrege/anonyme (optionnel)', 'J\'accepte l\'usage d\'une IA agrégée/anonyme (optionnel)'],
    ['Verifiez vos informations, puis cliquez sur', 'Vérifiez vos informations, puis cliquez sur'],
    ['Vos donnees sont sauvegardees localement a chaque etape tant que la soumission finale', 'Vos données sont sauvegardées localement à chaque étape tant que la soumission finale'],
    ['Apres validation de votre fiche, vous retrouverez la nouvelle page', 'Après validation de votre fiche, vous retrouverez la nouvelle page'],
    ['Chargement des donnees...', 'Chargement des données...'],
    ['Wizard onboarding: etape', 'Parcours d\'inscription : étape'],
    ['Precedent', 'Précédent'],
    ['Creation en cours...', 'Création en cours...'],
    ['Terminer l\'onboarding', 'Terminer l\'inscription'],
    ['Flux de donnees', 'Flux de données'],
    ['Point d\'entree pour les operations de migration de donnees.', 'Point d\'entrée pour les opérations de migration de données.'],
    ['Import de donnees', 'Import de données'],
    ['Export de donnees', 'Export de données'],
    ['Votre profil est deja complete. Ouvrez directement le dashboard.', 'Votre profil est déjà complété. Ouvrez directement le tableau de bord.'],
    ['Configuration territoriale incomplete (region/prefecture/commune). Ajoutez ces donnees dans Supabase avant de terminer l\'onboarding.', 'Configuration territoriale incomplète (région/préfecture/commune). Ajoutez ces données dans Supabase avant de terminer l\'inscription.'],
    ['Impossible de charger region/prefecture/commune pour le moment.', 'Impossible de charger région/préfecture/commune pour le moment.'],
    ['Etape 1: renseignez prenom, nom et telephone.', 'Étape 1 : renseignez prénom, nom et téléphone.'],
    ['Etape 1: date de naissance ou tranche d\'age obligatoire.', 'Étape 1 : la date de naissance ou la tranche d\'âge est obligatoire.'],
    ['Etape 1: niveau d\'education et statut professionnel obligatoires.', 'Étape 1 : le niveau d\'éducation et le statut professionnel sont obligatoires.'],
    ['Etape 2: selectionnez region, prefecture et commune.', 'Étape 2 : sélectionnez région, préfecture et commune.'],
    ['Etape 3: type d\'inscription invalide.', 'Étape 3 : type d\'inscription invalide.'],
    ['Etape 3: cellule principale invalide.', 'Étape 3 : cellule principale invalide.'],
    ['Etape 3: cellule secondaire invalide.', 'Étape 3 : cellule secondaire invalide.'],
    ['Etape 3: nom d\'association/entreprise obligatoire.', 'Étape 3 : le nom de l\'association ou de l\'entreprise est obligatoire.'],
    ['Etape 3: profil engage incomplet (domaines/frequence/action).', 'Étape 3 : profil engagé incomplet (domaines/fréquence/action).'],
    ['Etape 3: profil entrepreneur incomplet (stade/secteur/besoins).', 'Étape 3 : profil entrepreneur incomplet (stade/secteur/besoins).'],
    ['Etape 3: profil responsable incomplet (role/organisation).', 'Étape 3 : profil responsable incomplet (rôle/organisation).'],
    ['Etape 4: competences, interets et objectif sont obligatoires.', 'Étape 4 : compétences, intérêts et objectif sont obligatoires.'],
    ['Etape 4: selectionnez entre 1 et 3 ODD prioritaires.', 'Étape 4 : sélectionnez entre 1 et 3 ODD prioritaires.'],
    ['Etape 5: au moins un type de support est obligatoire.', 'Étape 5 : au moins un type de support est obligatoire.'],
    ['Etape 5: preference de contact invalide.', 'Étape 5 : préférence de contact invalide.'],
    ['Etape 5: type organisation obligatoire pour demande partenaire.', 'Étape 5 : le type d\'organisation est obligatoire pour une demande de partenariat.'],
    ['Etape 5: nom organisation obligatoire pour demande partenaire.', 'Étape 5 : le nom de l\'organisation est obligatoire pour une demande de partenariat.'],
    ['Etape 6: vous devez accepter les conditions d\'utilisation.', 'Étape 6 : vous devez accepter les conditions d\'utilisation.'],
    ['Retour a la', 'Retour à la'],
    ['Â©', '©'],
  ];

  for (const [from, to] of exact) {
    text = text.split(from).join(to);
  }

  const regexes = [
    [/\b([Rr])eseau\b/g, (_, c) => c === 'R' ? 'Réseau' : 'réseau'],
    [/\b([Dd])onnees\b/g, (_, c) => c === 'D' ? 'Données' : 'données'],
    [/\b([Pp])riorite\b/g, (_, c) => c === 'P' ? 'Priorité' : 'priorité'],
    [/\b([Pp])refecture\b/g, (_, c) => c === 'P' ? 'Préfecture' : 'préfecture'],
    [/\b([Pp])refectures\b/g, (_, c) => c === 'P' ? 'Préfectures' : 'préfectures'],
    [/\b([Rr])egion\b/g, (_, c) => c === 'R' ? 'Région' : 'région'],
    [/\b([Rr])egions\b/g, (_, c) => c === 'R' ? 'Régions' : 'régions'],
    [/\b([Dd])eveloppement\b/g, (_, c) => c === 'D' ? 'Développement' : 'développement'],
    [/\b([Cc])itoyennete\b/g, (_, c) => c === 'C' ? 'Citoyenneté' : 'citoyenneté'],
    [/\b([Ss])ante\b/g, (_, c) => c === 'S' ? 'Santé' : 'santé'],
    [/\bbien-etre\b/g, 'bien-être'],
    [/\bsecurite\b/g, 'sécurité'],
    [/\benergies\b/g, 'énergies'],
    [/\b([Ee])conomique\b/g, (_, c) => c === 'E' ? 'Économique' : 'économique'],
    [/\b([Ee])conomiques\b/g, (_, c) => c === 'E' ? 'Économiques' : 'économiques'],
    [/\b([Rr])echauffement\b/g, (_, c) => c === 'R' ? 'Réchauffement' : 'réchauffement'],
    [/\b([Rr])esilience\b/g, (_, c) => c === 'R' ? 'Résilience' : 'résilience'],
    [/\b([Aa])melioration\b/g, (_, c) => c === 'A' ? 'Amélioration' : 'amélioration'],
    [/\b([Cc])ompetences\b/g, (_, c) => c === 'C' ? 'Compétences' : 'compétences'],
    [/\b([Ii])nterets\b/g, (_, c) => c === 'I' ? 'Intérêts' : 'intérêts'],
    [/\b([Dd])isponibilite\b/g, (_, c) => c === 'D' ? 'Disponibilité' : 'disponibilité'],
    [/\b([Pp])reference\b/g, (_, c) => c === 'P' ? 'Préférence' : 'préférence'],
    [/\b([Rr])ecente\b/g, (_, c) => c === 'R' ? 'Récente' : 'récente'],
    [/\b([Dd])ecrivez\b/g, (_, c) => c === 'D' ? 'Décrivez' : 'décrivez'],
    [/\b([Pp])auvrete\b/g, (_, c) => c === 'P' ? 'Pauvreté' : 'pauvreté'],
    [/\b([Ee])xtreme\b/g, (_, c) => c === 'E' ? 'Extrême' : 'extrême'],
    [/\b([Ff])onde\b/g, (_, c) => c === 'F' ? 'Fondé' : 'fondé'],
    [/\b([Ff])ondee\b/g, (_, c) => c === 'F' ? 'Fondée' : 'fondée'],
    [/\b([Cc])onstitue\b/g, (_, c) => c === 'C' ? 'Constitué' : 'constitué'],
    [/\b([Cc])onstituee\b/g, (_, c) => c === 'C' ? 'Constituée' : 'constituée'],
    [/\b([Cc])oncretes\b/g, (_, c) => c === 'C' ? 'Concrètes' : 'concrètes'],
    [/\b([Mm])obilite\b/g, (_, c) => c === 'M' ? 'Mobilité' : 'mobilité'],
    [/\blocalite\b/g, 'localité'],
    [/\bcaracteres\b/g, 'caractères'],
    [/\bexpiree\b/g, 'expirée'],
    [/\bexpire\b/g, 'expiré'],
    [/\benvoye\b/g, 'envoyé'],
    [/\bdefinir\b/g, 'définir'],
    [/\bVerifiez\b/g, 'Vérifiez'],
    [/\bverifiez\b/g, 'vérifiez'],
    [/\bprecisez\b/g, 'précisez'],
    [/\bprecision\b/g, 'précision'],
    [/\benregistree\b/g, 'enregistrée'],
    [/\betre\b/g, 'être'],
    [/\butilisee\b/g, 'utilisée'],
    [/\bgeneration\b/g, 'génération'],
    [/\bedition\b/g, 'édition'],
    [/\brecue\b/g, 'reçue'],
    [/\bRecue\b/g, 'Reçue'],
    [/\bvalidee\b/g, 'validée'],
    [/\bValidee\b/g, 'Validée'],
    [/\bcompleter\b/g, 'compléter'],
    [/\bcomplete\b/g, 'complété'],
    [/\bComplete\b/g, 'Complété'],
    [/\bReduire\b/g, 'Réduire'],
    [/\bdemarrer\b/g, 'démarrer'],
    [/\bc est\b/g, 'c\'est'],
    [/\bC est\b/g, 'C\'est'],
    [/\bn est\b/g, 'n\'est'],
    [/\bs il\b/g, 's\'il'],
    [/\bqu il\b/g, 'qu\'il'],
    [/\bd abord\b/g, 'd\'abord'],
    [/\baujourd hui\b/g, 'aujourd\'hui'],
    [/\bl atteinte\b/g, 'l\'atteinte'],
    [/\bl accent\b/g, 'l\'accent'],
    [/\bl accompagnement\b/g, 'l\'accompagnement'],
    [/\bl amelioration\b/g, 'l\'amélioration'],
    [/\bl engagement\b/g, 'l\'engagement'],
    [/\bl insertion\b/g, 'l\'insertion'],
    [/\bl entrepreneuriat\b/g, 'l\'entrepreneuriat'],
    [/\bl autonomisation\b/g, 'l\'autonomisation'],
    [/\bl usage\b/g, 'l\'usage'],
    [/\bd actions\b/g, 'd\'actions'],
    [/\bd associations\b/g, 'd\'associations'],
    [/\bd entrepreneurs\b/g, 'd\'entrepreneurs'],
    [/\bd engagement\b/g, 'd\'engagement'],
    [/\bd utilisation\b/g, 'd\'utilisation'],
    [/\bd une\b/g, 'd\'une'],
    [/\bl ODD\b/g, 'l\'ODD'],
    [/Â«/g, '«'],
    [/Â»/g, '»'],
  ];

  for (const [pattern, replacement] of regexes) {
    text = text.replace(pattern, replacement);
  }

  return text;
}

function collect(node, sourceFile, ranges) {
  const kind = node.kind;
  if (kind === ts.SyntaxKind.StringLiteral || kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
    ranges.push([node.getStart(sourceFile, false) + 1, node.end - 1]);
  } else if (kind === ts.SyntaxKind.TemplateHead || kind === ts.SyntaxKind.TemplateMiddle) {
    ranges.push([node.getStart(sourceFile, false) + 1, node.end - 2]);
  } else if (kind === ts.SyntaxKind.TemplateTail) {
    ranges.push([node.getStart(sourceFile, false) + 1, node.end - 1]);
  } else if (kind === ts.SyntaxKind.JsxText) {
    ranges.push([node.getStart(sourceFile, false), node.end]);
  }
  ts.forEachChild(node, (child) => collect(child, sourceFile, ranges));
}

let changed = 0;
for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, original, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const ranges = [];
  collect(sf, sf, ranges);
  ranges.sort((a, b) => b[0] - a[0]);
  let next = original;
  let touched = false;
  for (const [start, end] of ranges) {
    if (end <= start) continue;
    const before = next.slice(start, end);
    const after = replaceText(before);
    if (before !== after) {
      next = next.slice(0, start) + after + next.slice(end);
      touched = true;
    }
  }
  if (touched) {
    fs.writeFileSync(file, next, 'utf8');
    changed += 1;
  }
}

console.log(`Safely updated ${changed} files`);
