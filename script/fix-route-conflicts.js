const fs = require("fs");
const path = require("path");

// Scanner pour trouver les conflits de routes
function findRouteConflicts() {
  const appDir = path.join(process.cwd(), "app");
  const routes = [];

  function scanDir(dir, currentPath = "") {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const newPath = currentPath + "/" + item;
        scanDir(fullPath, newPath);
      } else if (item === "route.ts" || item === "page.tsx") {
        routes.push({
          path: currentPath,
          file: item,
          fullPath: fullPath,
        });
      }
    }
  }

  scanDir(appDir);

  // Analyser les conflits
  const conflicts = [];
  const pathGroups = {};

  routes.forEach((route) => {
    const segments = route.path.split("/").filter(Boolean);
    const dynamicSegments = segments.filter(
      (seg) => seg.startsWith("[") && seg.endsWith("]")
    );

    if (dynamicSegments.length > 0) {
      const key = segments.slice(0, -1).join("/"); // Chemin parent
      if (!pathGroups[key]) pathGroups[key] = [];
      pathGroups[key].push(route);
    }
  });

  // Détecter les conflits
  Object.entries(pathGroups).forEach(([parentPath, routes]) => {
    const dynamicNames = routes.map((r) => {
      const segments = r.path.split("/").filter(Boolean);
      return segments[segments.length - 1];
    });

    const duplicates = dynamicNames.filter(
      (name, index) => dynamicNames.indexOf(name) !== index
    );

    if (duplicates.length > 0) {
      conflicts.push({
        parentPath,
        conflictingRoutes: routes,
        duplicateNames: [...new Set(duplicates)],
      });
    }
  });

  return { routes, conflicts };
}

// Exécuter l'analyse
const { routes, conflicts } = findRouteConflicts();

console.log("🔍 Analyse des routes...\n");
console.log(`📁 Total des routes trouvées: ${routes.length}`);

if (conflicts.length > 0) {
  console.log("\n❌ Conflits détectés:");
  conflicts.forEach((conflict, index) => {
    console.log(`\n${index + 1}. Conflit dans: ${conflict.parentPath}`);
    console.log(`   Noms dupliqués: ${conflict.duplicateNames.join(", ")}`);
    console.log("   Routes en conflit:");
    conflict.conflictingRoutes.forEach((route) => {
      console.log(`   - ${route.path} (${route.file})`);
    });
  });

  console.log("\n🔧 Solutions suggérées:");
  console.log("1. Renommer les segments dynamiques pour qu'ils soient uniques");
  console.log("2. Restructurer l'arborescence des routes");
  console.log("3. Utiliser des catch-all routes [...slug] si approprié");
} else {
  console.log("\n✅ Aucun conflit de route détecté!");
}

console.log("\n📋 Liste complète des routes:");
routes.forEach((route) => {
  const isDynamic = route.path.includes("[") && route.path.includes("]");
  const icon = isDynamic ? "🔀" : "📄";
  console.log(`${icon} ${route.path} -> ${route.file}`);
});
