import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

/**
 * Télécharge une image vers Vercel Blob Storage
 * @param file Fichier à télécharger
 * @returns URL de l'image téléchargée
 */
export async function uploadImage(file: File): Promise<string> {
  try {
    // Générer un nom de fichier unique
    const filename = `${nanoid()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;

    // Télécharger le fichier vers Vercel Blob
    const { url } = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
    });

    console.log(`✅ Image téléchargée avec succès: ${url}`);
    return url;
  } catch (error) {
    console.error("❌ Erreur lors du téléchargement de l'image:", error);
    throw new Error("Erreur lors du téléchargement de l'image");
  }
}

/**
 * Génère une URL pour une image de prévisualisation
 * @param width Largeur de l'image
 * @param height Hauteur de l'image
 * @param text Texte à afficher sur l'image
 * @returns URL de l'image de prévisualisation
 */
export function getPlaceholderImage(
  width: number,
  height: number,
  text: string
): string {
  return `https://placehold.co/${width}x${height}/1e40af/ffffff?text=${encodeURIComponent(
    text
  )}`;
}
