"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format, differenceInDays } from "date-fns";
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
  Info,
  Clock,
  CheckCircle,
  PlayCircle,
  LockIcon as LockClosed,
  Eye,
  PenLine,
  Filter,
  Award,
  UserCheck,
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
  startDate: string | null;
  endDate: string | null;
  registrationStartDate: string | null;
  registrationEndDate: string | null;
  registrationDeadline?: string | null;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
  uniqueCode: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function BrowseCompetitionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompetition, setSelectedCompetition] =
    useState<Competition | null>(null);
  const [participationCode, setParticipationCode] = useState("");
  const [participationMessage, setParticipationMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const fetchCompetitions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Construire l'URL avec les filtres
      let url = "/api/competitions/public";
      const params = new URLSearchParams();

      if (countryFilter && countryFilter !== "")
        params.append("country", countryFilter);
      if (categoryFilter && categoryFilter !== "")
        params.append("category", categoryFilter);
      if (statusFilter && statusFilter !== "")
        params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log("Fetching competitions from:", url);
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API response error:", response.status, errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(
        "✅ Compétitions publiques récupérées:",
        data.competitions?.length || 0
      );

      if (debugMode) {
        console.log("Réponse API complète:", data);
        // Afficher les statuts des compétitions
        const statuses =
          data.competitions?.map((c: Competition) => c.status) || [];
        console.log("Statuts des compétitions:", [...new Set(statuses)]);
      }

      const competitionsData = data.competitions || [];
      setCompetitions(competitionsData);
    } catch (error) {
      console.error("❌ Erreur:", error);
      setError(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, countryFilter, categoryFilter, statusFilter, debugMode]);

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

  const handleViewDetails = (competition: Competition) => {
    router.push(`/participant/competitions/details/${competition.id}`);
  };

  const handleViewResults = (competition: Competition) => {
    router.push(`/participant/competitions/results/${competition.id}`);
  };

  const handleViewTeams = (competition: Competition) => {
    router.push(`/participant/competitions/teams/${competition.id}`);
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

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Erreur lors du parsing de la réponse:", parseError);
        data = {
          success: false,
          message: "Erreur de communication avec le serveur",
        };
      }

      if (!response.ok || !data.success) {
        // Gestion spécifique des erreurs connues
        const errorMessage =
          data?.message || "Erreur lors de la demande de participation";

        if (errorMessage.includes("inscriptions ne sont pas ouvertes")) {
          toast({
            title: "Inscriptions fermées",
            description:
              "Les inscriptions ne sont pas ouvertes pour cette compétition actuellement.",
            variant: "destructive",
          });
        } else if (
          errorMessage.includes("période d'inscription est terminée")
        ) {
          toast({
            title: "Date limite dépassée",
            description:
              "La date limite d'inscription à cette compétition est dépassée.",
            variant: "destructive",
          });
        } else if (
          errorMessage.includes("inscriptions ne sont pas encore ouvertes")
        ) {
          toast({
            title: "Inscriptions à venir",
            description:
              "Les inscriptions pour cette compétition ne sont pas encore ouvertes.",
            variant: "destructive",
          });
        } else if (errorMessage.includes("nombre maximum de participants")) {
          toast({
            title: "Compétition complète",
            description:
              "Le nombre maximum de participants pour cette compétition est atteint.",
            variant: "destructive",
          });
        } else if (errorMessage.includes("déjà inscrit")) {
          toast({
            title: "Déjà inscrit",
            description: "Vous êtes déjà inscrit à cette compétition.",
            variant: "warning",
          });
        } else if (errorMessage.includes("ID utilisateur manquant")) {
          toast({
            title: "Erreur de session",
            description:
              "Votre session a expiré. Veuillez vous déconnecter et vous reconnecter.",
            variant: "destructive",
          });
        } else if (errorMessage.includes("Non autorisé")) {
          toast({
            title: "Non autorisé",
            description:
              "Veuillez vous connecter pour participer à une compétition.",
            variant: "destructive",
          });
          router.push("/signin");
        } else {
          toast({
            title: "Erreur",
            description: errorMessage,
            variant: "destructive",
          });
        }
        setDialogOpen(false);
        return;
      }

      // Succès
      toast({
        title: "Demande envoyée !",
        description: `Votre demande de participation à "${data.competitionTitle}" a été envoyée à l'organisateur.`,
        variant: "default",
      });

      setDialogOpen(false);
      // Rafraîchir les compétitions pour mettre à jour le nombre de participants
      fetchCompetitions();
    } catch (error) {
      console.error("Erreur lors de la demande de participation:", error);
      toast({
        title: "Erreur",
        description:
          "Une erreur réseau est survenue. Veuillez vérifier votre connexion et réessayer.",
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
        return <Badge className="bg-green-600 text-white">Football</Badge>;
      case "BASKETBALL":
        return <Badge className="bg-orange-600 text-white">Basketball</Badge>;
      case "VOLLEYBALL":
        return <Badge className="bg-blue-600 text-white">Volleyball</Badge>;
      case "HANDBALL":
        return <Badge className="bg-red-600 text-white">Handball</Badge>;
      case "TENNIS":
        return <Badge className="bg-yellow-600 text-white">Tennis</Badge>;
      case "ATHLETICS":
        return <Badge className="bg-purple-600 text-white">Athlétisme</Badge>;
      case "SWIMMING":
        return <Badge className="bg-cyan-600 text-white">Natation</Badge>;
      case "MARACANA":
        return <Badge className="bg-emerald-600 text-white">Maracana</Badge>;
      default:
        return <Badge>{category}</Badge>;
    }
  };

  const getStatusBadge = (competition: Competition) => {
    const deadlineDate =
      competition.registrationDeadline || competition.registrationEndDate;
    const isDeadlineSoon = deadlineDate
      ? differenceInDays(new Date(deadlineDate), new Date()) <= 3
      : false;
    const isDeadlinePassed = isDatePassed(deadlineDate);

    // Log pour débogage
    if (debugMode) {
      console.log(
        `Competition ${competition.name} - Status: ${competition.status}`
      );
    }

    switch (competition.status?.toUpperCase()) {
      case "OPEN":
        if (isDeadlineSoon && !isDeadlinePassed) {
          return (
            <Badge className="bg-amber-500 text-white flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Clôture bientôt
            </Badge>
          );
        }
        return (
          <Badge className="bg-green-600 text-white flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Inscriptions ouvertes
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="bg-blue-600 text-white flex items-center gap-1">
            <PlayCircle className="h-3 w-3" />
            En cours
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge className="bg-gray-600 text-white flex items-center gap-1">
            <LockClosed className="h-3 w-3" />
            Inscriptions fermées
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-purple-600 text-white flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            Terminée
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge className="bg-gray-500 text-white flex items-center gap-1">
            <PenLine className="h-3 w-3" />
            Prochainement
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 text-white">
            {competition.status || "Inconnu"}
          </Badge>
        );
    }
  };

  const getActionButton = (competition: Competition) => {
    const deadlineDate =
      competition.registrationDeadline || competition.registrationEndDate;
    const isDeadlinePassed = isDatePassed(deadlineDate);
    const isFull =
      competition.maxParticipants > 0 &&
      competition.currentParticipants >= competition.maxParticipants;

    switch (competition.status?.toUpperCase()) {
      case "OPEN":
        if (isDeadlinePassed) {
          return (
            <Button
              className="w-full bg-gray-500 hover:bg-gray-600"
              disabled={true}
            >
              Inscriptions terminées
            </Button>
          );
        } else if (isFull) {
          return (
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700"
              onClick={() => handleViewDetails(competition)}
            >
              <Users className="mr-2 h-4 w-4" /> Complet
            </Button>
          );
        } else {
          return (
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={() => handleParticipate(competition)}
            >
              <UserCheck className="mr-2 h-4 w-4" /> Participer
            </Button>
          );
        }
      case "IN_PROGRESS":
        return (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => handleViewDetails(competition)}
          >
            <Eye className="mr-2 h-4 w-4" /> Voir les détails
          </Button>
        );
      case "CLOSED":
        return (
          <Button
            className="w-full bg-gray-600 hover:bg-gray-700"
            onClick={() => handleViewResults(competition)}
          >
            <Award className="mr-2 h-4 w-4" /> Voir les résultats
          </Button>
        );
      case "COMPLETED":
        return (
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={() => handleViewTeams(competition)}
          >
            <Users className="mr-2 h-4 w-4" /> Voir les équipes
          </Button>
        );
      case "DRAFT":
        return (
          <Button
            className="w-full bg-gray-400 hover:bg-gray-500"
            disabled={true}
          >
            <PenLine className="mr-2 h-4 w-4" /> Bientôt disponible
          </Button>
        );
      default:
        return (
          <Button className="w-full bg-gray-500" disabled={true}>
            Non disponible
          </Button>
        );
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Non définie";
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
    } catch (error) {
      return "Date invalide";
    }
  };

  // Vérifier si la date est dépassée
  const isDatePassed = (dateString?: string | null) => {
    if (!dateString) return false;
    try {
      const date = new Date(dateString);
      return date < new Date();
    } catch (error) {
      return false;
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCountryFilter("");
    setCategoryFilter("");
    setStatusFilter("");
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    if (!debugMode) {
      fetchCompetitions();
    }
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
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCompetitions}
            className="mr-2"
          >
            <Loader2
              className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleDebugMode}>
            <Info className="h-4 w-4 mr-1" />
            {debugMode ? "Désactiver débogage" : "Activer débogage"}
          </Button>
        </div>
      </div>

      {debugMode && (
        <Alert className="mb-4 bg-yellow-50">
          <Info className="h-4 w-4" />
          <AlertTitle>Mode débogage activé</AlertTitle>
          <AlertDescription>
            <p>Session: {session?.user?.email || "Non connecté"}</p>
            <p>Nombre de compétitions: {competitions.length}</p>
            <p>
              Filtres:{" "}
              {JSON.stringify({
                search: searchQuery,
                country: countryFilter,
                category: categoryFilter,
                status: statusFilter,
              })}
            </p>
            {competitions.length > 0 && (
              <p>
                Statuts présents:{" "}
                {[...new Set(competitions.map((c) => c.status))].join(", ")}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                <SelectValue placeholder="Tous les pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les pays</SelectItem>
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
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les catégories</SelectItem>
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

          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="OPEN">Inscriptions ouvertes</SelectItem>
                <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                <SelectItem value="CLOSED">Inscriptions fermées</SelectItem>
                <SelectItem value="COMPLETED">Terminées</SelectItem>
                <SelectItem value="COMING_SOON">Prochainement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(searchQuery || countryFilter || categoryFilter || statusFilter) && (
          <div className="flex items-center mt-4">
            <div className="text-sm text-gray-500 mr-2">Filtres actifs:</div>
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Recherche: {searchQuery}
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-1"
                    aria-label="Supprimer le filtre de recherche"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {countryFilter && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Pays: {countryFilter}
                  <button
                    onClick={() => setCountryFilter("")}
                    className="ml-1"
                    aria-label="Supprimer le filtre de pays"
                  >
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
                    aria-label="Supprimer le filtre de catégorie"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {statusFilter && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Statut:{" "}
                  {statusFilter === "OPEN"
                    ? "Inscriptions ouvertes"
                    : statusFilter === "IN_PROGRESS"
                    ? "En cours"
                    : statusFilter === "CLOSED"
                    ? "Inscriptions fermées"
                    : statusFilter === "COMPLETED"
                    ? "Terminées"
                    : statusFilter === "COMING_SOON"
                    ? "Prochainement"
                    : statusFilter}
                  <button
                    onClick={() => setStatusFilter("")}
                    className="ml-1"
                    aria-label="Supprimer le filtre de statut"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(searchQuery ||
                countryFilter ||
                categoryFilter ||
                statusFilter) && (
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
      ) : competitions.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">
            Aucune compétition trouvée
          </h3>
          <p className="mt-2 text-gray-500">
            {searchQuery || countryFilter || categoryFilter || statusFilter
              ? "Aucune compétition ne correspond à vos critères de recherche."
              : "Aucune compétition n'est disponible pour le moment."}
          </p>
          {(searchQuery || countryFilter || categoryFilter || statusFilter) && (
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Effacer les filtres
            </Button>
          )}

          {debugMode && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left max-w-2xl mx-auto">
              <h4 className="font-medium mb-2">Informations de débogage</h4>
              <p>
                Vérifiez que des compétitions ont été créées et qu'elles sont
                marquées comme publiques.
              </p>
              <p className="mt-2">
                Si vous êtes administrateur, vous pouvez essayer de :
              </p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>
                  Vérifier la collection MongoDB (Competition ou competitions)
                </li>
                <li>
                  S'assurer que les compétitions ont le statut OPEN,
                  IN_PROGRESS, CLOSED ou COMPLETED
                </li>
                <li>Vérifier que isPublic est défini à true</li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map((competition) => {
            // Utiliser registrationDeadline s'il existe, sinon utiliser registrationEndDate
            const deadlineDate =
              competition.registrationDeadline ||
              competition.registrationEndDate;
            const isDeadlinePassed = isDatePassed(deadlineDate);

            return (
              <Card
                key={competition.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-40 relative">
                  {competition.imageUrl ? (
                    <Image
                      src={competition.imageUrl || "/placeholder.svg"}
                      alt={competition.name || "Image de la compétition"}
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

                  {/* Badge pour le statut de la compétition */}
                  <div className="absolute top-2 left-2">
                    {getStatusBadge(competition)}
                  </div>

                  {/* Badge pour la date limite d'inscription (seulement pour les compétitions OPEN) */}
                  {competition.status?.toUpperCase() === "OPEN" &&
                    deadlineDate && (
                      <div className="absolute bottom-2 left-2">
                        <Badge
                          className={`flex items-center gap-1 ${
                            isDeadlinePassed
                              ? "bg-red-600 text-white"
                              : "bg-amber-600 text-white"
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {isDeadlinePassed
                            ? "Inscriptions terminées"
                            : `Date limite: ${formatDate(deadlineDate)}`}
                        </Badge>
                      </div>
                    )}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle>
                    {competition.name || "Compétition sans nom"}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    {competition.country || "International"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {competition.status?.toUpperCase() !== "DRAFT" && (
                      <>
                        <div className="flex items-start">
                          <Calendar className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                          <div>
                            <p className="font-medium">
                              {competition.status?.toUpperCase() === "OPEN"
                                ? "Période d'inscriptions:"
                                : competition.status?.toUpperCase() ===
                                  "IN_PROGRESS"
                                ? "Dates de la compétition:"
                                : "Dates:"}
                            </p>
                            <p>
                              {competition.status?.toUpperCase() === "OPEN"
                                ? `Du ${formatDate(
                                    competition.registrationStartDate
                                  )} au ${formatDate(deadlineDate)}`
                                : `Du ${formatDate(
                                    competition.startDate
                                  )} au ${formatDate(competition.endDate)}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          <span>
                            {competition.location || "Lieu non défini"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-500" />
                          <span>
                            {competition.currentParticipants || 0}/
                            {competition.maxParticipants || "∞"} participants
                          </span>
                        </div>
                        {competition.status?.toUpperCase() === "OPEN" && (
                          <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-100">
                            <p className="text-xs font-medium text-gray-500">
                              Code d'invitation:
                            </p>
                            <p className="font-mono font-bold">
                              {competition.uniqueCode}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {competition.status?.toUpperCase() === "DRAFT" && (
                      <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center">
                        <PenLine className="h-5 w-5 mx-auto mb-2 text-gray-500" />
                        <p className="font-medium text-gray-700">
                          En cours de préparation
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Cette compétition sera bientôt disponible. Revenez
                          plus tard pour plus d'informations.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>{getActionButton(competition)}</CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Participer à la compétition</DialogTitle>
            <DialogDescription>
              Confirmez votre participation à{" "}
              {selectedCompetition?.name || "cette compétition"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedCompetition && (
              <Alert className="bg-blue-50">
                <Info className="h-4 w-4" />
                <AlertTitle>Informations importantes</AlertTitle>
                <AlertDescription>
                  <p>
                    Date limite d'inscription:{" "}
                    {formatDate(
                      selectedCompetition.registrationDeadline ||
                        selectedCompetition.registrationEndDate
                    )}
                  </p>
                  <p>
                    Nombre de participants:{" "}
                    {selectedCompetition.currentParticipants || 0}/
                    {selectedCompetition.maxParticipants || "∞"}
                  </p>
                </AlertDescription>
              </Alert>
            )}

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
