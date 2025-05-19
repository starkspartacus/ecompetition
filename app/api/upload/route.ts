import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique
    const filename = `${nanoid()}-${file.name}`;

    // Télécharger le fichier vers Vercel Blob
    const { url } = await put(filename, file, {
      access: "public",
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Erreur lors du téléchargement de l'image:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors du téléchargement de l'image" },
      { status: 500 }
    );
  }
}
