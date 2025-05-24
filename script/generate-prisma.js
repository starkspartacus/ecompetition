// This script generates the Prisma client
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Path to the schema file
const schemaPath = path.join(__dirname, "../prisma/schema.prisma");

// Check if the schema file exists
if (!fs.existsSync(schemaPath)) {
  console.error("Schema file not found at:", schemaPath);
  process.exit(1);
}

console.log("Generating Prisma client...");

try {
  // Run the prisma generate command
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("Prisma client generated successfully!");
} catch (error) {
  console.error("Error generating Prisma client:", error.message);
  process.exit(1);
}

// Optionally, you can add code to restart your application here
console.log(
  "Remember to restart your application to use the new Prisma client."
);
