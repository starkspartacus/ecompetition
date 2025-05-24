// This script resets the Prisma client and database connection
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("Resetting Prisma client and database connection...");

// Path to the Prisma client directory
const prismaClientDir = path.join(__dirname, "../node_modules/.prisma");

// Check if the directory exists
if (fs.existsSync(prismaClientDir)) {
  console.log("Removing Prisma client directory...");
  try {
    fs.rmSync(prismaClientDir, { recursive: true, force: true });
    console.log("Prisma client directory removed successfully.");
  } catch (error) {
    console.error("Error removing Prisma client directory:", error.message);
  }
}

// Generate a new Prisma client
console.log("Generating new Prisma client...");
try {
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("Prisma client generated successfully!");
} catch (error) {
  console.error("Error generating Prisma client:", error.message);
}

console.log("Prisma reset complete. Please restart your application.");
