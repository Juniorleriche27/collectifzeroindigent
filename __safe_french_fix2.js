const fs = require('fs');
const ts = require('typescript');
const { execFileSync } = require('child_process');

const files = execFileSync('rg', ['--files', 'app', 'components', 'lib', '-g', '*.ts', '-g', '*.tsx'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);

const replacements = [
  ['rï¿½gions', 'regions'],
  ['prï¿½fectures', 'prefectures'],
  ['Rï¿½gion', 'R\u00e9gion'],
  ['Rï¿½gions', 'R\u00e9gions'],
  ['Prï¿½fecture', 'Pr\u00e9fecture'],
  ['Prï¿½fectures', 'Pr\u00e9fectures'],
  ['Communes/Rï¿½gions', 'Communes/R\u00e9gions'],
  ['/app/communes-rï¿½gions', '/app/communes-regions'],
  ['Paramï¿½tres', 'Param\u00e8tres'],
  ['Zï¿½ro', 'Z\u00e9ro'],
  ['rï¿½seau', 'r\u00e9seau'],
  ['rï¿½seaux', 'r\u00e9seaux'],
  ['rï¿½silientes', 'r\u00e9silientes'],
  ['donnï¿½es', 'donn\u00e9es'],
  ['donn�es', 'donn\u00e9es'],
  ['d\u00e9monstration', 'd\u00e9monstration'],
  ['demonstration', 'd\u00e9monstration'],
  ['configurï¿½', 'configur\u00e9'],
  ['configur�', 'configur\u00e9'],
  ['complï¿½te', 'compl\u00e8te'],
  ['incomplï¿½te', 'incompl\u00e8te'],
  ['sauvegardï¿½es', 'sauvegard\u00e9es'],
  ['�tape', '\u00c9tape'],
  ['engag�', 'engag\u00e9'],
  ['Communaut�', 'Communaut\u00e9'],
  ['Communaut�s', 'Communaut\u00e9s'],
  ['complï¿½ter', 'compl\u00e9ter'],
  ['televerser', 't\u00e9l\u00e9verser'],
  ['telecharge', 't\u00e9l\u00e9charge'],
  ['reinitialisation', 'r\u00e9initialisation'],
  ['reinitialiser', 'r\u00e9initialiser'],
  ['Accedez', 'Acc\u00e9dez'],
  ['Acceder', 'Acc\u00e9der'],
  ['A propos', '\u00c0 propos'],
  ['A propos du CZI', '\u00c0 propos du CZI'],
  ['Collectif Zero Indigent', 'Collectif Z\u00e9ro Indigent'],
  ['Le reseau est constitue officiellement le 17 avril 2020 par 15 associations et ONG de jeunesse.', 'Le r\u00e9seau est constitu\u00e9 officiellement le 17 avril 2020 par 15 associations et ONG de jeunesse.'],
  ['CZI est un reseau de jeunes engages au service des ODD, organise autour de la cooperation entre acteurs de jeunesse.', 'CZI est un r\u00e9seau de jeunes engag\u00e9s au service des ODD, organis\u00e9 autour de la coop\u00e9ration entre acteurs de jeunesse.'],
  ['La priorite strategique est l ODD 1, avec des actions concretes pour l inclusion, l insertion et l autonomisation.', 'La priorit\u00e9 strat\u00e9gique est l\'ODD 1, avec des actions concr\u00e8tes pour l\'inclusion, l\'insertion et l\'autonomisation.'],
  ['CZI est un reseau de jeunes qui mobilise la synergie d actions pour accelerer l atteinte', 'CZI est un r\u00e9seau de jeunes qui mobilise la synergie d\'actions pour acc\u00e9l\u00e9rer l\'atteinte'],
  ['des Objectifs de Developpement Durable. Le cadre institutionnel met l accent sur', 'des Objectifs de D\u00e9veloppement Durable. Le cadre institutionnel met l\'accent sur'],
  ['l accompagnement, la formation, l insertion et l entrepreneuriat des jeunes.', 'l\'accompagnement, la formation, l\'insertion et l\'entrepreneuriat des jeunes.'],
  ['Domaines d action', 'Domaines d\'action'],
  ['Axes strategiques', 'Axes strat\u00e9giques'],
  ['Sant\u00e9 communautaire et prevention', 'Sant\u00e9 communautaire et pr\u00e9vention'],
  ['Autonomisation economique des jeunes et des femmes', 'Autonomisation \u00e9conomique des jeunes et des femmes'],
  ['Le Collectif Z\u00e9ro Indigent (CZI) est un cadre d\'engagement citoyen et entrepreneurial fond\u00e9 par des', 'Le Collectif Z\u00e9ro Indigent (CZI) est un cadre d\'engagement citoyen et entrepreneurial fond\u00e9 par des'],
  ['Salut de la sante', 'Sant\u00e9'],
  ['Rejoignez la dynamique CZI et transformez votre engagement en impact.', 'Rejoignez la dynamique CZI et transformez votre engagement en impact.'],
  ['Supabase non configure.', 'Supabase non configur\u00e9.'],
  ['Supabase non configure: formulaire actif avec donn\u00e9es de demonstration.', 'Supabase non configur\u00e9 : formulaire actif avec donn\u00e9es de d\u00e9monstration.'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes rï¿½gions', 'Toutes les r\u00e9gions'],
  ['Toutes prï¿½fectures', 'Toutes les pr\u00e9fectures'],
  ['Liste des rï¿½gions', 'Liste des r\u00e9gions'],
  ['Liste des prï¿½fectures', 'Liste des pr\u00e9fectures'],
  ['Envoi cible a toutes les rï¿½gions, ou par rï¿½gion/prï¿½fecture/commune.', 'Envoi cibl\u00e9 \u00e0 toutes les r\u00e9gions, ou par r\u00e9gion/pr\u00e9fecture/commune.'],
  ['Import de donnï¿½es', 'Import de donn\u00e9es'],
  ['Flux de donnï¿½es', 'Flux de donn\u00e9es'],
  ['Point d\'entree pour les operations de migration de donnï¿½es.', 'Point d\'entr\u00e9e pour les op\u00e9rations de migration de donn\u00e9es.'],
  ['Export de donnï¿½es', 'Export de donn\u00e9es'],
  ['Membre: lecture rï¿½seau autorisee. Rï¿½gion personnelle appliquee par defaut, filtres ouverts sur toutes les rï¿½gions.', 'Membre : lecture r\u00e9seau autoris\u00e9e. R\u00e9gion personnelle appliqu\u00e9e par d\u00e9faut, filtres ouverts sur toutes les r\u00e9gions.'],
  ['Configurez Supabase pour charger les donnï¿½es membres.', 'Configurez Supabase pour charger les donn\u00e9es membres.'],
  ['Completer d\'abord l\'onboarding avant de demander une carte membre.', 'Compl\u00e9tez d\'abord l\'inscription avant de demander une carte de membre.'],
  ['Impossible de televerser la photo.', 'Impossible de t\u00e9l\u00e9verser la photo.'],
  ['Completer l&apos;onboarding', 'Compl\u00e9ter l&apos;inscription'],
  ['Completer au minimum le nom complet et un contact avant l\'etablissement de la carte.', 'Compl\u00e9tez au minimum le nom complet et un contact avant l\'\u00e9tablissement de la carte.'],
  ['Creation table organisation desactivee', 'Cr\u00e9ation de la table organisation d\u00e9sactiv\u00e9e'],
  ['Jeune engag�', 'Jeune engag\u00e9'],
  ['Frequence d&apos;engagement', 'Fr\u00e9quence d&apos;engagement'],
  ['Selectionner', 'S\u00e9lectionner'],
  ['Supprimer ce message ? Cette action est definitive.', 'Supprimer ce message ? Cette action est d\u00e9finitive.'],
  ['Supprimer cette sous-communaute ? Cette action est definitive.', 'Supprimer cette sous-communaut\u00e9 ? Cette action est d\u00e9finitive.'],
  ['Communaut� de cellule', 'Communaut\u00e9 de cellule'],
  ['Selectionner une communaute', 'S\u00e9lectionner une communaut\u00e9'],
  ['Communaut� cellule', 'Communaut\u00e9 de cellule'],
  ['Titre de la sous-communaute', 'Titre de la sous-communaut\u00e9'],
  ['Engage', 'Engag\u00e9'],
];

function replaceText(input) {
  let text = input;
  for (const [from, to] of replacements) {
    text = text.split(from).join(to.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16))));
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
console.log(`Fixed ${changed} files`);
