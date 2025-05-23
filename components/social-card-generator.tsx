"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface SocialCardGeneratorProps {
  competition: {
    title?: string;
    name?: string;
    category?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    venue?: string;
    city?: string;
    country?: string;
    uniqueCode?: string;
    imageUrl?: string;
    bannerUrl?: string;
  };
  availableCities?: { value: string; label: string }[];
  countries?: { code: string; name: string; flag: string }[];
  categories?: { value: string; label: string }[];
  onCardGenerated?: (dataUrl: string) => void;
  className?: string;
}

export function SocialCardGenerator({
  competition,
  availableCities = [],
  countries = [],
  categories = [],
  onCardGenerated,
  className,
}: SocialCardGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  // Générer la carte sociale
  useEffect(() => {
    if (!canvasRef.current) return;

    const generateCard = async () => {
      setIsGenerating(true);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Définir la taille du canvas (format optimal pour les réseaux sociaux)
      canvas.width = 1200;
      canvas.height = 630;

      try {
        // Charger les polices personnalisées
        await loadFonts();

        // Dessiner l'arrière-plan avec dégradé
        drawBackground(ctx, canvas.width, canvas.height);

        // Charger et dessiner l'image de fond si disponible
        if (competition.bannerUrl || competition.imageUrl) {
          await drawBackgroundImage(
            ctx,
            competition.bannerUrl || competition.imageUrl || "",
            canvas.width,
            canvas.height
          );
        }

        // Ajouter une superposition pour améliorer la lisibilité
        drawOverlay(ctx, canvas.width, canvas.height);

        // Ajouter des éléments décoratifs
        drawDecorativeElements(ctx, canvas.width, canvas.height);

        // Dessiner le contenu principal
        await drawContent(ctx, canvas.width, canvas.height);

        // Convertir le canvas en URL de données
        const dataUrl = canvas.toDataURL("image/png");
        setCardImage(dataUrl);
        if (onCardGenerated) onCardGenerated(dataUrl);
      } catch (error) {
        console.error("Erreur lors de la génération de la carte:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    // Charger les polices personnalisées
    const loadFonts = async () => {
      // Cette fonction est un placeholder pour le chargement de polices
      // Dans un environnement réel, vous pourriez utiliser FontFace API
      return new Promise<void>((resolve) => {
        // Simuler le chargement des polices
        setTimeout(resolve, 100);
      });
    };

    // Dessiner l'arrière-plan avec dégradé
    const drawBackground = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      // Créer un dégradé élégant
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0f172a"); // slate-900
      gradient.addColorStop(0.5, "#1e293b"); // slate-800
      gradient.addColorStop(1, "#0f766e"); // teal-700
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    // Charger et dessiner l'image de fond
    const drawBackgroundImage = (
      ctx: CanvasRenderingContext2D,
      imageUrl: string,
      width: number,
      height: number
    ) => {
      return new Promise<void>((resolve, reject) => {
        const img = new globalThis.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          // Dessiner l'image avec un effet d'opacité
          ctx.globalAlpha = 0.4;

          // Calculer les dimensions pour couvrir tout le canvas
          const imgRatio = img.width / img.height;
          const canvasRatio = width / height;

          let drawWidth = width;
          let drawHeight = height;
          let offsetX = 0;
          let offsetY = 0;

          // Ajuster les dimensions pour couvrir tout le canvas
          if (imgRatio > canvasRatio) {
            // L'image est plus large que le canvas
            drawHeight = width / imgRatio;
            offsetY = (height - drawHeight) / 2;
          } else {
            // L'image est plus haute que le canvas
            drawWidth = height * imgRatio;
            offsetX = (width - drawWidth) / 2;
          }

          // Appliquer un flou à l'image de fond
          ctx.filter = "blur(8px)";
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

          // Réinitialiser les paramètres
          ctx.filter = "none";
          ctx.globalAlpha = 1.0;
          resolve();
        };
        img.onerror = () => {
          console.error("Erreur lors du chargement de l'image:", imageUrl);
          resolve(); // Continuer même en cas d'erreur
        };
        img.src = imageUrl;
      });
    };

    // Ajouter une superposition pour améliorer la lisibilité
    const drawOverlay = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      // Superposition dégradée
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.7)");
      gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.5)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.8)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Ajouter une bordure subtile
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, width - 20, height - 20);
    };

    // Ajouter des éléments décoratifs
    const drawDecorativeElements = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      // Cercle décoratif en haut à droite
      const gradient1 = ctx.createRadialGradient(
        width - 100,
        100,
        10,
        width - 100,
        100,
        200
      );
      gradient1.addColorStop(0, "rgba(56, 189, 248, 0.8)"); // sky-400
      gradient1.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = gradient1;
      ctx.beginPath();
      ctx.arc(width - 100, 100, 200, 0, Math.PI * 2);
      ctx.fill();

      // Cercle décoratif en bas à gauche
      const gradient2 = ctx.createRadialGradient(
        100,
        height - 100,
        10,
        100,
        height - 100,
        150
      );
      gradient2.addColorStop(0, "rgba(20, 184, 166, 0.8)"); // teal-500
      gradient2.addColorStop(1, "rgba(20, 184, 166, 0)");
      ctx.fillStyle = gradient2;
      ctx.beginPath();
      ctx.arc(100, height - 100, 150, 0, Math.PI * 2);
      ctx.fill();

      // Lignes décoratives
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 2;

      // Ligne horizontale
      ctx.beginPath();
      ctx.moveTo(50, height / 2);
      ctx.lineTo(width - 50, height / 2);
      ctx.stroke();

      // Ligne verticale
      ctx.beginPath();
      ctx.moveTo(width / 2, 50);
      ctx.lineTo(width / 2, height - 50);
      ctx.stroke();
    };

    // Dessiner le contenu principal
    const drawContent = async (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      // Récupérer les informations de la compétition avec des valeurs par défaut
      const title =
        competition.title || competition.name || "Événement sportif";

      const categoryObj = categories.find(
        (c) => c.value === competition.category
      );
      const categoryLabel =
        categoryObj?.label || competition.category || "Compétition sportive";

      const startDate = competition.startDate
        ? format(new Date(competition.startDate), "dd MMMM yyyy", {
            locale: fr,
          })
        : "Date à confirmer";

      const endDate = competition.endDate
        ? format(new Date(competition.endDate), "dd MMMM yyyy", { locale: fr })
        : "Date à confirmer";

      const cityObj = availableCities.find((c) => c.value === competition.city);
      const cityName = cityObj?.label || competition.city || "";

      const countryObj = countries.find((c) => c.code === competition.country);
      const countryName = countryObj?.name || competition.country || "";

      const venue = competition.venue || "";
      const location = [venue, cityName, countryName]
        .filter(Boolean)
        .join(", ");

      // Dessiner le logo de la compétition si disponible
      if (competition.imageUrl) {
        await drawLogo(ctx, competition.imageUrl, width / 2, 150, 120);
      }

      // Dessiner le titre
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 60px Arial";

      // Ajuster la taille du texte si nécessaire
      let fontSize = 60;
      while (ctx.measureText(title).width > width - 100 && fontSize > 30) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px Arial`;
      }

      // Ajouter une ombre au texte
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Dessiner le titre
      const titleY = competition.imageUrl ? 280 : 200;
      ctx.fillText(title, width / 2, titleY);

      // Réinitialiser l'ombre
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Dessiner la catégorie
      ctx.font = "bold 36px Arial";
      ctx.fillStyle = "#14b8a6"; // teal-500
      ctx.fillText(categoryLabel, width / 2, titleY + 60);

      // Dessiner les dates
      ctx.font = "28px Arial";
      ctx.fillStyle = "#f0f0f0";
      ctx.fillText(`Du ${startDate} au ${endDate}`, width / 2, titleY + 120);

      // Dessiner le lieu
      if (location) {
        ctx.font = "24px Arial";
        ctx.fillStyle = "#d1d5db"; // gray-300
        ctx.fillText(location, width / 2, titleY + 170);
      }

      // Dessiner le code unique
      if (competition.uniqueCode) {
        // Dessiner un fond pour le code
        const codeText = `Code: ${competition.uniqueCode}`;
        const codeWidth = ctx.measureText(codeText).width + 40;
        const codeHeight = 50;
        const codeX = width / 2 - codeWidth / 2;
        const codeY = height - 100;

        // Fond avec dégradé
        const codeGradient = ctx.createLinearGradient(
          codeX,
          codeY,
          codeX + codeWidth,
          codeY
        );
        codeGradient.addColorStop(0, "rgba(20, 184, 166, 0.3)"); // teal-500 avec opacité
        codeGradient.addColorStop(1, "rgba(56, 189, 248, 0.3)"); // sky-400 avec opacité

        ctx.fillStyle = codeGradient;
        ctx.beginPath();
        // Utiliser une méthode compatible avec tous les navigateurs au lieu de roundRect
        roundRect(ctx, codeX, codeY, codeWidth, codeHeight, 10);
        ctx.fill();

        // Bordure
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Texte du code
        ctx.font = "bold 28px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(codeText, width / 2, codeY + 35);
      }

      // Ajouter un badge "Rejoignez-nous"
      drawBadge(ctx, width - 150, 80, "Rejoignez-nous !");

      // Ajouter une mention de copyright
      ctx.font = "14px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillText("© eCompetition 2025", width / 2, height - 20);
    };

    // Fonction utilitaire pour dessiner un rectangle arrondi
    const roundRect = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
      );
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    // Dessiner le logo
    const drawLogo = (
      ctx: CanvasRenderingContext2D,
      imageUrl: string,
      x: number,
      y: number,
      size: number
    ) => {
      return new Promise<void>((resolve, reject) => {
        const img = new globalThis.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          // Dessiner un cercle de fond
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, size / 2 + 5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
          ctx.fill();

          // Créer un masque circulaire pour l'image
          ctx.beginPath();
          ctx.arc(x, y, size / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();

          // Dessiner l'image
          const aspectRatio = img.width / img.height;
          let drawWidth = size;
          let drawHeight = size;

          if (aspectRatio > 1) {
            // Image plus large que haute
            drawWidth = size;
            drawHeight = size / aspectRatio;
          } else {
            // Image plus haute que large
            drawHeight = size;
            drawWidth = size * aspectRatio;
          }

          const offsetX = x - drawWidth / 2;
          const offsetY = y - drawHeight / 2;

          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          ctx.restore();

          // Ajouter un cercle de bordure
          ctx.beginPath();
          ctx.arc(x, y, size / 2 + 2, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
          ctx.lineWidth = 3;
          ctx.stroke();

          resolve();
        };
        img.onerror = () => {
          console.error("Erreur lors du chargement du logo:", imageUrl);
          resolve(); // Continuer même en cas d'erreur
        };
        img.src = imageUrl;
      });
    };

    // Dessiner un badge
    const drawBadge = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      text: string
    ) => {
      // Rotation du badge
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 12); // Légère rotation

      // Mesurer le texte
      ctx.font = "bold 18px Arial";
      const textWidth = ctx.measureText(text).width;
      const badgeWidth = textWidth + 30;
      const badgeHeight = 36;

      // Dessiner le fond du badge
      const badgeGradient = ctx.createLinearGradient(
        -badgeWidth / 2,
        0,
        badgeWidth / 2,
        0
      );
      badgeGradient.addColorStop(0, "#0d9488"); // teal-600
      badgeGradient.addColorStop(1, "#0891b2"); // cyan-600

      ctx.fillStyle = badgeGradient;
      ctx.beginPath();
      // Utiliser une méthode compatible avec tous les navigateurs au lieu de roundRect
      roundRect(
        ctx,
        -badgeWidth / 2,
        -badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        18
      );
      ctx.fill();

      // Ajouter une bordure
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Dessiner le texte
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 0, 0);

      ctx.restore();
    };

    // Générer la carte
    generateCard();
  }, [competition, availableCities, countries, categories, onCardGenerated]);

  return (
    <div
      className={`relative aspect-[1200/630] w-full overflow-hidden rounded-lg shadow-xl ${className}`}
    >
      {cardImage ? (
        <Image
          src={cardImage || "/placeholder.svg"}
          alt="Carte sociale pour les réseaux sociaux"
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
