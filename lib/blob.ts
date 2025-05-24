import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

/**
 * Télécharge une image vers Vercel Blob Storage
 * @param file Fichier à télécharger
 * @returns URL de l'image téléchargée
 */
export async function uploadImage(file: File): Promise<string> {
  try {
    console.log("📤 Début du téléchargement de l'image:", file.name, file.size);

    // Vérifier si le fichier est valide
    if (!file || !file.type.startsWith("image/")) {
      console.error("❌ Type de fichier invalide:", file?.type);
      throw new Error("Le fichier doit être une image (JPG, PNG, GIF, WebP)");
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error("❌ Fichier trop volumineux:", file.size);
      throw new Error("La taille de l'image ne doit pas dépasser 5MB");
    }

    // Générer un nom de fichier unique
    const fileExtension = file.name.split(".").pop() || "jpg";
    const filename = `profile-${nanoid()}.${fileExtension}`;

    console.log("📤 Téléchargement vers Blob Storage:", filename);

    // Télécharger le fichier vers Vercel Blob
    const { url } = await put(filename, file, {
      access: "public",
      addRandomSuffix: false, // On a déjà un nom unique
    });

    console.log("✅ Image téléchargée avec succès:", url);
    return url;
  } catch (error) {
    console.error("❌ Erreur lors du téléchargement de l'image:", error);

    // Si c'est une erreur de configuration Blob, utiliser un placeholder
    if (
      error instanceof Error &&
      error.message.includes("BLOB_READ_WRITE_TOKEN")
    ) {
      console.warn(
        "⚠️ BLOB_READ_WRITE_TOKEN non configuré, utilisation d'un placeholder"
      );
      return getPlaceholderImage(300, 300, "Photo de profil");
    }

    // Relancer l'erreur pour que l'appelant puisse la gérer
    throw error;
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
  const encodedText = encodeURIComponent(text);
  return `https://placehold.co/${width}x${height}/e11d48/ffffff?text=${encodedText}`;
}

/**
 * Valide qu'un fichier est une image valide
 * @param file Fichier à valider
 * @returns true si le fichier est valide
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!file) {
    return { valid: false, error: "Aucun fichier sélectionné" };
  }

  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "Le fichier doit être une image" };
  }

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Format d'image non supporté. Utilisez JPG, PNG, GIF ou WebP",
    };
  }

  if (file.size > 5 * 1024 * 1024) {
    return {
      valid: false,
      error: "La taille de l'image ne doit pas dépasser 5MB",
    };
  }

  return { valid: true };
}

/**
 * Redimensionne une image avant l'upload
 * @param file Fichier image à redimensionner
 * @param maxWidth Largeur maximale
 * @param maxHeight Hauteur maximale
 * @param quality Qualité de compression (0-1)
 * @returns Promise<File> Fichier redimensionné
 */
export function resizeImage(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculer les nouvelles dimensions
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Redimensionner l'image
      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error("Erreur lors du redimensionnement"));
            }
          },
          file.type,
          quality
        );
      } else {
        reject(new Error("Impossible de créer le contexte canvas"));
      }
    };

    img.onerror = () =>
      reject(new Error("Erreur lors du chargement de l'image"));
    img.src = URL.createObjectURL(file);
  });
}
