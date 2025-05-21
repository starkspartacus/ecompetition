const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🧹 Nettoyage complet de Prisma...");

try {
  // Supprimer le dossier .next
  const nextDir = path.join(process.cwd(), ".next");
  if (fs.existsSync(nextDir)) {
    console.log("🗑️  Suppression du dossier .next...");
    fs.rmSync(nextDir, { recursive: true, force: true });
  }

  // Supprimer le dossier node_modules/.prisma
  const prismaDir = path.join(process.cwd(), "node_modules", ".prisma");
  if (fs.existsSync(prismaDir)) {
    console.log("🗑️  Suppression du dossier node_modules/.prisma...");
    fs.rmSync(prismaDir, { recursive: true, force: true });
  }

  // Supprimer le dossier node_modules/@prisma
  const prismaPkgDir = path.join(process.cwd(), "node_modules", "@prisma");
  if (fs.existsSync(prismaPkgDir)) {
    console.log("🗑️  Suppression du dossier node_modules/@prisma...");
    fs.rmSync(prismaPkgDir, { recursive: true, force: true });
  }

  // Réinstaller Prisma
  console.log("📦 Réinstallation de prisma et @prisma/client...");
  execSync("npm install prisma @prisma/client --save", { stdio: "inherit" });

  // Générer le client Prisma
  console.log("🔨 Génération du client Prisma...");
  execSync("npx prisma generate", { stdio: "inherit" });

  console.log("✅ Réinitialisation de Prisma terminée avec succès!");
} catch (error) {
  console.error(
    "❌ Erreur lors de la réinitialisation de Prisma:",
    error.message
  );
  process.exit(1);
}
