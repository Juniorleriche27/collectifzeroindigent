const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const roots = ["app", "components", "lib"];
const exts = new Set([".ts", ".tsx", ".js", ".jsx"]);

const ignoreExact = new Set([
  "personal",
  "association",
  "enterprise",
  "engaged",
  "entrepreneur",
  "org_leader",
  "whatsapp",
  "email",
  "call",
  "pickup",
  "delivery",
  "unpaid",
  "pending",
  "paid",
  "failed",
  "refunded",
  "draft",
  "ready",
  "printed",
  "delivered",
  "cancelled",
  "missing",
  "uploaded",
  "approved",
  "rejected",
  "community",
  "direct",
  "all",
  "csv",
  "json",
]);

const replacements = [
  ["Collectif Zero Indigent", "Collectif Zéro Indigent"],
  ["A propos du CZI", "À propos du CZI"],
  ["A propos", "À propos"],
  ["Identite", "Identité"],
  ["Priorite", "Priorité"],
  ["Priorites CZI", "Priorités CZI"],
  ["Axes strategiques", "Axes stratégiques"],
  ["axes strategiques", "axes stratégiques"],
  ["presentation complete", "présentation complète"],
  ["Une jeunesse qui agit pour des communautes plus resilientes.", "Une jeunesse qui agit pour des communautés plus résilientes."],
  ["Accedez", "Accédez"],
  ["Acceder", "Accéder"],
  ["Voir la presentation complete", "Voir la présentation complète"],
  ["Retour a l'accueil", "Retour à l'accueil"],
  ["Creation en cours", "Création en cours"],
  ["Creation...", "Création..."],
  ["Creer mon compte", "Créer mon compte"],
  ["Creer une campagne", "Créer une campagne"],
  ["Creer une entreprise", "Créer une entreprise"],
  ["Creer une association", "Créer une association"],
  ["Creer la discussion", "Créer la discussion"],
  ["Creer un compte", "Créer un compte"],
  ["Creer", "Créer"],
  ["Communiques", "Communiqués"],
  ["Communaute", "Communauté"],
  ["Communautes", "Communautés"],
  ["Communes/Regions", "Communes/Régions"],
  ["Parametres", "Paramètres"],
  ["Annee de creation", "Année de création"],
  ["Axe structurants", "Axes structurants"],
  ["Contribuer a eliminer l'extreme pauvrete et la faim.", "Contribuer à éliminer l'extrême pauvreté et la faim."],
  ["Le collectif est fonde le 17 avril 2020.", "Le collectif est fondé le 17 avril 2020."],
  ["Collectif Zero Indigent (CZI)", "Collectif Zéro Indigent (CZI)"],
  ["Mot de passe oublie ?", "Mot de passe oublié ?"],
  ["Mot de passe oublie", "Mot de passe oublié"],
  ["Reinitialiser le mot de passe", "Réinitialiser le mot de passe"],
  ["reinitialisation", "réinitialisation"],
  ["Reinitialiser", "Réinitialiser"],
  ["Verification de la session", "Vérification de la session"],
  ["Session de reinitialisation invalide ou expiree.", "Session de réinitialisation invalide ou expirée."],
  ["Lien invalide ou expire. Redemandez un nouvel email de reinitialisation.", "Lien invalide ou expiré. Redemandez un nouvel e-mail de réinitialisation."],
  ["Mise a jour...", "Mise à jour..."],
  ["Mettre a jour", "Mettre à jour"],
  ["Retour a la", "Retour à la"],
  ["Retour accueil", "Retour à l'accueil"],
  ["Retour dashboard", "Retour au tableau de bord"],
  ["Aller au dashboard", "Aller au tableau de bord"],
  ["Dashboard gouvernance", "Tableau de bord gouvernance"],
  ["Supabase non configure.", "Supabase non configuré."],
  ["Supabase non configure:", "Supabase non configuré :"],
  ["Supabase non configure", "Supabase non configuré"],
  ["Compte cree.", "Compte créé."],
  ["Creez un compte pour demarrer votre onboarding.", "Créez un compte pour démarrer votre inscription."],
  ["demarrer", "démarrer"],
  ["Deja inscrit?", "Déjà inscrit ?"],
  ["Pas encore de compte?", "Pas encore de compte ?"],
  ["Connexion...", "Connexion..."],
  ["Un email de reinitialisation a ete envoye.", "Un e-mail de réinitialisation a été envoyé."],
  ["Ouvrez le lien pour definir un nouveau mot de passe.", "Ouvrez le lien pour définir un nouveau mot de passe."],
  ["Definissez un nouveau mot de passe pour votre compte.", "Définissez un nouveau mot de passe pour votre compte."],
  ["8 caracteres", "8 caractères"],
  ["Mot de passe mis a jour. Redirection vers la connexion...", "Mot de passe mis à jour. Redirection vers la connexion..."],
  ["Citoyennete", "Citoyenneté"],
  ["Reseau", "Réseau"],
  ["reseau", "réseau"],
  ["Education", "Éducation"],
  ["Equipe", "Équipe"],
  ["developpement", "développement"],
  ["Developpement", "Développement"],
  ["Sante communautaire et prevention", "Santé communautaire et prévention"],
  ["Sante communautaire", "Santé communautaire"],
  ["Sante et bien-etre", "Santé et bien-être"],
  ["Bien-etre", "Bien-être"],
  ["securite", "sécurité"],
  ["Securite", "Sécurité"],
  ["energies renouvelables", "énergies renouvelables"],
  ["energies", "énergies"],
  ["Rechauffement", "Réchauffement"],
  ["economique", "économique"],
  ["economiques", "économiques"],
  ["Autonomisation economique", "Autonomisation économique"],
  ["amelioration", "amélioration"],
  ["Amelioration", "Amélioration"],
  ["rechauffement climatique", "réchauffement climatique"],
  ["Resilience climatique", "Résilience climatique"],
  ["resilience", "résilience"],
  ["vulnerables", "vulnérables"],
  ["Vulnerables", "Vulnérables"],
  ["ecole-emploi", "école-emploi"],
  ["ecole-marche", "école-marché"],
  ["Etat-jeunesse", "État-jeunesse"],
  ["grace a", "grâce à"],
  [" a l atteinte", " à l'atteinte"],
  [" a l accent", " à l'accent"],
  [" d une", " d'une"],
  [" d associations", " d'associations"],
  [" d entrepreneurs", " d'entrepreneurs"],
  [" l engagement", " l'engagement"],
  [" l atteinte", " l'atteinte"],
  [" l accompagnement", " l'accompagnement"],
  [" l insertion", " l'insertion"],
  [" l entrepreneuriat", " l'entrepreneuriat"],
  [" l innovation", " l'innovation"],
  [" l impact", " l'impact"],
  [" l usage", " l'usage"],
  [" l ODD", " l'ODD"],
  ["communautes", "communautés"],
  ["pauvrete", "pauvreté"],
  ["extreme", "extrême"],
  ["fonde", "fondé"],
  ["constitue", "constitué"],
  ["concretes", "concrètes"],
  ["mobilises", "mobilisés"],
  ["engages", "engagés"],
  ["employabilite", "employabilité"],
  ["innovation sociale, economique et environnementale", "innovation sociale, économique et environnementale"],
  ["activites", "activités"],
  ["Activites", "Activités"],
  ["completer", "compléter"],
  ["bientot", "bientôt"],
  ["Non paye", "Non payé"],
  ["Paye", "Payé"],
  ["Rembourse", "Remboursé"],
  ["Prete", "Prête"],
  ["Imprimee", "Imprimée"],
  ["Livree", "Livrée"],
  ["Annulee", "Annulée"],
  ["Photo recue", "Photo reçue"],
  ["Photo validee", "Photo validée"],
  ["Photo rejetee", "Photo rejetée"],
  ["Photo enregistree", "Photo enregistrée"],
  ["Aucune photo enregistree.", "Aucune photo enregistrée."],
  ["Aucun numero genere pour le moment", "Aucun numéro généré pour le moment"],
  ["Telephone", "Téléphone"],
  ["precisez", "précisez"],
  ["preciser", "préciser"],
  ["edition", "édition"],
  ["generation", "génération"],
  ["Contact remise", "Contact de remise"],
  ["precision de remise", "précision de remise"],
  ["Demandee", "Demandée"],
  ["Non demandee", "Non demandée"],
  ["A completer", "À compléter"],
  ["A fournir", "À fournir"],
  ["Renseignee", "Renseignée"],
  ["Onboarding requis", "Fiche membre requise"],
  ["Completer l'onboarding", "Compléter ma fiche"],
  ["Terminer l'onboarding", "Terminer l'inscription"],
  ["Votre profil est deja complete. Ouvrez directement le dashboard.", "Votre profil est déjà complet. Ouvrez directement le tableau de bord."],
  ["Les informations de base pour etablir une carte simple sont bien presentes. La photo reste indispensable avant edition.", "Les informations de base pour établir une carte simple sont bien présentes. La photo reste indispensable avant édition."],
  ["Completer au minimum le nom complet et un contact avant l'etablissement de la carte.", "Complétez au minimum le nom complet et un contact avant l'établissement de la carte."],
  ["des maintenant", "dès maintenant"],
  ["Le paiement en ligne sera active", "Le paiement en ligne sera activé"],
  ["Montant cumule", "Montant cumulé"],
  ["Montant paye", "Montant payé"],
  ["Enregistre", "Enregistré"],
  ["enregistres", "enregistrés"],
  ["verifies", "vérifiés"],
  ["Role actif", "Rôle actif"],
  ["Message, reference paiement...", "Message, référence paiement..."],
  ["Configuration territoriale incomplete", "Configuration territoriale incomplète"],
  ["donnees", "données"],
  ["Impossible de charger region/prefecture/commune pour le moment.", "Impossible de charger région/préfecture/commune pour le moment."],
  ["Selectionner", "Sélectionner"],
  ["d'abord une region", "d'abord une région"],
  ["Localite", "Localité"],
  ["mobilite", "mobilité"],
  ["activites hors commune", "activités hors commune"],
  ["Type d'inscription", "Type d'inscription"],
  ["Personnel", "Individuel"],
  ["Jeune engage", "Jeune engagé"],
  ["Responsable organisation", "Responsable d'organisation"],
  ["Frequence d'engagement", "Fréquence d'engagement"],
  ["Action recente", "Action récente"],
  ["Decrivez une action recente", "Décrivez une action récente"],
  ["Stade business", "Stade du projet"],
  ["Secteur business", "Secteur d'activité"],
  ["Besoins business", "Besoins du projet"],
  ["Idee", "Idée"],
  ["Competences", "Compétences"],
  ["interets", "intérêts"],
  ["Objectif 3-6 mois", "Objectif à 3-6 mois"],
  ["Quel est votre objectif principal sur 3 a 6 mois ?", "Quel est votre objectif principal sur 3 à 6 mois ?"],
  ["Disponibilite", "Disponibilité"],
  ["Preference de contact", "Préférence de contact"],
  ["Type organisation", "Type d'organisation"],
  ["Role dans l", "Rôle dans l"],
  ["role/organisation", "rôle/organisation"],
  ["agrege/anonyme", "agrégé/anonyme"],
  ["Verifiez", "Vérifiez"],
  ["Vos donnees sont sauvegardees localement a chaque etape tant que la soumission finale n'est pas envoyee.", "Vos données sont sauvegardées localement à chaque étape tant que la soumission finale n'est pas envoyée."],
  ["Apres validation de votre fiche", "Après validation de votre fiche"],
  ["Chargement des donnees...", "Chargement des données..."],
  ["Wizard onboarding: etape", "Parcours d'intégration : étape"],
  ["Precedent", "Précédent"],
  ["Dashboard", "Tableau de bord"],
  ["Domaines d action", "Domaines d'action"],
  ["communautaire", "communautaire"],
  ["Communautaire", "Communautaire"],
  ["Reseautage", "Réseautage"],
  ["Visibilite", "Visibilité"],
  ["civique", "civique"],
  ["Â«", "«"],
  ["Â»", "»"],
  ["Â©", "©"],
  ["Personal", "Individuel"],
  ["Enterprise", "Entreprise"],
];

