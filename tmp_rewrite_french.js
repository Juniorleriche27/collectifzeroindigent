const fs = require("fs");
const { execFileSync } = require("child_process");

const mojibake = [
  ["Ã©", "é"],
  ["Ã¨", "è"],
  ["Ãª", "ê"],
  ["Ã«", "ë"],
  ["Ã ", "à"],
  ["Ã¢", "â"],
  ["Ã¹", "ù"],
  ["Ã»", "û"],
  ["Ã´", "ô"],
  ["Ã®", "î"],
  ["Ã¯", "ï"],
  ["Ã§", "ç"],
  ["Ã‰", "É"],
  ["Ãˆ", "È"],
  ["ÃŠ", "Ê"],
  ["Ã‹", "Ë"],
  ["Ã€", "À"],
  ["Ã‚", "Â"],
  ["Ã™", "Ù"],
  ["Ã›", "Û"],
  ["Ã”", "Ô"],
  ["ÃŽ", "Î"],
  ["Ã‡", "Ç"],
  ["Â«", "«"],
  ["Â»", "»"],
  ["Â°", "°"],
  ["Â ", " "],
  ["Â", ""],
];

function fromHead(file) {
  return execFileSync("git", ["show", `HEAD:${file}`], { encoding: "utf8" });
}

function applyCommon(text) {
  let next = text;
  for (const [from, to] of mojibake) {
    next = next.split(from).join(to);
  }
  return next;
}

function rewrite(file, replacements) {
  let text = applyCommon(fromHead(file));
  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }
  fs.writeFileSync(file, text, "utf8");
  console.log(`rewrote ${file}`);
}

