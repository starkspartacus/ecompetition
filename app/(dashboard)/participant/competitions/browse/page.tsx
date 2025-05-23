"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Trophy,
  Search,
  Calendar,
  Users,
  MapPin,
  Loader2,
  AlertCircle,
  Globe,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import Image from "next/image";

interface Competition {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  country: string;
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
  uniqueCode: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BrowseCompetitionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState<
    Competition[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompetition, setSelectedCompetition] =
    useState<Competition | null>(null);
  const [participationCode, setParticipationCode] = useState("");
  const [participationMessage, setParticipationMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchCompetitions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Construire l'URL avec les filtres
      let url = "/api/competitions/public";
      const params = new URLSearchParams();

      if (countryFilter) params.append("country", countryFilter);
      if (categoryFilter) params.append("category", categoryFilter);
      if (searchQuery) params.append("search", searchQuery);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erreur lors de la récupération des compétitions"
        );
      }

      console.log(
        "✅ Compétitions publiques récupérées:",
        data.competitions?.length || 0
      );
      const competitionsData = data.competitions || [];
      setCompetitions(competitionsData);
      setFilteredCompetitions(competitionsData);
    } catch (error) {
      console.error("❌ Erreur:", error);
      setError(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, countryFilter, categoryFilter]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCompetitions();
    } else if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router, fetchCompetitions]);

  const handleParticipate = (competition: Competition) => {
    setSelectedCompetition(competition);
    setParticipationCode(competition.uniqueCode || "");
    setParticipationMessage("");
    setDialogOpen(true);
  };

  const handleSubmitParticipation = async () => {
    if (!selectedCompetition) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/competitions/participate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          competitionId: selectedCompetition.id,
          uniqueCode: participationCode,
          message: participationMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Erreur lors de la demande de participation"
        );
      }

      toast({
        title: "Demande envoyée !",
        description:
          "Votre demande de participation a été envoyée à l'organisateur",
        variant: "default",
      });

      setDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors de la demande de participation:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadge = (category?: string) => {
    if (!category) return null;

    switch (category.toUpperCase()) {
      case "FOOTBALL":
        return <Badge className="bg-green-600">Football</Badge>;
      case "BASKETBALL":
        return <Badge className="bg-orange-600">Basketball</Badge>;
      case "VOLLEYBALL":
        return <Badge className="bg-blue-600">Volleyball</Badge>;
      case "HANDBALL":
        return <Badge className="bg-red-600">Handball</Badge>;
      case "TENNIS":
        return <Badge className="bg-yellow-600">Tennis</Badge>;
      case "ATHLETICS":
        return <Badge className="bg-purple-600">Athlétisme</Badge>;
      case "SWIMMING":
        return <Badge className="bg-cyan-600">Natation</Badge>;
      case "MARACANA":
        return <Badge className="bg-emerald-600">Maracana</Badge>;
      default:
        return <Badge>{category}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Non définie";
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
    } catch (error) {
      return "Date invalide";
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCountryFilter("");
    setCategoryFilter("");
  };

  if (status === "loading") {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Découvrir les compétitions</h1>
          <p className="text-gray-500 mt-1">
            Parcourez les compétitions disponibles et inscrivez-vous
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher une compétition..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les pays</SelectItem>
                <SelectItem value="CI">Côte d'Ivoire</SelectItem>
                <SelectItem value="SN">Sénégal</SelectItem>
                <SelectItem value="CM">Cameroun</SelectItem>
                <SelectItem value="BJ">Bénin</SelectItem>
                <SelectItem value="BF">Burkina Faso</SelectItem>
                <SelectItem value="ML">Mali</SelectItem>
                <SelectItem value="GH">Ghana</SelectItem>
                <SelectItem value="TG">Togo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="FOOTBALL">Football</SelectItem>
                <SelectItem value="BASKETBALL">Basketball</SelectItem>
                <SelectItem value="VOLLEYBALL">Volleyball</SelectItem>
                <SelectItem value="HANDBALL">Handball</SelectItem>
                <SelectItem value="TENNIS">Tennis</SelectItem>
                <SelectItem value="ATHLETICS">Athlétisme</SelectItem>
                <SelectItem value="SWIMMING">Natation</SelectItem>
                <SelectItem value="MARACANA">Maracana</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(searchQuery || countryFilter || categoryFilter) && (
          <div className="flex items-center mt-4">
            <div className="text-sm text-gray-500 mr-2">Filtres actifs:</div>
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Recherche: {searchQuery}
                  <button onClick={() => setSearchQuery("")} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {countryFilter && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Pays: {countryFilter}
                  <button onClick={() => setCountryFilter("")} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {categoryFilter && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  Catégorie: {categoryFilter}
                  <button
                    onClick={() => setCategoryFilter("")}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(searchQuery || countryFilter || categoryFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-6 px-2"
                >
                  Effacer tous les filtres
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-40 bg-gray-200">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={fetchCompetitions}
            >
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      ) : filteredCompetitions.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">
            Aucune compétition trouvée
          </h3>
          <p className="mt-2 text-gray-500">
            {searchQuery || countryFilter || categoryFilter
              ? "Aucune compétition ne correspond à vos critères de recherche."
              : "Aucune compétition n'est disponible pour le moment."}
          </p>
          {(searchQuery || countryFilter || categoryFilter) && (
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Effacer les filtres
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompetitions.map((competition) => (
            <Card
              key={competition.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-40 relative">
                {competition.imageUrl ? (
                  <Image
                    src={competition.imageUrl || "/placeholder.svg"}
                    alt={competition.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Trophy className="h-16 w-16 text-white" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  {getCategoryBadge(competition.category)}
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle>{competition.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  {competition.country || "International"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                    <div>
                      <p className="font-medium">Inscriptions:</p>
                      <p>
                        Du {formatDate(competition.registrationStartDate)} au{" "}
                        {formatDate(competition.registrationEndDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{competition.location || "Lieu non défini"}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {competition.currentParticipants || 0}/
                      {competition.maxParticipants || "∞"} participants
                    </span>
                  </div>
                  <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-100">
                    <p className="text-xs font-medium text-gray-500">
                      Code d'invitation:
                    </p>
                    <p className="font-mono font-bold">
                      {competition.uniqueCode}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
                  onClick={() => handleParticipate(competition)}
                >
                  Participer
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Participer à la compétition</DialogTitle>
            <DialogDescription>
              Confirmez votre participation à {selectedCompetition?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Code d'invitation</label>
              <Input
                value={participationCode}
                onChange={(e) => setParticipationCode(e.target.value)}
                placeholder="Entrez le code d'invitation"
              />
              <p className="text-xs text-gray-500">
                Le code est déjà pré-rempli, mais vous pouvez le modifier si
                nécessaire
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message (optionnel)</label>
              <Textarea
                value={participationMessage}
                onChange={(e) => setParticipationMessage(e.target.value)}
                placeholder="Ajoutez un message pour l'organisateur..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmitParticipation}
              disabled={isSubmitting || !participationCode}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...
                </>
              ) : (
                "Confirmer la participation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
