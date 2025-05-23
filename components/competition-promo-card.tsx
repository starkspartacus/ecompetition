"use client";

import { Calendar, MapPin, Users, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface CompetitionPromoCardProps {
  competition: {
    id: string;
    title?: string;
    name?: string;
    description?: string;
    startDate?: string | Date;
    endDate?: string | Date;
    country?: string;
    city?: string;
    commune?: string;
    address?: string;
    venue?: string;
    location?: string;
    maxParticipants?: number;
    status?: string;
    imageUrl?: string;
    bannerUrl?: string;
    category?: string;
    uniqueCode?: string;
  };
  className?: string;
  onShare?: () => void;
  onRegister?: () => void;
}

export function CompetitionPromoCard({
  competition,
  className,
  onShare,
  onRegister,
}: CompetitionPromoCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Gestion des valeurs undefined avec des valeurs par défaut élégantes
  const title =
    competition.title ||
    competition.name ||
    "Événement sportif à ne pas manquer";
  const description =
    competition.description ||
    "Rejoignez cette compétition exceptionnelle et montrez vos talents sportifs.";

  // Formatage des dates
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "Date à confirmer";
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Construction de l'emplacement
  const locationParts = [];
  if (competition.venue) locationParts.push(competition.venue);
  if (competition.address) locationParts.push(competition.address);
  if (competition.commune) locationParts.push(competition.commune);
  if (competition.city) locationParts.push(competition.city);
  if (competition.country) locationParts.push(competition.country);

  const locationDisplay =
    competition.location || locationParts.join(", ") || "Lieu à confirmer";

  // Traduction du statut
  const translateStatus = (status?: string) => {
    if (!status) return "À venir";
    const statusMap: Record<string, string> = {
      DRAFT: "Brouillon",
      OPEN: "Inscriptions ouvertes",
      CLOSED: "Inscriptions fermées",
      ONGOING: "En cours",
      COMPLETED: "Terminé",
      CANCELLED: "Annulé",
    };
    return statusMap[status] || status;
  };

  // Couleur du statut
  const getStatusColor = (status?: string) => {
    if (!status) return "bg-blue-100 text-blue-800";
    const colorMap: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800",
      OPEN: "bg-green-100 text-green-800",
      CLOSED: "bg-yellow-100 text-yellow-800",
      ONGOING: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-purple-100 text-purple-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  // Image par défaut si aucune image n'est fournie
  const defaultImage = `/placeholder.svg?height=600&width=1200&query=sports%20competition%20${
    competition.category || "tournament"
  }`;
  const bannerImage =
    competition.bannerUrl || competition.imageUrl || defaultImage;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl shadow-2xl transition-all duration-500",
        isVisible ? "opacity-100 transform-none" : "opacity-0 translate-y-4",
        className
      )}
      style={{ maxWidth: "800px" }}
    >
      {/* Image d'arrière-plan avec superposition dégradée */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
        style={{ backgroundImage: `url(${bannerImage})` }}
      />

      {/* Superposition dégradée pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/40" />

      {/* Effet de bordure brillante */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-primary/20 opacity-70" />

      {/* Contenu de la carte */}
      <div className="relative z-10 p-6 md:p-8 text-white">
        {/* En-tête avec statut et catégorie */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            {competition.category && (
              <Badge className="bg-primary/90 hover:bg-primary text-white font-medium">
                {competition.category}
              </Badge>
            )}
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                competition.status
              )}`}
            >
              {translateStatus(competition.status)}
            </span>
          </div>

          {competition.uniqueCode && (
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <div className="text-xs text-white/80">Code</div>
              <div className="text-sm font-mono font-bold tracking-wider">
                {competition.uniqueCode}
              </div>
            </div>
          )}
        </div>

        {/* Titre et description */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white drop-shadow-md">
            {title}
          </h2>
          <p className="text-white/80 line-clamp-2">{description}</p>
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 mr-2 text-primary/90 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-white/70">Date de début</div>
                <div className="text-sm font-medium">
                  {formatDate(competition.startDate)}
                </div>
              </div>
            </div>

            <div className="flex items-start">
              <Calendar className="h-5 w-5 mr-2 text-primary/90 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-white/70">Date de fin</div>
                <div className="text-sm font-medium">
                  {formatDate(competition.endDate)}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start">
              <MapPin className="h-5 w-5 mr-2 text-primary/90 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-white/70">Lieu</div>
                <div className="text-sm font-medium line-clamp-2">
                  {locationDisplay}
                </div>
              </div>
            </div>

            <div className="flex items-start">
              <Users className="h-5 w-5 mr-2 text-primary/90 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-white/70">Participants</div>
                <div className="text-sm font-medium">
                  {competition.maxParticipants
                    ? `${competition.maxParticipants} maximum`
                    : "Illimité"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-wrap gap-3">
          <Button
            className="bg-primary hover:bg-primary/90 text-white font-medium"
            onClick={onRegister}
          >
            <Trophy className="mr-2 h-4 w-4" />
            S'inscrire
          </Button>

          <Button
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            onClick={onShare}
          >
            Partager
          </Button>
        </div>

        {/* Élément décoratif */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-primary/30 to-transparent opacity-60 rounded-full -mr-16 -mt-16 blur-xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-radial from-primary/20 to-transparent opacity-60 rounded-full -ml-12 -mb-12 blur-xl" />
      </div>
    </div>
  );
}
