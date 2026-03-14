import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

const ROOT_DIRS = ["app", "components", "lib"];
const FILE_EXTENSIONS = new Set([".ts", ".tsx"]);
const SUSPICIOUS_MOJIBAKE = /[ÃÂâ€™œž�]/;

const EXACT_REPLACEMENTS = [
  ["A propos du CZI", "\u00c0 propos du CZI"],
  ["A propos", "\u00c0 propos"],
  ["Parametres", "Param\u00e8tres"],
  ["Communiques", "Communiqu\u00e9s"],
  ["Communaute", "Communaut\u00e9"],
  ["Communautes", "Communaut\u00e9s"],
  ["Reinitialiser", "R\u00e9initialiser"],
  ["reinitialisation", "r\u00e9initialisation"],
  ["Verification", "V\u00e9rification"],
  ["Creer", "Cr\u00e9er"],
  ["Creation", "Cr\u00e9ation"],
  ["creation", "cr\u00e9ation"],
  ["Precedent", "Pr\u00e9c\u00e9dent"],
  ["Selectionner", "S\u00e9lectionner"],
  ["selectionnez", "s\u00e9lectionnez"],
  ["Selectionnez", "S\u00e9lectionnez"],
  ["Telephone", "T\u00e9l\u00e9phone"],
  ["Prenom", "Pr\u00e9nom"],
  ["Pr?nom", "Pr\u00e9nom"],
  ["Disponibilite", "Disponibilit\u00e9"],
  ["Preference", "Pr\u00e9f\u00e9rence"],
  ["Frequence", "Fr\u00e9quence"],
  ["Idee", "Id\u00e9e"],
  ["Competence", "Comp\u00e9tence"],
  ["Competences", "Comp\u00e9tences"],
  ["interets", "int\u00e9r\u00eats"],
  ["Interets", "Int\u00e9r\u00eats"],
  ["donnees", "donn\u00e9es"],
  ["Donnees", "Donn\u00e9es"],
  ["Ecrivez", "\u00c9crivez"],
  ["Ecrans", "\u00c9crans"],
  ["Prive", "Priv\u00e9"],
  ["prive", "priv\u00e9"],
  ["Reponse", "R\u00e9ponse"],
  ["reponses", "r\u00e9ponses"],
  ["edition", "\u00e9dition"],
  ["Edition", "\u00c9dition"],
  ["Etape", "\u00c9tape"],
  ["etape", "\u00e9tape"],
  ["Definir", "D\u00e9finir"],
  ["definir", "d\u00e9finir"],
  ["deja", "d\u00e9j\u00e0"],
  ["Aucune conversation selectionnee.", "Aucune conversation s\u00e9lectionn\u00e9e."],
  ["Choisissez une communaute ou une discussion privee.", "Choisissez une communaut\u00e9 ou une discussion priv\u00e9e."],
  ["Supprimer cette sous-communaute ? Cette action est definitive.", "Supprimer cette sous-communaut\u00e9 ? Cette action est d\u00e9finitive."],
  ["Message prive", "Message priv\u00e9"],
  ["Selectionner une communaute", "S\u00e9lectionner une communaut\u00e9"],
  ["RLS gouvernance : vue elargie sur plusieurs membres.", "RLS gouvernance : vue \u00e9largie sur plusieurs membres."],
  ["La priorite strategique est l'ODD 1, avec des actions concretes pour l inclusion, l'insertion et l autonomisation.", "La priorit\u00e9 strat\u00e9gique est l'ODD 1, avec des actions concr\u00e8tes pour l'inclusion, l'insertion et l'autonomisation."],
  ["Appliquez le script SQL `sql/2026-02-21_fix_member_profile_rls.sql` dans Supabase, puis reessayez.", "Appliquez le script SQL `sql/2026-02-21_fix_member_profile_rls.sql` dans Supabase, puis r\u00e9essayez."],
  ["Espace discussion style reseau social: reponses, likes, edition, tags.", "Espace de discussion, style r\u00e9seau social : r\u00e9ponses, likes, \u00e9dition, tags."],
  ["Toutes discussions", "Toutes les discussions"],
  ["region/prefecture/commune", "r\u00e9gion/pr\u00e9fecture/commune"],
  ["d'abord une region", "d'abord une r\u00e9gion"],
  ["une region", "une r\u00e9gion"],
  ["une prefecture", "une pr\u00e9fecture"],
  ["Par region", "Par r\u00e9gion"],
  ["Par prefecture", "Par pr\u00e9fecture"],
  ["Liste des regions", "Liste des r\u00e9gions"],
  ["Liste des prefectures", "Liste des pr\u00e9fectures"],
  ["Toutes regions", "Toutes r\u00e9gions"],
  ["Toutes prefectures", "Toutes pr\u00e9fectures"],
  ["Région", "R\u00e9gion"],
  ["Préfecture", "Pr\u00e9fecture"],
  ["region", "r\u00e9gion"],
  ["prefecture", "pr\u00e9fecture"],
];

