const fs = require('fs');
const ts = require('typescript');
const { execFileSync } = require('child_process');

const files = execFileSync('rg', ['--files', 'app', 'components', 'lib', '-g', '*.ts', '-g', '*.tsx'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);

const exactMachineMap = new Map([
  ['région', 'region'],
  ['régions', 'regions'],
  ['préfecture', 'prefecture'],
  ['préfectures', 'prefectures'],
  ['rï¿½gion', 'region'],
  ['rï¿½gions', 'regions'],
  ['prï¿½fecture', 'prefecture'],
  ['prï¿½fectures', 'prefectures'],
  ['r�gion', 'region'],
  ['r�gions', 'regions'],
  ['pr�fecture', 'prefecture'],
  ['pr�fectures', 'prefectures'],
]);

const textPairs = [
  ['A propos du CZI', '\u00c0 propos du CZI'],
  ['A propos', '\u00c0 propos'],
  ['Collectif Zero Indigent', 'Collectif Z\u00e9ro Indigent'],
  ['Communiques', 'Communiqu\u00e9s'],
  ['Communaute', 'Communaut\u00e9'],
  ['Communautes', 'Communaut\u00e9s'],
  ['Parametres', 'Param\u00e8tres'],
  ['Campagnes email', 'Campagnes e-mail'],
  ['Communes/Regions', 'Communes/R\u00e9gions'],
  ['Contribuer a eliminer l\'extreme pauvrete et la faim.', 'Contribuer \u00e0 \u00e9liminer l\'extr\u00eame pauvret\u00e9 et la faim.'],
  ['Le collectif est fonde le 17 avril 2020.', 'Le collectif est fond\u00e9 le 17 avril 2020.'],
  ['Annee de creation', 'Ann\u00e9e de cr\u00e9ation'],
  ['Promouvoir l\'autonomisation economique des femmes et des jeunes.', 'Promouvoir l\'autonomisation \u00e9conomique des femmes et des jeunes.'],
  ['Contribuer a l\'amelioration de la sante des populations.', 'Contribuer \u00e0 l\'am\u00e9lioration de la sant\u00e9 des populations.'],
  ['Faciliter la transition ecole-marche du travail des jeunes.', 'Faciliter la transition \u00e9cole-march\u00e9 du travail des jeunes.'],
  ['Promouvoir des mecanismes d\'inclusion pour les publics vulnerables.', 'Promouvoir des m\u00e9canismes d\'inclusion pour les publics vuln\u00e9rables.'],
  ['Developper la resilience face au rechauffement climatique.', 'D\u00e9velopper la r\u00e9silience face au r\u00e9chauffement climatique.'],
  ['Renforcer la collaboration Etat-jeunesse pour la paix sociale.', 'Renforcer la collaboration \u00c9tat-jeunesse pour la paix sociale.'],
  ['Citoyennete et developpement local', 'Citoyennet\u00e9 et d\u00e9veloppement local'],
  ['Sante et bien-etre', 'Sant\u00e9 et bien-\u00eatre'],
  ['Inclusion, securite et droits humains', 'Inclusion, s\u00e9curit\u00e9 et droits humains'],
  ['Insertion professionnelle et croissance economique', 'Insertion professionnelle et croissance \u00e9conomique'],
  ['Climat et energies renouvelables', 'Climat et \u00e9nergies renouvelables'],
  ['Acceder a la plateforme', 'Acc\u00e9der \u00e0 la plateforme'],
  ['Accedez a votre espace membre pour continuer.', 'Acc\u00e9dez \u00e0 votre espace membre pour continuer.'],
  ['Mot de passe oublie ?', 'Mot de passe oubli\u00e9 ?'],
  ['Mot de passe oublie', 'Mot de passe oubli\u00e9'],
  ['Reinitialiser le mot de passe', 'R\u00e9initialiser le mot de passe'],
  ['Creation...', 'Cr\u00e9ation...'],
  ['Creer mon compte', 'Cr\u00e9er mon compte'],
  ['Deja inscrit?', 'D\u00e9j\u00e0 inscrit ?'],
  ['Retour a la', 'Retour \u00e0 la'],
  ['Supabase non configure.', 'Supabase non configur\u00e9.'],
  ['Supabase non configure. Ajoutez les variables d\'environnement.', 'Supabase non configur\u00e9. Ajoutez les variables d\'environnement.'],
  ['Configuration territoriale incomplete (region/prefecture/commune). Ajoutez ces donnees dans Supabase avant de terminer l\'inscription.', 'Configuration territoriale incompl\u00e8te (r\u00e9gion/pr\u00e9fecture/commune). Ajoutez ces donn\u00e9es dans Supabase avant de terminer l\'inscription.'],
  ['Impossible de charger region/prefecture/commune pour le moment.', 'Impossible de charger r\u00e9gion/pr\u00e9fecture/commune pour le moment.'],
  ['Completer l\'onboarding', 'Compl\u00e9ter l\'inscription'],
  ['Terminer l\'onboarding', 'Terminer l\'inscription'],
  ['Wizard onboarding: etape', 'Parcours d\'inscription : \u00e9tape'],
  ['Precedent', 'Pr\u00e9c\u00e9dent'],
  ['Selectionner', 'S\u00e9lectionner'],
  ['Frequence', 'Fr\u00e9quence'],
  ['Disponibilite', 'Disponibilit\u00e9'],
  ['Preference', 'Pr\u00e9f\u00e9rence'],
  ['Role', 'R\u00f4le'],
  ['Competences', 'Comp\u00e9tences'],
  ['interet', 'int\u00e9r\u00eat'],
  ['televerser', 't\u00e9l\u00e9verser'],
  ['televersement', 't\u00e9l\u00e9versement'],
  ['telecharge', 't\u00e9l\u00e9charge'],
  ['reinitialisation', 'r\u00e9initialisation'],
  ['reinitialiser', 'r\u00e9initialiser'],
  ['reinitialisation', 'r\u00e9initialisation'],
  ['bientot', 'bient\u00f4t'],
  ['configure', 'configur\u00e9'],
  ['deja', 'd\u00e9j\u00e0'],
  ['donnees', 'donn\u00e9es'],
  ['reseau', 'r\u00e9seau'],
  ['pauvrete', 'pauvret\u00e9'],
  ['extreme', 'extr\u00eame'],
  ['strategique', 'strat\u00e9gique'],
  ['concretes', 'concr\u00e8tes'],
  ['energies', '\u00e9nergies'],
  ['developpement', 'd\u00e9veloppement'],
  ['Developpement', 'D\u00e9veloppement'],
  ['amelioration', 'am\u00e9lioration'],
  ['Sante', 'Sant\u00e9'],
  ['Citoyennete', 'Citoyennet\u00e9'],
  ['Rembourse', 'Rembours\u00e9'],
  ['Echec', '\u00c9chec'],
  ['Paye', 'Pay\u00e9'],
  ['Prete', 'Pr\u00eate'],
  ['Imprimee', 'Imprim\u00e9e'],
  ['Livree', 'Livr\u00e9e'],
  ['Annulee', 'Annul\u00e9e'],
  ['recue', 're\u00e7ue'],
  ['validee', 'valid\u00e9e'],
  ['rejetee', 'rejet\u00e9e'],
  ['compl�t', 'compl\u00e9t'],
  ['activit�', 'activit\u00e9'],
  ['r�le', 'r\u00f4le'],
  ['pr�nom', 'pr\u00e9nom'],
  ['t�l�phone', 't\u00e9l\u00e9phone'],
  ['s�lectionnez', 's\u00e9lectionnez'],
  ['fr�quence', 'fr\u00e9quence'],
  ['int�r�ts', 'int\u00e9r\u00eats'],
  ['SÃ©lectionner', 'S\u00e9lectionner'],
  ['Ã‰tape', '\u00c9tape'],
  ['CrÃ©ation', 'Cr\u00e9ation'],
  ['PrÃ©cÃ©dent', 'Pr\u00e9c\u00e9dent'],
];

function decodeEscapes(s) {
  return s.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function maybeFixMojibake(text) {
  let current = text;
  for (let i = 0; i < 3; i += 1) {
    if (!/[ÃÂ�ï]/.test(current)) break;
    const converted = Buffer.from(current, 'latin1').toString('utf8');
    if (converted === current) break;
    current = converted;
  }
  return current;
}

function replaceText(input) {
  let text = input;
  const trimmed = text.trim();
  if (exactMachineMap.has(trimmed) && trimmed === text) {
    return exactMachineMap.get(trimmed);
  }
  text = maybeFixMojibake(text);
  for (const [from, to] of textPairs) {
    text = text.split(from).join(decodeEscapes(to));
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
console.log(`Normalized ${changed} files`);
