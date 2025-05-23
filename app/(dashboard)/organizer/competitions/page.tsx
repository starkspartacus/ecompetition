"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Trophy,
  Plus,
  Search,
  Calendar,
  Users,
  MapPin,
  Loader2,
  AlertCircle,
  Edit,
  Eye,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shell } from "@/components/shell";
import Image from "next/image";

interface Competition {
  id: string;
  _id?: string;
  name?: string;
  title?: string;
  description?: string;
  location?: string;
  address?: string;
  venue?: string;
  startDate?: string;
  endDate?: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  registrationDeadline?: string;
  maxParticipants?: number;
  category?: string;
  status?: string;
  uniqueCode?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  participantsCount?: number;
}

export default function CompetitionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState<
    Competition[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const fetchCompetitions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("🔍 Récupération des compétitions...");
      const response = await fetch("/api/competitions");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erreur lors de la récupération des compétitions"
        );
      }

      console.log(
        "✅ Compétitions récupérées:",
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
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCompetitions();
    } else if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router, fetchCompetitions]);

  useEffect(() => {
    let filtered = [...competitions];

    // Filtrer par statut
    if (activeTab !== "all") {
      filtered = filtered.filter(
        (comp) => comp.status?.toLowerCase() === activeTab
      );
    }

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (comp) =>
          comp.name?.toLowerCase().includes(query) ||
          comp.title?.toLowerCase().includes(query) ||
          comp.description?.toLowerCase().includes(query) ||
          comp.category?.toLowerCase().includes(query) ||
          comp.location?.toLowerCase().includes(query) ||
          comp.address?.toLowerCase().includes(query) ||
          comp.uniqueCode?.toLowerCase().includes(query)
      );
    }

    setFilteredCompetitions(filtered);
  }, [searchQuery, activeTab, competitions]);

  const handleCreateCompetition = () => {
    router.push("/organizer/competitions/create");
  };

  const handleViewCompetition = (competition: Competition) => {
    const id = competition.uniqueCode || competition.id || competition._id;
    router.push(`/organizer/competitions/${id}`);
  };

  const handleEditCompetition = (competition: Competition) => {
    const id = competition.uniqueCode || competition.id || competition._id;
    router.push(`/organizer/competitions/${id}/edit`);
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    switch (status.toUpperCase()) {
      case "DRAFT":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            Brouillon
          </Badge>
        );
      case "PUBLISHED":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Publiée
          </Badge>
        );
      case "REGISTRATION_OPEN":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Inscriptions ouvertes
          </Badge>
        );
      case "REGISTRATION_CLOSED":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800">
            Inscriptions fermées
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            En cours
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
            Terminée
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Annulée
          </Badge>
        );
      case "OPEN":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Ouvert
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Fermé
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  if (status === "loading") {
    return (
      <Shell>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Chargement...</span>
        </div>
      </Shell>
    );
  }

  const renderCompetitionsList = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
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
      );
    }

    if (error) {
      return (
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
      );
    }

    if (filteredCompetitions.length === 0) {
      return (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">
            Aucune compétition trouvée
          </h3>
          <p className="mt-2 text-gray-500">
            {searchQuery
              ? "Aucune compétition ne correspond à votre recherche."
              : activeTab !== "all"
              ? "Vous n'avez pas encore de compétition dans cette catégorie."
              : "Vous n'avez pas encore créé de compétition."}
          </p>
          <Button onClick={handleCreateCompetition} className="mt-4">
            Créer une compétition
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompetitions.map((competition) => (
          <Card
            key={competition.id || competition._id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="h-40 relative">
              {competition.imageUrl ? (
                <Image
                  src={competition.imageUrl || "/placeholder.svg"}
                  alt={competition.name || competition.title || "Compétition"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Trophy className="h-16 w-16 text-white" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                {getStatusBadge(competition.status)}
                {getCategoryBadge(competition.category)}
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {competition.name || competition.title || "Sans titre"}
              </CardTitle>
              <CardDescription>Code: {competition.uniqueCode}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-start">
                  <Calendar className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                  <div>
                    <p className="font-medium">Inscriptions:</p>
                    <p>
                      Du {formatDate(competition.registrationStartDate)} au{" "}
                      {formatDate(
                        competition.registrationEndDate ||
                          competition.registrationDeadline
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {competition.location ||
                      competition.address ||
                      competition.venue ||
                      "Lieu non défini"}
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {competition.participantsCount || 0}/
                    {competition.maxParticipants || "∞"} participants
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditCompetition(competition)}
                className="flex-1"
              >
                <Edit className="mr-2 h-4 w-4" /> Modifier
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleViewCompetition(competition)}
                className="flex-1"
              >
                <Eye className="mr-2 h-4 w-4" /> Voir
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Shell>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mes compétitions</h1>
          <p className="text-gray-500 mt-1">
            Gérez vos compétitions et suivez leur progression
          </p>
        </div>
        <Button
          onClick={handleCreateCompetition}
          className="bg-gradient-to-r from-blue-600 to-indigo-600"
        >
          <Plus className="mr-2 h-4 w-4" /> Créer une compétition
        </Button>
      </div>

      <div className="mb-6">
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

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="draft">Brouillons</TabsTrigger>
          <TabsTrigger value="open">Ouvertes</TabsTrigger>
          <TabsTrigger value="in_progress">En cours</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {renderCompetitionsList()}
        </TabsContent>
        <TabsContent value="draft" className="mt-0">
          {renderCompetitionsList()}
        </TabsContent>
        <TabsContent value="open" className="mt-0">
          {renderCompetitionsList()}
        </TabsContent>
        <TabsContent value="in_progress" className="mt-0">
          {renderCompetitionsList()}
        </TabsContent>
        <TabsContent value="completed" className="mt-0">
          {renderCompetitionsList()}
        </TabsContent>
      </Tabs>
    </Shell>
  );
}
