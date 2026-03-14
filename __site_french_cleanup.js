const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const ROOT = process.cwd();
const TARGET_DIRS = ["app", "components", "lib"];
const FILE_EXTENSIONS = new Set([".ts", ".tsx"]);

const replacements = [
  ["campaign-rï¿½gion", "campaign-region"],
  ["campaign-prï¿½fecture", "campaign-prefecture"],
  ["communique-rï¿½gion", "communique-region"],
  ["communique-prï¿½fecture", "communique-prefecture"],
  ["edit-communique-rï¿½gion", "edit-communique-region"],
  ["edit-communique-prï¿½fecture", "edit-communique-prefecture"],
  ["contact-prï¿½fï¿½rence", "contact-preference"],
  ["member-rï¿½gion", "member-region"],
  ["member-prï¿½fecture", "member-prefecture"],
  ["/app/communes-rï¿½gions", "/app/communes-regions"],
  ["Communes/Rï¿½gions", "Communes/Régions"],
  ["Toutes rï¿½gions", "Toutes régions"],
  ["Toutes prï¿½fectures", "Toutes préfectures"],
  ["Liste des rï¿½gions", "Liste des régions"],
  ["Liste des prï¿½fectures", "Liste des préfectures"],
  ["Aucune rï¿½gion.", "Aucune région."],
  ["Aucune prï¿½fecture.", "Aucune préfecture."],
  ["Recherche (rï¿½gion, prï¿½fecture, commune)", "Recherche (région, préfecture, commune)"],
  ["Collectif Zï¿½ro Indigent", "Collectif Zéro Indigent"],
  ["Collectif Z�ro Indigent", "Collectif Zéro Indigent"],
  ["ï¿½ propos du CZI", "À propos du CZI"],
  ["ï¿½ propos", "À propos"],
  ["� propos", "À propos"],
  ["Communiquï¿½s", "Communiqués"],
  ["Communiqu�s", "Communiqués"],
  ["Paramï¿½tres", "Paramètres"],
  ["Param�tres", "Paramètres"],
  ["Rï¿½duire le menu", "Réduire le menu"],
  ["Citoyennetï¿½", "Citoyenneté"],
  ["dï¿½veloppement", "développement"],
  ["Dï¿½veloppement", "Développement"],
  ["Santï¿½", "Santé"],
  ["bien-ï¿½tre", "bien-être"],
  ["sï¿½curitï¿½", "sécurité"],
  ["ï¿½conomique", "économique"],
  ["ï¿½nergies", "énergies"],
  ["Rï¿½chauffement", "Réchauffement"],
  ["rï¿½chauffement", "réchauffement"],
  ["fondï¿½", "fondé"],
  ["Contribuer ï¿½ ï¿½liminer l'extrï¿½me pauvretï¿½ et la faim.", "Contribuer à éliminer l’extrême pauvreté et la faim."],
  ["Contribuer ï¿½ l'amï¿½lioration", "Contribuer à l’amélioration"],
  ["Faciliter la transition ï¿½cole-marchï¿½ du travail des jeunes.", "Faciliter la transition école-marché du travail des jeunes."],
  ["mï¿½canismes", "mécanismes"],
  ["vulnï¿½rables", "vulnérables"],
  ["Dï¿½velopper la rï¿½silience", "Développer la résilience"],
  ["collaboration ï¿½tat-jeunesse", "collaboration État-jeunesse"],
  ["Annï¿½e de crï¿½ation", "Année de création"],
  ["Le collectif est fondï¿½ le 17 avril 2020.", "Le collectif est fondé le 17 avril 2020."],
  ["engages", "engagés"],
  ["engage", "engagé"],
  ["organise", "organisé"],
  ["cooperation", "coopération"],
  ["accelerer", "accélérer"],
  ["prevention", "prévention"],
  ["cohesion", "cohésion"],
  ["mobilises", "mobilisés"],
  ["elargie", "élargie"],
  ["elargir", "élargir"],
  ["Rï¿½gion", "Région"],
  ["rï¿½gion", "région"],
  ["rï¿½gions", "régions"],
  ["Rï¿½gions", "Régions"],
  ["Prï¿½fecture", "Préfecture"],
  ["prï¿½fecture", "préfecture"],
  ["prï¿½fectures", "préfectures"],
  ["Prï¿½fectures", "Préfectures"],
  ["prï¿½cisez", "précisez"],
  ["prï¿½fï¿½rence", "préférence"],
  ["Prï¿½fï¿½rence", "Préférence"],
  ["Prï¿½cï¿½dent", "Précédent"],
  ["rï¿½silientes", "résilientes"],
  ["rï¿½seau", "réseau"],
  ["Rï¿½seau", "Réseau"],
  ["accï¿½lï¿½rer", "accélérer"],
  ["accï¿½s", "accès"],
  ["Accï¿½der", "Accéder"],
  ["communautï¿½s", "communautés"],
  ["grï¿½ce", "grâce"],
  ["Crï¿½ez", "Créez"],
  ["Crï¿½ation...", "Création..."],
  ["Crï¿½er", "Créer"],
  ["crï¿½ï¿½", "créé"],
  ["Vï¿½rifiez", "Vérifiez"],
  ["Rï¿½initialiser", "Réinitialiser"],
  ["rï¿½initialisation", "réinitialisation"],
  ["oubliï¿½", "oublié"],
  ["Dï¿½jï¿½", "Déjà"],
  ["dï¿½marrer", "démarrer"],
  ["RÃ´le", "Rôle"],
  ["rÃ´le", "rôle"],
  ["donnÃ©es", "données"],
  ["ConfigurÃ©", "Configuré"],
  ["ComplÃ©ter", "Compléter"],
  ["complÃ©ter", "compléter"],
  ["Ã©dition", "édition"],
  ["gï¿½nï¿½ration", "génération"],
  ["photo enregistrï¿½e", "photo enregistrée"],
  ["Photo enregistrï¿½e.", "Photo enregistrée."],
  ["Aucune photo enregistrï¿½e.", "Aucune photo enregistrée."],
  ["Paiement bientï¿½t disponible", "Paiement bientôt disponible"],
  ["aprï¿½s", "après"],
  ["crï¿½ation", "création"],
  ["des maintenant", "dès maintenant"],
  ["dÃ©jÃ ", "déjà"],
  ["finalisee", "finalisée"],
  ["ï¿½tre", "être"],
  ["Contact ï¿½ dï¿½finir", "Contact à définir"],
  ["Photo rejetï¿½e", "Photo rejetée"],
  ["ï¿½ 2900 F", "à 2900 F"],
  ["prï¿½cision", "précision"],
  ["Mettre ï¿½ jour", "Mettre à jour"],
  ["Demandï¿½e", "Demandée"],
  ["Non demandï¿½e", "Non demandée"],
  ["enregistrï¿½e", "enregistrée"],
  ["utilisï¿½e", "utilisée"],
  ["l'ï¿½dition", "l’édition"],
  ["ï¿½ complÃ©ter", "à compléter"],
  ["ï¿½ fournir", "à fournir"],
  ["Localite", "Localité"],
  ["Renseignee", "Renseignée"],
  ["etablir", "établir"],
  ["sont bien presentes", "sont bien présentes"],
  ["avant ï¿½dition", "avant édition"],
  ["ComplÃ©tez", "Complétez"],
  ["l'Ã©tablissement", "l’établissement"],
  ["Payï¿½", "Payé"],
  ["ï¿½chec", "Échec"],
  ["Remboursï¿½", "Remboursé"],
  ["Prï¿½te", "Prête"],
  ["Imprimï¿½e", "Imprimée"],
  ["Livrï¿½e", "Livrée"],
  ["reï¿½ue", "reçue"],
  ["validï¿½e", "validée"],
  ["Reponse", "Réponse"],
  ["AccÃ©dez", "Accédez"],
  ["PrÃ©nom", "Prénom"],
  ["tÃ©lÃ©phone", "téléphone"],
  ["Compï¿½tences", "Compétences"],
  ["intÃ©rÃªts", "intérêts"],
  ["activitÃ©s", "activités"],
  ["activitÃ©", "activité"],
  ["Disponibilitï¿½", "Disponibilité"],
  ["FrÃ©quence", "Fréquence"],
  ["SÃ©lectionner", "Sélectionner"],
  ["Dï¿½crivez", "Décrivez"],
  ["Idï¿½e", "Idée"],
  ["dï¿½clarï¿½e", "déclarée"],
  ["3 ï¿½ 6 mois", "3 à 6 mois"],
  ["Vos donnï¿½es", "Vos données"],
  ["localement ï¿½ chaque ï¿½tape", "localement à chaque étape"],
  ["Aprï¿½s", "Après"],
  ["Crï¿½ation en cours...", "Création en cours..."],
  ["donnÃ©es territoriales", "données territoriales"],
  ["Supabase non configurÃ©", "Supabase non configuré"],
  ["Telephone", "Téléphone"],
  ["Rejete", "Rejeté"],
  ["Status", "Statut"],
  ["Plus recents", "Plus récents"],
  ["Configurez Supabase pour charger les donnÃ©es membres.", "Configurez Supabase pour charger les données membres."],
  ["Gerer role", "Gérer le rôle"],
  ["RÃ´le actif detecte", "Rôle actif détecté"],
  ["detecte", "détecté"],
  ["defaut", "défaut"],
  ["appliquee", "appliquée"],
  ["RLS gouvernance: vue elargie", "RLS gouvernance : vue élargie"],
  ["detectee", "détectée"],
  ["Donnï¿½es derivees", "Données dérivées"],
  ["Selectionnez", "Sélectionnez"],
  ["cible a toutes les rï¿½gions", "ciblé à toutes les régions"],
  ["Creer la campagne", "Créer la campagne"],
  ["Creer une campagne", "Créer une campagne"],
  ["SÃ©lectionner une rï¿½gion", "Sélectionner une région"],
  ["SÃ©lectionner une prï¿½fecture", "Sélectionner une préfecture"],
  ["mise a jour", "mise à jour"],
  ["Mettre a jour", "Mettre à jour"],
  ["sÃ©curitÃ©", "sécurité"],
  ["Alertes sÃ©curitÃ©", "Alertes sécurité"],
  ["re-authentification rÃ©cente", "ré-authentification récente"],
  ["Mise a jour...", "Mise à jour..."],
  ["Role non modifie", "Rôle non modifié"],
  ["Tous les champs obligatoires doivent ï¿½tre renseignes.", "Tous les champs obligatoires doivent être renseignés."],
  ["doit ï¿½tre differente", "doit être différente"],
  ["Retour ï¿½ la liste membres", "Retour à la liste des membres"],
  ["contact rï¿½seau", "contact réseau"],
  ["reservees aux roles", "réservées aux rôles"],
  ["Decision enregistrï¿½e", "Décision enregistrée"],
  ["Jeune engagÃ©", "Jeune engagé"],
  ["Responsable d'organisation", "Responsable d’organisation"],
  ["FrÃ©quence d'engagement", "Fréquence d’engagement"],
  ["Stade de l'activitÃ©", "Stade de l’activité"],
  ["Besoins de l'activitÃ©", "Besoins de l’activité"],
  ["RÃ´le dans l'organisation", "Rôle dans l’organisation"],
  ["Centres d'intÃ©rÃªt", "Centres d’intérêt"],
  ["Chargement des donnÃ©es...", "Chargement des données..."],
  ["Parcours d'inscription : Ã‰tape", "Parcours d’inscription : Étape"],
  ["Terminer l'onboarding", "Terminer l’inscription"],
  ["usage IA agrege/anonyme", "usage IA agrégé/anonyme"],
  ["envoyee", "envoyée"],
  ["presentation", "présentation"],
  ["completï¿½", "complète"],
  ["Creer un compte", "Créer un compte"],
  ["Priorites CZI", "Priorités CZI"],
  ["Les 07 axes stratÃ©giques", "Les 07 axes stratégiques"],
  ["Reseautage", "Réseautage"],
  ["Visibilite", "Visibilité"],
  ["Disponibilite", "Disponibilité"],
  ["Reseau", "Réseau"],
  ["Reinitialiser", "Réinitialiser"],
  ["Reessayez", "Réessayez"],
  ["a l'atteinte", "à l’atteinte"],
  ["A l'atteinte", "À l’atteinte"],
  ["a l'amelioration", "à l’amélioration"],
  ["l inclusion", "l’inclusion"],
  ["deja", "déjà"],
  ["ete", "été"],
  ["mises a jour", "mises à jour"],
  ["a ete", "a été"],
  ["Le module carte est visible et la demande peut etre capturee", "Le module carte est visible et la demande peut être enregistrée"],
  ["Retour dashboard", "Retour au tableau de bord"],
  ["Payer maintenant", "Payer maintenant"],
  ["Pay�r maintenant", "Payer maintenant"],
  ["Rembours�r", "Rembourser"],
  ["RÃ´le non modifie", "Rôle non modifié"],
  ["Ligne invalide ou expirÃ©", "Lien invalide ou expiré"],
  ["dÃ©finir", "définir"],
  ["A propos", "À propos"],
  ["Communiques", "Communiqués"],
  ["Actif", "Actif"],
  ["Appuyez", "Appuyez"],
  ["OUI", "Oui"],
  ["Terminer l’inscription", "Terminer l’inscription"],
];

function collectFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "dist") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
      continue;
    }
    if (FILE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function replaceText(value, isJsxText = false) {
  let next = value;
  for (const [from, to] of replacements) {
    next = next.split(from).join(to);
  }

  next = next
    .replace(/Ã‰/g, "É")
    .replace(/Ã€/g, "À")
    .replace(/Ã©/g, "é")
    .replace(/Ã¨/g, "è")
    .replace(/Ãª/g, "ê")
    .replace(/Ã«/g, "ë")
    .replace(/Ã /g, "à")
    .replace(/Ã¢/g, "â")
    .replace(/Ã´/g, "ô")
    .replace(/Ã¶/g, "ö")
    .replace(/Ã»/g, "û")
    .replace(/Ã¹/g, "ù")
    .replace(/Ã§/g, "ç")
    .replace(/Ã®/g, "î")
    .replace(/Ã¯/g, "ï")
    .replace(/Â/g, "");

  if (isJsxText) {
    next = next.replace(/'/g, "’");
  }

  return next;
}

function transformFile(filePath) {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  let changed = false;

  function visitor(context) {
    function visit(node) {
      if (ts.isStringLiteral(node)) {
        const updated = replaceText(node.text);
        if (updated !== node.text) {
          changed = true;
          return ts.factory.createStringLiteral(updated);
        }
        return node;
      }

      if (ts.isNoSubstitutionTemplateLiteral(node)) {
        const updated = replaceText(node.text);
        if (updated !== node.text) {
          changed = true;
          return ts.factory.createNoSubstitutionTemplateLiteral(updated);
        }
        return node;
      }

      if (ts.isJsxText(node)) {
        const current = node.getFullText(sourceFile);
        const updated = replaceText(current, true);
        if (updated !== current) {
          changed = true;
          return ts.factory.createJsxText(updated, false);
        }
        return node;
      }

      return ts.visitEachChild(node, visit, context);
    }

    return visit;
  }

  const result = ts.transform(sourceFile, [visitor]);
  if (!changed) {
    result.dispose();
    return false;
  }

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const output = printer.printFile(result.transformed[0]);
  result.dispose();
  fs.writeFileSync(filePath, output, "utf8");
  return true;
}

let changedFiles = 0;
for (const dir of TARGET_DIRS) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) continue;
  for (const file of collectFiles(fullDir)) {
    if (transformFile(file)) {
      changedFiles += 1;
    }
  }
}

console.log(`French cleanup updated ${changedFiles} files.`);
