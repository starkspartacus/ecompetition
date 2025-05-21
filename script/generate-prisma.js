const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔄 Génération du client Prisma...");

try {
  // Vérifier si le dossier node_modules/@prisma existe
  const prismaNodeModulesPath = path.join(
    process.cwd(),
    "node_modules",
    "@prisma"
  );
  if (!fs.existsSync(prismaNodeModulesPath)) {
    console.log("📦 Installation de prisma...");
    execSync("npm install prisma --save-dev", { stdio: "inherit" });
  }

  // Générer le client Prisma
  console.log("🔨 Exécution de prisma generate...");
  execSync("npx prisma generate", { stdio: "inherit" });

  console.log("✅ Client Prisma généré avec succès!");
} catch (error) {
  console.error(
    "❌ Erreur lors de la génération du client Prisma:",
    error.message
  );
  process.exit(1);
}
