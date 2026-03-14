const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const ROOT = process.cwd();
const TARGET_DIRS = ["app", "components", "lib"];
const FILE_EXTENSIONS = new Set([".ts", ".tsx"]);

const replacements = [
  ["Collectif Zero Indigent", "Collectif Zéro Indigent"],
  ["A propos du CZI", "À propos du CZI"],
  ["A propos", "À propos"],
  ["Communiques", "Communiqués"],
  ["Communaute", "Communauté"],
  ["Communes/Regions", "Communes/Régions"],
  ["Parametres", "Paramètres"],
  ["Reduire le menu", "Réduire le menu"],
  ["Citoyennete", "Citoyenneté"],
  ["developpement", "développement"],
  ["Developpement", "Développement"],
  ["Sante", "Santé"],
  ["bien-etre", "bien-être"],
  ["securite", "sécurité"],
  ["economique", "économique"],
  ["energies", "énergies"],
  ["Rechauffement", "Réchauffement"],
  ["fonde", "fondé"],
  ["cree", "créé"],
  ["cree.", "créée."],
  ["Accedez", "Accédez"],
  ["Accedez a", "Accédez à"],
  ["Mot de passe oublie", "Mot de passe oublié"],
  ["Reinitialiser", "Réinitialiser"],
  ["reinitialisation", "réinitialisation"],
  ["Verifiez", "Vérifiez"],
  ["Connexion...", "Connexion..."],
  ["Deja inscrit?", "Déjà inscrit ?"],
  ["Deja", "Déjà"],
  ["Creer", "Créer"],
  ["Creation", "Création"],
  ["demarrer", "démarrer"],
  ["configure", "configuré"],
  ["configuree", "configurée"],
  ["donnees", "données"],
  ["Completer", "Compléter"],
  ["complete", "complété"],
  ["completee", "complétée"],
  ["competences", "compétences"],
  ["Competences", "Compétences"],
  ["interets", "intérêts"],
  ["Disponibilite", "Disponibilité"],
  ["Preference", "Préférence"],
  ["Echec", "Échec"],
  ["Rembourse", "Remboursé"],
  ["Prefecture", "Préfecture"],
  ["Region", "Région"],
  ["selectionnez", "sélectionnez"],
  ["Selectionner", "Sélectionner"],
  ["selectionner", "sélectionner"],
  ["Precedent", "Précédent"],
  ["Resume", "Résumé"],
  ["engage", "engagé"],
  ["engages", "engagés"],
  ["engagee", "engagée"],
  ["recente", "récente"],
  ["recentes", "récentes"],
  ["recents", "récents"],
  ["Role", "Rôle"],
  ["role", "rôle"],
  ["activite", "activité"],
  ["activites", "activités"],
  ["declaree", "déclarée"],
  ["reseau", "réseau"],
  ["Reseau", "Réseau"],
  ["cooperation", "coopération"],
  ["accelerer", "accélérer"],
  ["resilience", "résilience"],
  ["Etat", "État"],
  ["communautes", "communautés"],
  ["pauvrete", "pauvreté"],
  ["grace", "grâce"],
  ["etat-jeunesse", "État-jeunesse"],
  ["axes strategiques", "axes stratégiques"],
  ["Priorites", "Priorités"],
  ["d intervention", "d’intervention"],
  ["d engagement", "d’engagement"],
  ["l ODD", "l’ODD"],
  ["l innovation", "l’innovation"],
  ["l insertion", "l’insertion"],
  ["l impact", "l’impact"],
  ["l atteinte", "l’atteinte"],
  ["l accompagnement", "l’accompagnement"],
  ["l entrepreneuriat", "l’entrepreneuriat"],
  ["l inclusion", "l’inclusion"],
  ["d actions", "d’actions"],
  ["d engagement", "d’engagement"],
  ["d organisation", "d’organisation"],
  ["d inscription", "d’inscription"],
  ["d utilisation", "d’utilisation"],
  ["d abord", "d’abord"],
  ["J'aime", "J’aime"],
  ["a l atteinte", "à l’atteinte"],
  ["a la", "à la"],
  ["a l", "à l"],
  ["a jour", "à jour"],
  ["a 2900 F", "à 2900 F"],
  ["a ete", "a été"],
  ["des maintenant", "dès maintenant"],
  ["Le paiement en ligne sera active", "Le paiement en ligne sera activé"],
  ["Retour accueil", "Retour à l’accueil"],
  ["Objectifs de Developpement Durable", "Objectifs de Développement Durable"],
  ["Etape", "Étape"],
  ["age", "âge"],
  ["education", "éducation"],
  ["frequence", "fréquence"],
  ["Idee", "Idée"],
  ["mobile", "mobile"],
  ["Wizard onboarding: etape", "Parcours d’inscription : étape"],
  ["Terminer l'onboarding", "Terminer l’inscription"],
  ["Votre profil est deja complete. Ouvrez directement le dashboard.", "Votre profil est déjà complété. Ouvrez directement le tableau de bord."],
  ["Configuration territoriale incomplete (region/prefecture/commune). Ajoutez ces donnees dans Supabase avant de terminer l'onboarding.", "Configuration territoriale incomplète (région/préfecture/commune). Ajoutez ces données dans Supabase avant de terminer l’inscription."],
  ["Impossible de charger region/prefecture/commune pour le moment.", "Impossible de charger région/préfecture/commune pour le moment."],
  ["Etape 1: renseignez prenom, nom et telephone.", "Étape 1 : renseignez prénom, nom et téléphone."],
  ["Etape 1: date de naissance ou tranche d'age obligatoire.", "Étape 1 : la date de naissance ou la tranche d’âge est obligatoire."],
  ["Etape 1: niveau d'education et statut professionnel obligatoires.", "Étape 1 : le niveau d’éducation et le statut professionnel sont obligatoires."],
  ["Etape 2: selectionnez region, prefecture et commune.", "Étape 2 : sélectionnez région, préfecture et commune."],
  ["Etape 3: nom d'association/entreprise obligatoire.", "Étape 3 : le nom de l’association ou de l’entreprise est obligatoire."],
  ["Etape 3: profil engage incomplet (domaines/frequence/action).", "Étape 3 : profil engagé incomplet (domaines/fréquence/action)."],
  ["Etape 3: profil entrepreneur incomplet (stade/secteur/besoins).", "Étape 3 : profil entrepreneur incomplet (stade/secteur/besoins)."],
  ["Etape 3: profil responsable incomplet (role/organisation).", "Étape 3 : profil responsable incomplet (rôle/organisation)."],
  ["Etape 4: competences, interets et objectif sont obligatoires.", "Étape 4 : compétences, intérêts et objectif sont obligatoires."],
  ["Etape 4: selectionnez entre 1 et 3 ODD prioritaires.", "Étape 4 : sélectionnez entre 1 et 3 ODD prioritaires."],
  ["Etape 5: preference de contact invalide.", "Étape 5 : la préférence de contact est invalide."],
  ["Etape 5: au moins un type de support est obligatoire.", "Étape 5 : au moins un type de support est obligatoire."],
  ["Etape 5: type organisation obligatoire pour demande partenaire.", "Étape 5 : le type d’organisation est obligatoire pour une demande de partenariat."],
  ["Etape 5: nom organisation obligatoire pour demande partenaire.", "Étape 5 : le nom de l’organisation est obligatoire pour une demande de partenariat."],
  ["Etape 6: vous devez accepter les conditions d'utilisation.", "Étape 6 : vous devez accepter les conditions d’utilisation."],
  ["Type d'inscription", "Type d’inscription"],
  ["Personal", "Personnel"],
  ["Enterprise", "Entreprise"],
  ["Jeune engage", "Jeune engagé"],
  ["Responsable organisation", "Responsable d’organisation"],
  ["Frequence d'engagement", "Fréquence d’engagement"],
  ["Action recente", "Action récente"],
  ["Decrivez une action recente", "Décrivez une action récente"],
  ["Stade business", "Stade de l’activité"],
  ["Secteur business", "Secteur d’activité"],
  ["Besoins business", "Besoins de l’activité"],
  ["Role dans l'organisation", "Rôle dans l’organisation"],
  ["Nom organisation declaree", "Nom de l’organisation déclarée"],
  ["Competences (separees par virgules)", "Compétences (séparées par des virgules)"],
  ["Centres d'interet (virgules)", "Centres d’intérêt (virgules)"],
  ["Quel est votre objectif principal sur 3 a 6 mois ?", "Quel est votre objectif principal sur 3 à 6 mois ?"],
  ["Preference de contact", "Préférence de contact"],
  ["Je souhaite une demande partenaire organisation", "Je souhaite soumettre une demande de partenariat pour mon organisation"],
  ["Type organisation", "Type d’organisation"],
  ["J'accepte l'usage IA agrege/anonyme (optionnel)", "J’accepte l’usage IA agrégé et anonyme (optionnel)"],
  ["Verifiez vos informations, puis cliquez sur", "Vérifiez vos informations, puis cliquez sur"],
  ["Vos donnees sont sauvegardees localement a chaque etape tant que la soumission finale n'est pas envoyee.", "Vos données sont sauvegardées localement à chaque étape tant que la soumission finale n’est pas envoyée."],
  ["Apres validation de votre fiche", "Après validation de votre fiche"],
  ["Aller au dashboard", "Aller au tableau de bord"],
  ["Chargement des donnees...", "Chargement des données..."],
  ["Supabase non configure. Ajoutez les variables d'environnement.", "Supabase non configuré. Ajoutez les variables d’environnement."],
  ["Configurez Supabase pour charger les donnees membres.", "Configurez Supabase pour charger les données membres."],
  ["Impossible de mettre a jour la securite.", "Impossible de mettre à jour la sécurité."],
  ["Mise a jour...", "Mise à jour..."],
  ["Retour a la liste des membres", "Retour à la liste des membres"],
  ["Decision enregistree", "Décision enregistrée"],
  ["Toutes Regions", "Toutes Régions"],
  ["Toutes regions", "Toutes régions"],
  ["Toutes Prefectures", "Toutes Préfectures"],
  ["Toutes prefectures", "Toutes préfectures"],
  ["Reinitialiser", "Réinitialiser"],
  ["Resume", "Résumé"],
];

function collectFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "dist") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
    } else if (FILE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function replaceText(value) {
  let next = value;
  for (const [from, to] of replacements) {
    next = next.split(from).join(to);
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

  function transformer(context) {
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
        const updated = replaceText(current);
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

  const result = ts.transform(sourceFile, [transformer]);
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

let count = 0;
for (const dir of TARGET_DIRS) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) continue;
  for (const filePath of collectFiles(fullDir)) {
    if (transformFile(filePath)) {
      count += 1;
    }
  }
}

console.log(`Safe French replacements updated ${count} files.`);