function isIdentifierLike(value) {
  return /^[a-z0-9_./:-]+$/.test(value);
}

function shouldSkipString(value) {
  if (!value) return true;
  if (ignoreExact.has(value)) return true;
  if (value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://")) return true;
  if (value.includes("NEXT_PUBLIC_") || value.includes("SUPABASE_")) return true;
  if (isIdentifierLike(value)) return true;
  return false;
}

function transform(text) {
  let next = text;
  for (const [from, to] of replacements) {
    next = next.split(from).join(to);
  }
  return next;
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".git")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (exts.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function applyToFile(file) {
  const source = fs.readFileSync(file, "utf8");
  const kind = file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
  const edits = [];

  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const raw = node.text;
      if (!shouldSkipString(raw)) {
        const updated = transform(raw);
        if (updated !== raw) {
          edits.push({ start: node.getStart(sf) + 1, end: node.getEnd() - 1, text: updated });
        }
      }
    } else if (ts.isJsxText(node)) {
      const raw = node.getFullText(sf);
      const updated = transform(raw);
      if (updated !== raw) {
        edits.push({ start: node.getFullStart(), end: node.getEnd(), text: updated });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sf);

  if (!edits.length) return false;

  edits.sort((a, b) => b.start - a.start);
  let next = source;
  for (const edit of edits) {
    next = next.slice(0, edit.start) + edit.text + next.slice(edit.end);
  }
  fs.writeFileSync(file, next, "utf8");
  return true;
}

let changed = 0;
for (const root of roots) {
  for (const file of walk(root)) {
    if (applyToFile(file)) changed += 1;
  }
}

console.log(`changed_files=${changed}`);