const REGEX_REPLACEMENTS = [
  [/\brole\b/g, "r\u00f4le"],
  [/\bRole\b/g, "R\u00f4le"],
  [/\bconfigure\b/g, "configur\u00e9"],
  [/\bConfigure\b/g, "Configur\u00e9"],
  [/\bengage\b/g, "engag\u00e9"],
  [/\bEngage\b/g, "Engag\u00e9"],
  [/\bmobilite\b/g, "mobilit\u00e9"],
  [/\bcumule\b/g, "cumul\u00e9"],
  [/\bfinalisee\b/g, "finalis\u00e9e"],
  [/\bvalidee\b/g, "valid\u00e9e"],
  [/\brejetee\b/g, "rejet\u00e9e"],
  [/\benregistree\b/g, "enregistr\u00e9e"],
  [/\bdeclare\b/g, "d\u00e9clar\u00e9"],
  [/\bdeclaree\b/g, "d\u00e9clar\u00e9e"],
  [/\bactivite\b/g, "activit\u00e9"],
  [/\bActivite\b/g, "Activit\u00e9"],
  [/\bactivites\b/g, "activit\u00e9s"],
  [/\bActivites\b/g, "Activit\u00e9s"],
];

function collectFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === ".next" || entry.name === "dist" || entry.name === "node_modules") {
      continue;
    }

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

function isPathLike(value) {
  return value.startsWith("/") || value.startsWith("./") || value.startsWith("../");
}

function isIdentifierLike(value) {
  return /^[a-z0-9_./:-]+$/.test(value);
}

function decodeMojibake(value) {
  let current = value;

  for (let index = 0; index < 3; index += 1) {
    if (!SUSPICIOUS_MOJIBAKE.test(current)) {
      break;
    }

    const decoded = Buffer.from(current, "latin1").toString("utf8");
    if (decoded === current) {
      break;
    }
    current = decoded;
  }

  return current.replace(/\uFFFD/g, "");
}

function fixPathLikeText(value) {
  return value
    .replace(/communaut(?:\u00e9|Ã©)/g, "communaute")
    .replace(/\/app\/communaut(?:\u00e9|Ã©)/g, "/app/communaute")
    .replace(/\.\/communaut(?:\u00e9|Ã©)-client/g, "./communaute-client");
}

function fixVisibleText(value) {
  let next = value;

  for (const [from, to] of EXACT_REPLACEMENTS) {
    next = next.split(from).join(to);
  }

  for (const [pattern, replacement] of REGEX_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next
    .replace(/l inclusion/g, "l'inclusion")
    .replace(/l autonomisation/g, "l'autonomisation")
    .replace(/l amelioration/g, "l'am\u00e9lioration")
    .replace(/3 a 6 mois/g, "3 \u00e0 6 mois")
    .replace(/\ba ete\b/g, "a \u00e9t\u00e9")
    .replace(/\bete\b/g, "\u00e9t\u00e9");
}

function fixText(value) {
  const decoded = decodeMojibake(value);

  if (isPathLike(decoded)) {
    return fixPathLikeText(decoded);
  }

  if (isIdentifierLike(decoded)) {
    return decoded;
  }

  return fixVisibleText(decoded);
}

function fixJsxText(value) {
  return fixText(value).replace(/'/g, "\u2019");
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

  const edits = [];

  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const fixed = fixText(node.text);
      if (fixed !== node.text) {
        edits.push({
          start: node.getStart(sourceFile) + 1,
          end: node.getEnd() - 1,
          text: fixed,
        });
      }
    }

    if (ts.isJsxText(node)) {
      const raw = node.getFullText(sourceFile);
      const fixed = fixJsxText(raw);
      if (fixed !== raw) {
        edits.push({
          start: node.getFullStart(),
          end: node.getEnd(),
          text: fixed,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (edits.length === 0) {
    return false;
  }

  edits.sort((left, right) => right.start - left.start);

  let updated = sourceText;
  for (const edit of edits) {
    updated = updated.slice(0, edit.start) + edit.text + updated.slice(edit.end);
  }

  if (updated === sourceText) {
    return false;
  }

  fs.writeFileSync(filePath, updated, "utf8");
  return true;
}

let changedFiles = 0;

for (const rootDir of ROOT_DIRS) {
  const fullRoot = path.join(process.cwd(), rootDir);
  if (!fs.existsSync(fullRoot)) {
    continue;
  }

  for (const filePath of collectFiles(fullRoot)) {
    if (transformFile(filePath)) {
      changedFiles += 1;
    }
  }
}

console.log(`changed_files=${changedFiles}`);
