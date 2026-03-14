const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const TARGET_DIRS = ["app", "components", "lib"];
const FILE_EXTENSIONS = new Set([".ts", ".tsx"]);

const replacements = [
  ["/app/communes-r�gions", "/app/communes-regions"],
  ["/app/communes-rï¿½gions", "/app/communes-regions"],
  ["campaign-r�gion", "campaign-region"],
  ["campaign-pr�fecture", "campaign-prefecture"],
  ["communique-r�gion", "communique-region"],
  ["communique-pr�fecture", "communique-prefecture"],
  ["edit-communique-r�gion", "edit-communique-region"],
  ["edit-communique-pr�fecture", "edit-communique-prefecture"],
  ["contact-pr�f�rence", "contact-preference"],
  ["member-r�gion", "member-region"],
  ["member-pr�fecture", "member-prefecture"],

  ["Collectif ZÃ©ro Indigent", "Collectif Zéro Indigent"],
  ["Collectif Zéro Indigent", "Collectif Zéro Indigent"],
  ["Ã€ propos", "À propos"],
  ["A propos", "À propos"],
  ["â€™", "’"],
  ["â€œ", "«"],
  ["â€\u009d", "»"],
  ["CrÃ©er", "Créer"],
  ["CrÃ©ation", "Création"],
  ["engagÃ©ment", "engagement"],
  ["engagÃ©", "engagé"],
  ["engagés", "engagés"],
  ["RÃ©ponse", "Réponse"],
  ["RÃ©seau", "Réseau"],
  ["rÃ©seau", "réseau"],
  ["RÃ´le", "Rôle"],
  ["rÃ´le", "rôle"],
  ["RÃ©gion", "Région"],
  ["rÃ©gion", "région"],
  ["RÃ©silience", "Résilience"],
  ["RÃ©initialiser", "Réinitialiser"],
  ["RÃ©initialisation", "Réinitialisation"],
  ["RÃ©duire", "Réduire"],
  ["PrÃ©cédent", "Précédent"],
  ["PrÃ©nom", "Prénom"],
  ["PrÃ©fecture", "Préfecture"],
  ["prÃ©fecture", "préfecture"],
  ["PrÃ©férence", "Préférence"],
  ["prÃ©férence", "préférence"],
  ["CompÃ©tences", "Compétences"],
  ["complÃ©ter", "compléter"],
  ["ComplÃ©ter", "Compléter"],
  ["complÃ¨te", "complète"],
  ["ComplÃ¨te", "Complète"],
  ["dÃ©jÃ ", "déjà"],
  ["dÃ©marrer", "démarrer"],
  ["dÃ©finir", "définir"],
  ["donnÃ©es", "données"],
  ["ConfigurÃ©", "Configuré"],
  ["stratÃ©giques", "stratégiques"],
  ["stratÃ©gique", "stratégique"],
  ["activitÃ©s", "activités"],
  ["activitÃ©", "activité"],
  ["intÃ©rÃªts", "intérêts"],
  ["DisponibilitÃ©", "Disponibilité"],
  ["FrÃ©quence", "Fréquence"],
  ["SÃ©lectionner", "Sélectionner"],
  ["DÃ©crivez", "Décrivez"],
  ["IdÃ©e", "Idée"],
  ["Ã‰tape", "Étape"],
  ["Ã©dition", "édition"],
  ["Ã©tapes", "étapes"],
  ["Ã©tape", "étape"],

  ["Contribuer ï¿½ ï¿½liminer l'extrï¿½me pauvretï¿½ et la faim.", "Contribuer à éliminer l’extrême pauvreté et la faim."],
  ["Contribuer à l’amélioration", "Contribuer à l’amélioration"],
  ["Faciliter la transition ï¿½cole-marchï¿½ du travail des jeunes.", "Faciliter la transition école-marché du travail des jeunes."],
  ["Dï¿½velopper la rï¿½silience face au rï¿½chauffement climatique.", "Développer la résilience face au réchauffement climatique."],
  ["Renforcer la collaboration ï¿½tat-jeunesse pour la paix sociale.", "Renforcer la collaboration État-jeunesse pour la paix sociale."],
  ["Citoyennetï¿½ et dï¿½veloppement local", "Citoyenneté et développement local"],
  ["Santï¿½ et bien-ï¿½tre", "Santé et bien-être"],
  ["Inclusion, sï¿½curitï¿½ et droits humains", "Inclusion, sécurité et droits humains"],
  ["Insertion professionnelle et croissance ï¿½conomique", "Insertion professionnelle et croissance économique"],
  ["Climat et ï¿½nergies renouvelables", "Climat et énergies renouvelables"],
  ["Rï¿½chauffement climatique et ï¿½nergies renouvelables", "Réchauffement climatique et énergies renouvelables"],
  ["Le collectif est fondï¿½ le 17 avril 2020.", "Le collectif est fondé le 17 avril 2020."],
  ["Annï¿½e de crï¿½ation", "Année de création"],
  ["Accï¿½der ï¿½ la plateforme", "Accéder à la plateforme"],
  ["communautï¿½s", "communautés"],
  ["communautÃ©s", "communautés"],
  ["rï¿½silientes", "résilientes"],
  ["rï¿½seau", "réseau"],
  ["accï¿½lï¿½rer", "accélérer"],
  ["pauvretï¿½", "pauvreté"],
  ["grï¿½ce", "grâce"],
  ["ï¿½ Faire de chaque jeune un acteur engagï¿½ dans l’atteinte des ODD. ï¿½", "« Faire de chaque jeune un acteur engagé dans l’atteinte des ODD. »"],
  ["Voir la présentation complét�", "Voir la présentation complète"],
  ["Voir la prÃ©sentation complÃ©tï¿½", "Voir la présentation complète"],
  ["Contribuer, grï¿½ce ï¿½ la synergie d’actions des jeunes, ï¿½ l’atteinte des ODD.", "Contribuer, grâce à la synergie d’actions des jeunes, à l’atteinte des ODD."],

  ["Communes/R�gions", "Communes/Régions"],
  ["Toutes r�gions", "Toutes régions"],
  ["Toutes pr�fectures", "Toutes préfectures"],
  ["Recherche (r�gion, pr�fecture, commune)", "Recherche (région, préfecture, commune)"],
  ["Liste des r�gions", "Liste des régions"],
  ["Liste des pr�fectures", "Liste des préfectures"],
  ["Aucune r�gion.", "Aucune région."],
  ["Aucune pr�fecture.", "Aucune préfecture."],
  ["R�gion", "Région"],
  ["Pr�fecture", "Préfecture"],
  ["r�gion", "région"],
  ["pr�fecture", "préfecture"],
  ["r�gions", "régions"],
  ["pr�fectures", "préfectures"],

  ["Mot de passe oubli�", "Mot de passe oublié"],
  ["Un e-mail de r�initialisation a �t� envoy�. Ouvrez le lien pour d�finir un nouveau mot de passe.", "Un e-mail de réinitialisation a été envoyé. Ouvrez le lien pour définir un nouveau mot de passe."],
  ["Retour � la", "Retour à la"],
  ["Compte cr��. V�rifiez votre e-mail pour confirmer l'inscription, puis connectez-vous.", "Compte créé. Vérifiez votre e-mail pour confirmer l’inscription, puis connectez-vous."],
  ["Cr�ez un compte pour d�marrer votre inscription.", "Créez un compte pour démarrer votre inscription."],
  ["Cr�ation...", "Création..."],
  ["Cr�er mon compte", "Créer mon compte"],
  ["D�j� inscrit ?", "Déjà inscrit ?"],
  ["Acc�dez � votre espace membre pour continuer.", "Accédez à votre espace membre pour continuer."],
  ["Mot de passe oubli� ?", "Mot de passe oublié ?"],
  ["Session de r�initialisation invalide ou expir�e.", "Session de réinitialisation invalide ou expirée."],
  ["Le mot de passe doit contenir au moins 8 caract�res.", "Le mot de passe doit contenir au moins 8 caractères."],
  ["Mot de passe mis � jour. Redirection vers la connexion...", "Mot de passe mis à jour. Redirection vers la connexion..."],
  ["R�initialiser le mot de passe", "Réinitialiser le mot de passe"],
  ["V�rification de la session...", "Vérification de la session..."],
  ["Lien invalide ou expir�. Redemandez un nouvel e-mail de r�initialisation.", "Lien invalide ou expiré. Redemandez un nouvel e-mail de réinitialisation."],

  ["Supabase non configurÃ©", "Supabase non configuré"],
  ["Impossible de d�marrer le paiement en ligne.", "Impossible de démarrer le paiement en ligne."],
  ["Pay�", "Payé"],
  ["�chec", "Échec"],
  ["Rembours�", "Remboursé"],
  ["Payer maintenant", "Payer maintenant"],
  ["Pay�r maintenant", "Payer maintenant"],
  ["Rembours�r", "Rembourser"],

  ["Demande de carte enregistr\\uFFFDe. Les informations de livraison et la photo ont \\u00E9t\\u00E9 mises \\u00E0 jour.", "Demande de carte enregistrée. Les informations de livraison et la photo ont été mises à jour."],
  ["Pr�f�rence carte enregistr�e.", "Préférence de carte enregistrée."],
  ["Non pay�", "Non payé"],
  ["Pr�te", "Prête"],
  ["Imprim�e", "Imprimée"],
  ["Livr�e", "Livrée"],
  ["Annul�e", "Annulée"],
  ["Photo re�ue", "Photo reçue"],
  ["Photo valid�e", "Photo validée"],
  ["Photo rejet�e", "Photo rejetée"],
  ["carte membre � 2900 F", "carte membre à 2900 F"],
  ["Paiement bient�t disponible", "Paiement bientôt disponible"],
  ["apr�s la cr�ation", "après la création"],
  ["Photo enregistr�e.", "Photo enregistrée."],
  ["Aucune photo enregistr�e.", "Aucune photo enregistrée."],
  ["Contact � d�finir", "Contact à définir"],
  ["Photo rejet�e:", "Photo rejetée :"],
  ["pr�cisez", "précisez"],
  ["pr�cision", "précision"],
  ["Mettre � jour la demande", "Mettre à jour la demande"],
  ["Demand�e", "Demandée"],
  ["Non demand�e", "Non demandée"],
  ["La photo est bien enregistr�e et pourra �tre utilis�e pour la g�n�ration.", "La photo est bien enregistrée et pourra être utilisée pour la génération."],
  ["Ajoutez une photo pour permettre l'�dition de la carte.", "Ajoutez une photo pour permettre l’édition de la carte."],
  ["� compléter", "à compléter"],
  ["� fournir", "à fournir"],
  ["Renseign\\u00E9e", "Renseignée"],
  ["La demande peut �tre enregistr�e dès maintenant. Le paiement en ligne sera active", "La demande peut être enregistrée dès maintenant. Le paiement en ligne sera activé"],

  ["Espace discussion style r�seau social: reponses, likes, �dition, tags.", "Espace de discussion de type réseau social : réponses, mentions J’aime, édition et étiquettes."],
  ["Commentaire envoy�.", "Commentaire envoyé."],
  ["Message envoy�.", "Message envoyé."],
  ["Creer la discussion", "Créer la discussion"],

  ["Tous les champs obligatoires doivent �tre renseignes.", "Tous les champs obligatoires doivent être renseignés."],
  ["V�rifiez les policies profile puis reappliquez", "Vérifiez les policies profile puis réappliquez"],
  ["doit �tre differente", "doit être différente"],
  ["re-authentification r�cente", "ré-authentification récente"],
  ["Alertes s�curit�", "Alertes sécurité"],
  ["Impossible de mettre a jour la s�curit�.", "Impossible de mettre à jour la sécurité."],

  ["Votre profil est d�j� complét�. Ouvrez directement le tableau de bord.", "Votre profil est déjà complété. Ouvrez directement le tableau de bord."],
  ["Configuration territoriale incompléte (r�gion/pr�fecture/commune). Ajoutez ces donn�es dans Supabase avant de terminer l'inscription.", "Configuration territoriale incomplète (région/préfecture/commune). Ajoutez ces données dans Supabase avant de terminer l’inscription."],
  ["Impossible de charger r�gion/pr�fecture/commune pour le moment.", "Impossible de charger région/préfecture/commune pour le moment."],
  ["Sant� communautaire", "Santé communautaire"],
  ["Comp�tences et objectifs", "Compétences et objectifs"],
  ["�tape 1 : renseignez prénom, nom et téléphone.", "Étape 1 : renseignez prénom, nom et téléphone."],
  ["�tape 1 : la date de naissance ou la tranche d'�ge est obligatoire.", "Étape 1 : la date de naissance ou la tranche d’âge est obligatoire."],
  ["�tape 1 : le niveau d'�ducation et le statut professionnel sont obligatoires.", "Étape 1 : le niveau d’éducation et le statut professionnel sont obligatoires."],
  ["�tape 2 : sélectionnez r�gion, pr�fecture et commune.", "Étape 2 : sélectionnez région, préfecture et commune."],
  ["�tape 3 : profil engag� incomplet (domaines/fréquence/action).", "Étape 3 : profil engagé incomplet (domaines/fréquence/action)."],
  ["�tape 3 : profil responsable incomplet (rôle/organisation).", "Étape 3 : profil responsable incomplet (rôle/organisation)."],
  ["�tape 4 : comp�tences, intérêts et objectif sont obligatoires.", "Étape 4 : compétences, intérêts et objectif sont obligatoires."],
  ["�tape 4 : sélectionnez entre 1 et 3 ODD prioritaires.", "Étape 4 : sélectionnez entre 1 et 3 ODD prioritaires."],
  ["�tape 5 : pr�f�rence de contact invalide.", "Étape 5 : préférence de contact invalide."],
  ["S�lectionner une r�gion", "Sélectionner une région"],
  ["S�lectionner une pr�fecture", "Sélectionner une préfecture"],
  ["S�lectionner une commune", "Sélectionner une commune"],
  ["S�lectionner d'abord une r�gion", "Sélectionner d’abord une région"],
  ["Quartier/localit� (optionnel)", "Quartier/localité (optionnel)"],
  ["Zones de mobilit� (optionnel)", "Zones de mobilité (optionnel)"],
  ["Action r�cente", "Action récente"],
  ["D�crivez une action r�cente", "Décrivez une action récente"],
  ["Id�e", "Idée"],
  ["Nom de l’organisation d�clar�e", "Nom de l’organisation déclarée"],
  ["D. Comp�tences, ODD et objectifs", "D. Compétences, ODD et objectifs"],
  ["Comp�tences (s�par�es par des virgules)", "Compétences (séparées par des virgules)"],
  ["Quel est votre objectif principal sur 3 � 6 mois ?", "Quel est votre objectif principal sur 3 à 6 mois ?"],
  ["Disponibilit� (optionnel)", "Disponibilité (optionnel)"],
  ["Pr�f�rence de contact", "Préférence de contact"],
  ["V�rifiez vos informations, puis cliquez sur <strong>Terminer l&apos;onboarding</strong>.", "Vérifiez vos informations, puis cliquez sur <strong>Terminer l&apos;inscription</strong>."],
  ["Vos donn�es sont sauvegard�es localement � chaque �tape tant que la soumission finale", "Vos données sont sauvegardées localement à chaque étape tant que la soumission finale"],
  ["Apr�s validation de votre fiche", "Après validation de votre fiche"],
  ["Pr�c�dent", "Précédent"],
  ["Fiche membre complét�: identite, localisation, orientation CZI et besoins.", "Fiche membre complétée : identité, localisation, orientation CZI et besoins."],

  ["Rôle non modifie", "Rôle non modifié"],
  ["Decision enregistr�e", "Décision enregistrée"],
  ["Ce profil est visible pour contact r�seau.", "Ce profil est visible pour contact réseau."],
  ["Retour � la liste membres", "Retour à la liste des membres"],

  ["Creer une nouvelle entreprise partenaire dans le r�seau CZI.", "Créer une nouvelle entreprise partenaire dans le réseau CZI."],
  ["Le nom de l'organisation doit contenir au moins 3 caract�res.", "Le nom de l’organisation doit contenir au moins 3 caractères."],
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

let changed = 0;
for (const dir of TARGET_DIRS) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) continue;
  for (const filePath of collectFiles(fullDir)) {
    const current = fs.readFileSync(filePath, "utf8");
    let next = current;
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
      .replace(/Â/g, "")
      .replace(/\\uFFFD/g, "é");
    if (next !== current) {
      fs.writeFileSync(filePath, next, "utf8");
      changed += 1;
    }
  }
}

console.log(`Raw French cleanup updated ${changed} files.`);