rewrite("app/page.tsx", [
  [/Promouvoir des mecanismes d'inclusion pour les publics vulnerables\./g, "Promouvoir des mécanismes d'inclusion pour les publics vulnérables."],
  [/Renforcer la collaboration Etat-jeunesse pour la paix sociale\./g, "Renforcer la collaboration État-jeunesse pour la paix sociale."],
  [/Equipe locale CZI/g, "Équipe locale CZI"],
  [/Priorites CZI/g, "Priorités CZI"],
]);

rewrite("app/a-propos/page.tsx", [
  [/avec un accent sur l ODD 1\./g, "avec un accent sur l'ODD 1."],
  [/promouvoir l innovation, l entrepreneuriat et l impact social\./g, "promouvoir l'innovation, l'entrepreneuriat et l'impact social."],
]);

rewrite("app/app/a-propos/page.tsx", [[/Transition ecole-emploi/g, "Transition école-emploi"]]);

rewrite("app/onboarding/actions.ts", [
  [/[?�]tape 3 incompl[?�]te : s[?�]lectionnez le type d'inscription\./g, "Étape 3 incomplète : sélectionnez le type d'inscription."],
  [/Veuillez saisir au moins un centre d'interet\./g, "Veuillez saisir au moins un centre d'intérêt."],
  [/[?�]lectionnez entre 1 et 3 ODD prioritaires\./g, "Sélectionnez entre 1 et 3 ODD prioritaires."],
  [/Veuillez s[?�]lectionner au moins un type de support\./g, "Veuillez sélectionner au moins un type de support."],
  [/Pour le profil responsable organisation, role et nom declare sont obligatoires\./g, "Pour le profil responsable organisation, rôle et nom déclaré sont obligatoires."],
]);

rewrite("app/onboarding/onboarding-form.tsx", [
  [/[?�]ducation civique/g, "Éducation civique"],
  [/Santé communautaire/g, "Santé communautaire"],
  [/Réseautage/g, "Réseautage"],
  [/Visibilité/g, "Visibilité"],
  [/Identite et contact/g, "Identité et contact"],
  [/[?�]tape /g, "Étape "],
  [/A\. Identite et contact/g, "A. Identité et contact"],
  [/Prenom/g, "Prénom"],
  [/Telephone/g, "Téléphone"],
  [/Salarie/g, "Salarié"],
  [/Independant/g, "Indépendant"],
  [/Charge de projet, Developpeur, Artisane/g, "Chargé de projet, Développeur, Artisane"],
  [/Region/g, "Région"],
  [/Prefecture/g, "Préfecture"],
  [/Selectionner/g, "Sélectionner"],
  [/Localite/g, "Localité"],
  [/Disponible pour activites hors commune/g, "Disponible pour activités hors commune"],
  [/Zones de mobilite/g, "Zones de mobilité"],
  [/Jeune engage/g, "Jeune engagé"],
  [/Frequence d&apos;engagement/g, "Fréquence d&apos;engagement"],
  [/Action recente/g, "Action récente"],
  [/[?�]crivez une action r[?�]cente/g, "Décrivez une action récente"],
  [/Idee/g, "Idée"],
  [/Role dans l&apos;organisation/g, "Rôle dans l&apos;organisation"],
  [/[?�]sident/g, "Président"],
  [/Nom organisation declaree/g, "Nom organisation déclarée"],
  [/Compétences \(separees par virgules\)/g, "Compétences (séparées par des virgules)"],
  [/Centres d&apos;interet \(virgules\)/g, "Centres d&apos;intérêt (virgules)"],
  [/Quel est votre objectif principal sur 3 a 6 mois \?/g, "Quel est votre objectif principal sur 3 à 6 mois ?"],
  [/Disponibilite \(optionnel\)/g, "Disponibilité (optionnel)"],
  [/Preference de contact/g, "Préférence de contact"],
  [/J&apos;accepte l&apos;usage IA agrege\/anonyme \(optionnel\)/g, "J&apos;accepte l&apos;usage IA agrégé/anonyme (optionnel)"],
  [/Verifiez vos informations/g, "Vérifiez vos informations"],
  [/Vos donnees sont sauvegardees localement a chaque etape tant que la soumission finale/g, "Vos données sont sauvegardées localement à chaque étape tant que la soumission finale"],
  [/n&apos;est pas envoyee\./g, "n&apos;est pas envoyée."],
  [/Apres validation de votre fiche/g, "Après validation de votre fiche"],
  [/preciser la remise\./g, "préciser la remise."],
  [/Chargement des donnees\.\.\./g, "Chargement des données..."],
  [/Aller au dashboard/g, "Aller au tableau de bord"],
  [/Assistant d'onboarding : etape /g, "Assistant d'onboarding : étape "],
  [/Precedent/g, "Précédent"],
  [/Creation en cours\.\.\./g, "Création en cours..."],
]);

rewrite("app/app/support/page.tsx", [
  [/Assistant IA . titre informatif uniquement : il ne remplace pas un avis juridique, m.dical ou financier professionnel\./g, "Assistant IA à titre informatif uniquement : il ne remplace pas un avis juridique, médical ou financier professionnel."],
]);

rewrite("app/app/campagnes-email/actions.ts", [
  [/Selectionnez une region cible\./g, "Sélectionnez une région cible."],
  [/Selectionnez une prefecture cible\./g, "Sélectionnez une préfecture cible."],
  [/Selectionnez une commune cible\./g, "Sélectionnez une commune cible."],
]);

rewrite("app/app/campagnes-email/campagnes-email-client.tsx", [
  [/En file d'attente d'attente/g, "En file d'attente"],
  [/Echec/g, "Échec"],
  [/Region:/g, "Région :"],
  [/Prefecture:/g, "Préfecture :"],
  [/Envoi cible a toutes les regions, ou par region\/prefecture\/commune\./g, "Envoi ciblé à toutes les régions, ou par région/préfecture/commune."],
  [/Acces reserve a admin\/ca\/cn\/pf\/equipe communication\. Role detecte: \{role \?\? "member"\}\./g, 'Accès réservé à admin/ca/cn/pf/équipe communication. Rôle détecté : {role ?? "membre"}.'],
  [/Role actif:/g, "Rôle actif :"],
  [/Reinitialiser/g, "Réinitialiser"],
  [/Creer une campagne pour communiquer rapidement avec le reseau\./g, "Créer une campagne pour communiquer rapidement avec le réseau."],
  [/Creee le/g, "Créée le"],
  [/\{item\.stats\.pending\} pending \/ \{item\.stats\.sent\} sent/g, "{item.stats.pending} en attente / {item.stats.sent} envoyés"],
  [/Mise en file\.\.\./g, "Mise en file d'attente..."],
  [/Remettre en file/g, "Remettre en file d'attente"],
  [/Mettre en file/g, "Mettre en file d'attente"],
  [/Provider/g, "Service d'envoi"],
  [/Par region/g, "Par région"],
  [/Par prefecture/g, "Par préfecture"],
  [/Selectionner une region/g, "Sélectionner une région"],
  [/Selectionner une prefecture/g, "Sélectionner une préfecture"],
  [/Selectionner une commune/g, "Sélectionner une commune"],
  [/Creer la campagne/g, "Créer la campagne"],
]);

rewrite("app/app/communiques/communiques-client.tsx", [
  [/Region :/g, "Région :"],
  [/Prefecture:/g, "Préfecture :"],
  [/Publication d&apos;annonces ciblees : national, region, prefecture ou commune\./g, "Publication d&apos;annonces ciblées : national, région, préfecture ou commune."],
  [/Ecriture reservee a l&apos;equipe communication, CA, CN, PF ou admin\. Role detecte:\{" "\}/g, 'Écriture réservée à l&apos;équipe communication, CA, CN, PF ou admin. Rôle détecté :{" "}'],
  [/Reinitialiser/g, "Réinitialiser"],
  [/Aucun communique pour le moment/g, "Aucun communiqué pour le moment"],
  [/Creez votre premier communique pour informer les membres\./g, "Créez votre premier communiqué pour informer les membres."],
  [/Cree le/g, "Créé le"],
  [/Nouveau communique/g, "Nouveau communiqué"],
  [/Titre du communique/g, "Titre du communiqué"],
  [/Ecrivez votre annonce\.\.\./g, "Écrivez votre annonce..."],
  [/Portee/g, "Portée"],
  [/Par region/g, "Par région"],
  [/Par prefecture/g, "Par préfecture"],
  [/Selectionner une region/g, "Sélectionner une région"],
  [/Selectionner une prefecture/g, "Sélectionner une préfecture"],
  [/Selectionner une commune/g, "Sélectionner une commune"],
  [/Publier le communique/g, "Publier le communiqué"],
  [/Modifier le communique/g, "Modifier le communiqué"],
]);

rewrite("app/app/membres/[id]/member-role-form.tsx", [
  [/member: "Member"/g, 'member: "Membre"'],
  [/\{ label: "Member", value: "member" \}/g, '{ label: "Membre", value: "member" }'],
  [/Impossible de resoudre le compte utilisateur cible\./g, "Impossible de résoudre le compte utilisateur cible."],
  [/Role actuel:/g, "Rôle actuel :"],
  [/Ce role ne permet pas de modifier les roles gouvernance\./g, "Ce rôle ne permet pas de modifier les rôles de gouvernance."],
  [/Compte proprietaire technique \(`\{OWNER_ADMIN_EMAIL\}`\): role admin verrouille en interface\./g, "Compte propriétaire technique (`{OWNER_ADMIN_EMAIL}`) : rôle admin verrouillé en interface."],
  [/Role du membre/g, "Rôle du membre"],
]);

rewrite("app/app/membres/[id]/actions.ts", [
  [/Impossible de mettre a jour ce membre\./g, "Impossible de mettre à jour ce membre."],
  [/Selectionnez une organisation existante ou renseignez un nouveau nom d'organisation\./g, "Sélectionnez une organisation existante ou renseignez un nouveau nom d'organisation."],
  [/Seuls les roles admin\/ca peuvent modifier un role\./g, "Seuls les rôles admin/ca peuvent modifier un rôle."],
  [/Le role CA peut attribuer uniquement member\/pf\/cn\./g, "Le rôle CA peut attribuer uniquement membre/pf/cn."],
  [/Un role CA ne peut pas modifier son propre role\./g, "Un rôle CA ne peut pas modifier son propre rôle."],
  [/Le compte proprietaire \$\{OWNER_ADMIN_EMAIL\} doit conserver le role admin\./g, "Le compte propriétaire ${OWNER_ADMIN_EMAIL} doit conserver le rôle admin."],
  [/Role non modifie\. Verifiez les policies profile puis reappliquez `sql\/2026-02-22_profile_role_governance_access\.sql`\./g, "Rôle non modifié. Vérifiez les politiques `profile`, puis réappliquez `sql/2026-02-22_profile_role_governance_access.sql`."],
  [/Role mis a jour : /g, "Rôle mis à jour : "],
]);

rewrite("app/app/membres/[id]/page.tsx", [
  [/charger le detail du membre\./g, "charger le détail du membre."],
  [/\.\/member-rôle-form/g, "./member-role-form"],
  [/Role gouvernance/g, "Rôle de gouvernance"],
  [/uniquement member\/pf\/cn\. Le compte proprietaire technique reste verrouille en admin\./g, "uniquement membre/pf/cn. Le compte propriétaire technique reste verrouillé en admin."],
]);

rewrite("app/app/organisations/page.tsx", [[/derive de public\.member/g, "dérivé de public.member"]]);

rewrite("app/(auth)/signup/page.tsx", [
  [/Compte cree\. Verifiez votre email pour confirmer l'inscription, puis connectez-vous\./g, "Compte créé. Vérifiez votre email pour confirmer l'inscription, puis connectez-vous."],
]);

rewrite("app/(auth)/forgot-password/page.tsx", [
  [/Un email de réinitialisation a ete envoyé\. Ouvrez le lien pour definir un nouveau mot de passe\./g, "Un email de réinitialisation a été envoyé. Ouvrez le lien pour définir un nouveau mot de passe."],
]);

rewrite("app/(auth)/reset-password/page.tsx", [[/au moins 8 caracteres\./g, "au moins 8 caractères."]]);

rewrite("lib/supabase/organisation.ts", [
  [/Aucune table organisation\/organization détectée pour l'insertion\./g, "Aucune table organisation détectée pour l'insertion."],
  [/Table organisations detectee mais schema incompatible avec l'insertion MVP\./g, "Table organisations détectée mais schéma incompatible avec l'insertion MVP."],
]);
