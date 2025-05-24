import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

/**
 * Télécharge une image vers Vercel Blob Storage ou utilise une image de placeholder si Blob n'est pas configuré
 * @param file Fichier à télécharger
 * @returns URL de l'image téléchargée ou URL de placeholder
 */
export async function uploadImage(file: File): Promise<string> {
  try {
    // Générer un nom de fichier unique
    const filename = `${nanoid()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;

    // Vérifier si BLOB_READ_WRITE_TOKEN est configuré
    if (!process.env.BLOB_READ_WRITE_TOKEN && typeof window !== "undefined") {
      console.warn(
        "⚠️ BLOB_READ_WRITE_TOKEN n'est pas configuré, utilisation d'une image de placeholder"
      );

      // Retourner une URL de placeholder si Blob n'est pas configuré
      return getPlaceholderImage(300, 300, "Photo de profil");
    }

    // Télécharger le fichier vers Vercel Blob
    const { url } = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
    });

    console.log(`✅ Image téléchargée avec succès: ${url}`);
    return url;
  } catch (error) {
    console.error("❌ Erreur lors du téléchargement de l'image:", error);

    // En cas d'erreur, utiliser une image de placeholder
    return getPlaceholderImage(300, 300, "Photo de profil");
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
