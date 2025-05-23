"use client";

import { useEffect, useState } from "react";
import {
  Edit,
  Calendar,
  Users,
  MapPin,
  Trophy,
  ArrowLeft,
  AlertCircle,
  Share2,
  Download,
  ChevronRight,
  Tag,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CompetitionPromoCard } from "@/components/competition-promo-card";

interface CompetitionParams {
  id: string;
}

interface Competition {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  startDate: string | Date;
  endDate: string | Date;
  country?: string;
  city?: string;
  commune?: string;
  address?: string;
  venue?: string;
  location?: string;
  maxParticipants: number;
  status: "DRAFT" | "OPEN" | "CLOSED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  imageUrl?: string;
  bannerUrl?: string;
  category?: string;
  uniqueCode?: string;
}

const CompetitionDetailsPage = ({ params }: { params: CompetitionParams }) => {
  // Utiliser le typage correct pour params
  const { id } = params;
  const router = useRouter();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);

  useEffect(() => {
    const fetchCompetitionDetails = async () => {
      try {
        console.log(`Récupération des détails de la compétition: ${id}`);
        const response = await fetch(`/api/competitions/${id}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Erreur lors de la récupération de la compétition: ${response.status}`
          );
        }

        const data = await response.json();
        console.log("Données de la compétition récupérées:", data);

        // Vérifier si les données sont dans un objet "competition" ou directement
        const competitionData = data.competition || data;

        setCompetition(competitionData);
      } catch (err: any) {
        console.error("Erreur lors de la récupération des détails:", err);
        setError(
          err.message ||
            "Erreur lors de la récupération des détails de la compétition."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitionDetails();
  }, [id]);

  const handleShare = () => {
    setShowShareOptions(!showShareOptions);
  };

  const handleRegister = () => {
    // Logique d'inscription
    console.log("Inscription à la compétition");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">
              Chargement des détails de la compétition...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erreur</h2>
          <p className="text-gray-700">{error}</p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
          </Button>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Compétition non trouvée
          </h2>
          <p className="text-gray-700">
            Impossible de trouver les détails de cette compétition.
          </p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
          </Button>
        </div>
      </div>
    );
  }

  // Formater les dates
  const formatDate = (dateString: string | Date) => {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Traduire le statut
  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      DRAFT: "Brouillon",
      OPEN: "Ouvert",
      CLOSED: "Fermé",
      ONGOING: "En cours",
      COMPLETED: "Terminé",
      CANCELLED: "Annulé",
    };
    return statusMap[status] || status;
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
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

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button
            variant="outline"
            onClick={() => router.push(`/organizer/competitions/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" /> Modifier
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" /> Partager
          </Button>
        </div>
      </div>

      {/* Carte promotionnelle */}
      <div className="mb-8 mx-auto">
        <CompetitionPromoCard
          competition={competition}
          onShare={handleShare}
          onRegister={handleRegister}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Section Description */}
        <div className="md:col-span-2 space-y-8">
          <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center">
                <Info className="h-5 w-5 mr-2 text-primary" />
                Description
              </h2>
            </div>
            <CardContent className="p-6">
              {competition.description ? (
                <p className="text-gray-700 leading-relaxed">
                  {competition.description}
                </p>
              ) : (
                <p className="text-gray-500 italic">
                  Aucune description disponible pour cette compétition.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Section Règles ou Informations supplémentaires */}
          <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-primary" />
                Détails de la compétition
              </h2>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Informations générales
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Tag className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-sm text-gray-500">
                          Catégorie
                        </span>
                        <span className="font-medium">
                          {competition.category || "Non spécifiée"}
                        </span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Users className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-sm text-gray-500">
                          Participants
                        </span>
                        <span className="font-medium">
                          {competition.maxParticipants} maximum
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Dates importantes
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Calendar className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-sm text-gray-500">
                          Début
                        </span>
                        <span className="font-medium">
                          {formatDate(competition.startDate)}
                        </span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Calendar className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-sm text-gray-500">Fin</span>
                        <span className="font-medium">
                          {formatDate(competition.endDate)}
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Carte de partage */}
          <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <Share2 className="h-5 w-5 mr-2 text-primary" />
                Partager
              </h2>
            </div>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Partagez cette compétition avec vos amis et participants
                potentiels.
              </p>
              <div className="flex flex-col space-y-3">
                <Button className="w-full">
                  <Share2 className="mr-2 h-4 w-4" /> Partager le lien
                </Button>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" /> Télécharger l'affiche
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Carte d'emplacement */}
          <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                Lieu
              </h2>
            </div>
            <CardContent className="p-6">
              <div className="rounded-lg overflow-hidden mb-4 bg-gray-100 h-40 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-medium mb-1">
                {competition.venue || "Lieu de la compétition"}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {competition.location ||
                  [
                    competition.venue,
                    competition.address,
                    competition.commune,
                    competition.city,
                    competition.country,
                  ]
                    .filter(Boolean)
                    .join(", ") ||
                  "Emplacement non spécifié"}
              </p>
              <Button variant="outline" className="w-full">
                <MapPin className="mr-2 h-4 w-4" /> Voir sur la carte
              </Button>
            </CardContent>
          </Card>

          {/* Carte de statut */}
          <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <Info className="h-5 w-5 mr-2 text-primary" />
                Statut
              </h2>
            </div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">État actuel:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    competition.status
                  )}`}
                >
                  {translateStatus(competition.status)}
                </span>
              </div>
              <Separator className="my-4" />
              <Button className="w-full">
                <ChevronRight className="mr-2 h-4 w-4" /> Gérer la compétition
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompetitionDetailsPage;
