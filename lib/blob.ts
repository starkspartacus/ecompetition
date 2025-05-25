import { put, del, list } from "@vercel/blob";
import { nanoid } from "nanoid";

// Configuration pour les différents types d'images
export const IMAGE_CONFIGS = {
  profile: {
    maxSize: 2 * 1024 * 1024, // 2MB
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.8,
    folder: "profiles",
  },
  banner: {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxWidth: 1200,
    maxHeight: 630,
    quality: 0.85,
    folder: "banners",
  },
  logo: {
    maxSize: 1 * 1024 * 1024, // 1MB
    maxWidth: 300,
    maxHeight: 300,
    quality: 0.9,
    folder: "logos",
  },
  competition: {
    maxSize: 3 * 1024 * 1024, // 3MB
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.85,
    folder: "competitions",
  },
};

export type ImageType = keyof typeof IMAGE_CONFIGS;

/**
 * Upload une image vers Vercel Blob côté serveur (sans optimisation)
 */
export async function uploadImageServer(
  file: File,
  type: ImageType = "competition",
  metadata?: Record<string, string>
): Promise<string> {
  try {
    console.log(
      `📤 Upload ${type} image (server):`,
      file.name,
      `${(file.size / 1024 / 1024).toFixed(2)}MB`
    );

    const config = IMAGE_CONFIGS[type];

    // Validation du fichier
    const validation = validateImageFile(file, config);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Générer un nom de fichier unique
    const fileExtension = getFileExtension(file.name);
    const filename = `${config.folder}/${nanoid()}.${fileExtension}`;

    // Upload direct sans optimisation côté serveur
    const { url } = await uploadWithRetry(file, filename);

    console.log(`✅ Image ${type} uploadée (server):`, url);
    return url;
  } catch (error) {
    console.error(`❌ Erreur upload ${type} (server):`, error);

    // Fallback vers placeholder si l'upload échoue
    if (
      error instanceof Error &&
      error.message.includes("BLOB_READ_WRITE_TOKEN")
    ) {
      console.warn("⚠️ Token Blob manquant, utilisation placeholder");
      const config = IMAGE_CONFIGS[type];
      return getPlaceholderImage(
        config.maxWidth,
        config.maxHeight,
        `${type} image`
      );
    }

    throw error;
  }
}

/**
 * Upload avec retry automatique
 */
async function uploadWithRetry(
  file: File,
  filename: string,
  maxRetries = 3
): Promise<{ url: string }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 Tentative ${attempt}/${maxRetries} pour ${filename}`);

      const result = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
      });

      return result;
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Échec tentative ${attempt}:`, error);

      if (attempt < maxRetries) {
        // Attendre avant de réessayer (backoff exponentiel)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError || new Error("Upload failed after retries");
}

/**
 * Validation avancée des fichiers image
 */
export function validateImageFile(
  file: File,
  config?: (typeof IMAGE_CONFIGS)[ImageType]
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "Aucun fichier sélectionné" };
  }

  // Vérifier le type MIME
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Format non supporté. Utilisez JPG, PNG, GIF, WebP ou SVG",
    };
  }

  // Vérifier la taille si config fournie
  if (config && file.size > config.maxSize) {
    const maxSizeMB = (config.maxSize / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `Fichier trop volumineux. Taille max: ${maxSizeMB}MB`,
    };
  }

  // Vérifier l'extension
  const extension = getFileExtension(file.name);
  const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

  if (!allowedExtensions.includes(extension.toLowerCase())) {
    return {
      valid: false,
      error: "Extension de fichier non supportée",
    };
  }

  return { valid: true };
}

/**
 * Supprime une image du Blob Storage
 */
export async function deleteImage(url: string): Promise<boolean> {
  try {
    console.log("🗑️ Suppression image:", url);

    await del(url);

    console.log("✅ Image supprimée avec succès");
    return true;
  } catch (error) {
    console.error("❌ Erreur suppression image:", error);
    return false;
  }
}

/**
 * Liste les images d'un dossier
 */
export async function listImages(folder?: string): Promise<string[]> {
  try {
    const { blobs } = await list({
      prefix: folder ? `${folder}/` : undefined,
    });

    return blobs.map((blob) => blob.url);
  } catch (error) {
    console.error("❌ Erreur listage images:", error);
    return [];
  }
}

/**
 * Génère une URL de placeholder
 */
export function getPlaceholderImage(
  width: number,
  height: number,
  text: string,
  bgColor = "e11d48",
  textColor = "ffffff"
): string {
  const encodedText = encodeURIComponent(text);
  return `https://placehold.co/${width}x${height}/${bgColor}/${textColor}?text=${encodedText}`;
}

/**
 * Extrait l'extension d'un nom de fichier
 */
function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "jpg";
}

/**
 * Génère une URL de prévisualisation pour un fichier
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Libère une URL de prévisualisation
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Convertit une image en base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Vérifie si une URL est une image Blob Vercel
 */
export function isBlobUrl(url: string): boolean {
  return (
    url.includes("blob.vercel-storage.com") ||
    url.includes("vercel-storage.com")
  );
}

/**
 * Nettoie les anciennes images non utilisées
 */
export async function cleanupUnusedImages(usedUrls: string[]): Promise<number> {
  try {
    console.log("🧹 Nettoyage des images non utilisées...");

    const { blobs } = await list();
    let deletedCount = 0;

    for (const blob of blobs) {
      if (!usedUrls.includes(blob.url)) {
        await del(blob.url);
        deletedCount++;
      }
    }

    console.log(`✅ ${deletedCount} images supprimées`);
    return deletedCount;
  } catch (error) {
    console.error("❌ Erreur nettoyage:", error);
    return 0;
  }
}
