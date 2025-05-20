"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Trophy,
  Users,
  MapPin,
  Clock,
  Eye,
  EyeOff,
  CalendarIcon,
  CalendarCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { COMPETITION_RULES } from "@/constants/competition-rules";
import Image from "next/image";

interface Competition {
  id: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  maxParticipants: number;
  currentParticipants: number;
  category: string;
  status: string;
  rules: string[];
  uniqueCode: string;
  createdAt: string;
  updatedAt: string;
  organizerId: string;
}

export default function CompetitionDetailsPage() {
  const { id } = useParams();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUniqueCode, setShowUniqueCode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        const response = await fetch(`/api/competitions/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch competition details");
        }
        const data = await response.json();
        setCompetition(data.competition);
      } catch (error) {
        console.error("Error fetching competition:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails de la compétition",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCompetition();
    }
  }, [id]);

  const copyUniqueCode = () => {
    if (competition?.uniqueCode) {
      navigator.clipboard.writeText(competition.uniqueCode);
      setCopySuccess(true);
      toast({
        title: "Code copié!",
        description: "Le code unique a été copié dans le presse-papier",
      });
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="w-full">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Compétition non trouvée</CardTitle>
            <CardDescription>
              La compétition que vous recherchez n'existe pas ou a été
              supprimée.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="w-full h-full">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl md:text-3xl font-bold">
                    {competition.name}
                  </CardTitle>
                  <CardDescription className="text-gray-100 mt-2">
                    {competition.description}
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="bg-white/20 text-white border-white"
                >
                  {competition.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span>{competition.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span>
                      Du {formatDate(competition.startDate)} au{" "}
                      {formatDate(competition.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                    <span>
                      Début des inscriptions:{" "}
                      {formatDate(competition.registrationStartDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-gray-500" />
                    <span>
                      Fin des inscriptions:{" "}
                      {formatDate(competition.registrationEndDate)}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-500" />
                    <span>
                      {competition.currentParticipants} /{" "}
                      {competition.maxParticipants} participants
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-gray-500" />
                    <span>Statut: {competition.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span>Créée le {formatDate(competition.createdAt)}</span>
                  </div>
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="w-full group relative overflow-hidden transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-none"
                      onClick={() => setShowUniqueCode(!showUniqueCode)}
                    >
                      <span className="flex items-center gap-2">
                        {showUniqueCode ? (
                          <>
                            <EyeOff className="h-4 w-4" /> Masquer le code
                            unique
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" /> Afficher le code unique
                          </>
                        )}
                      </span>
                    </Button>
                    {showUniqueCode && (
                      <div className="mt-2 p-3 bg-gray-100 rounded-md border border-gray-300 animate-fade-in">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-lg font-bold">
                            {competition.uniqueCode}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={copyUniqueCode}
                            className={copySuccess ? "text-green-500" : ""}
                          >
                            {copySuccess ? "Copié!" : "Copier"}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Partagez ce code avec les participants pour qu'ils
                          puissent s'inscrire à cette compétition.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <Tabs defaultValue="rules">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="rules">Règles</TabsTrigger>
                  <TabsTrigger value="participants">Participants</TabsTrigger>
                </TabsList>
                <TabsContent value="rules" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Règles de la compétition
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {competition.rules && competition.rules.length > 0 ? (
                        competition.rules.map((rule) => {
                          const ruleInfo = COMPETITION_RULES.find(
                            (r) => r.value === rule
                          );
                          return (
                            <Badge
                              key={rule}
                              variant="secondary"
                              className="px-3 py-1"
                            >
                              {ruleInfo ? ruleInfo.label : rule}
                            </Badge>
                          );
                        })
                      ) : (
                        <p className="text-gray-500">
                          Aucune règle spécifique définie pour cette
                          compétition.
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="participants" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Liste des participants
                    </h3>
                    {competition.currentParticipants > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Placeholder pour la liste des participants */}
                        <p className="text-gray-500">
                          Fonctionnalité à venir: liste des participants
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        Aucun participant inscrit pour le moment.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => window.history.back()}>
                Retour
              </Button>
              <Button>Modifier la compétition</Button>
            </CardFooter>
          </Card>
        </div>
        <div>
          <Card className="w-full h-full">
            <CardHeader>
              <CardTitle>Informations complémentaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-48 mb-4 overflow-hidden rounded-lg">
                <Image
                  src={`/abstract-geometric-shapes.png?height=300&width=500&query=${encodeURIComponent(
                    competition.category + " competition"
                  )}`}
                  alt={competition.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Progression des inscriptions
                  </h3>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          (competition.currentParticipants /
                            competition.maxParticipants) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {competition.currentParticipants} inscrits sur{" "}
                    {competition.maxParticipants} places disponibles
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Actions rapides
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      Exporter
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      Partager
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
