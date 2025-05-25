import { NextResponse } from "next/server";
import { uploadImageServer, type ImageType } from "@/lib/blob";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = (formData.get("type") as ImageType) || "profile";
    const metadata = formData.get("metadata")
      ? JSON.parse(formData.get("metadata") as string)
      : {};

    if (!file) {
      return NextResponse.json(
        { message: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Upload avec le service optimisé
    const url = await uploadImageServer(file, type, metadata);

    return NextResponse.json({
      url,
      message: "Image uploadée avec succès",
      type,
      size: file.size,
      name: file.name,
    });
  } catch (error) {
    console.error("Erreur lors du téléchargement de l'image:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Une erreur est survenue lors du téléchargement de l'image";

    return NextResponse.json(
      {
        message,
        error: true,
      },
      { status: 500 }
    );
  }
}
