import { NextResponse } from "next/server";
import { readdirSync, statSync } from "fs";
import { join } from "path";

export async function GET() {
  const routes: string[] = [];

  function scanDirectory(dir: string, basePath = "") {
    try {
      const items = readdirSync(dir);

      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          const newBasePath = basePath + "/" + item;
          scanDirectory(fullPath, newBasePath);
        } else if (item === "route.ts" || item === "page.tsx") {
          routes.push(basePath + " -> " + item);
        }
      }
    } catch (error) {
      console.error(`Erreur lors du scan de ${dir}:`, error);
    }
  }

  scanDirectory(join(process.cwd(), "app"));

  return NextResponse.json({
    routes: routes.sort(),
    conflicts: routes.filter((route) => route.includes("[id]")),
  });
}
