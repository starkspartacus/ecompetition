const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Chemin vers le dossier .next
const nextDir = path.join(__dirname, "..", ".next");

// Fonction pour supprimer un dossier de manière récursive
function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Récursion
        deleteFolderRecursive(curPath);
      } else {
        // Supprimer le fichier
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
}

// Supprimer le dossier .next
console.log("Suppression du dossier .next...");
deleteFolderRecursive(nextDir);
console.log("Dossier .next supprimé avec succès.");

// Exécuter prisma generate pour régénérer le client Prisma
console.log("Régénération du client Prisma...");
exec("npx prisma generate", (error, stdout, stderr) => {
  if (error) {
    console.error(
      `Erreur lors de la régénération du client Prisma: ${error.message}`
    );
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.log("Client Prisma régénéré avec succès.");
});
