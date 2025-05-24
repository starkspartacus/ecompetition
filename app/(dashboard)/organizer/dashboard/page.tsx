"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Trophy,
  Users,
  Calendar,
  MapPin,
  Eye,
  Edit,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  PlayCircle,
  Target,
  UserCheck,
  Bell,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Competition {
  id: string;
  title: string;
  description: string;
  category: string;
  status:
    | "DRAFT"
    | "OPEN"
    | "CLOSED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";
  startDate: string | null;
  endDate: string | null;
  registrationDeadline: string | null;
  maxParticipants: number;
  participants: number;
  venue: string;
  city: string;
  country: string;
  imageUrl: string | null;
  uniqueCode: string;
  createdAt: string;
}

interface PendingParticipation {
  id: string;
  participant: {
    firstName: string;
    lastName: string;
    email: string;
  };
  competition: {
    id: string;
    title: string;
  };
  message: string | null;
  createdAt: string;
}

interface Stats {
  totalCompetitions: number;
  totalParticipants: number;
  pendingRequests: number;
  upcomingCompetitions: number;
}

const statusConfig = {
  DRAFT: {
    label: "Brouillon",
    color: "bg-gray-500",
    icon: Edit,
    gradient: "from-gray-400 to-gray-600",
  },
  OPEN: {
    label: "Ouvert",
    color: "bg-green-500",
    icon: CheckCircle,
    gradient: "from-green-400 to-green-600",
  },
  CLOSED: {
    label: "Fermé",
    color: "bg-orange-500",
    icon: Clock,
    gradient: "from-orange-400 to-orange-600",
  },
  IN_PROGRESS: {
    label: "En cours",
    color: "bg-blue-500",
    icon: PlayCircle,
    gradient: "from-blue-400 to-blue-600",
  },
  COMPLETED: {
    label: "Terminé",
    color: "bg-purple-500",
    icon: Trophy,
    gradient: "from-purple-400 to-purple-600",
  },
  CANCELLED: {
    label: "Annulé",
    color: "bg-red-500",
    icon: XCircle,
    gradient: "from-red-400 to-red-600",
  },
};

const categoryIcons: Record<string, string> = {
  Football: "⚽",
  Basketball: "🏀",
  Tennis: "🎾",
  Volleyball: "🏐",
  Handball: "🤾",
  Rugby: "🏉",
  Natation: "🏊",
  Athlétisme: "🏃",
  Cyclisme: "🚴",
  Boxe: "🥊",
  Judo: "🥋",
  Karaté: "🥋",
  Taekwondo: "🥋",
  Escrime: "🤺",
  Gymnastique: "🤸",
  Haltérophilie: "🏋️",
  Lutte: "🤼",
  Badminton: "🏸",
  "Tennis de table": "🏓",
  Golf: "⛳",
  Baseball: "⚾",
  Softball: "🥎",
  Cricket: "🏏",
  Hockey: "🏒",
  Ski: "⛷️",
  Snowboard: "🏂",
  Patinage: "⛸️",
  Surf: "🏄",
  Plongée: "🤿",
  Voile: "⛵",
  Aviron: "🚣",
  Canoë: "🛶",
  Équitation: "🏇",
  "Tir à l'arc": "🏹",
  Pétanque: "🎯",
  Billard: "🎱",
  Fléchettes: "🎯",
  Échecs: "♟️",
  "E-sport": "🎮",
  Autre: "🏆",
};

// Fonction utilitaire pour valider et convertir les nombres
const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === "") return 0;
  const num =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);
  return isNaN(num) ? 0 : num;
};

// Fonction utilitaire pour formater les nombres
const formatNumber = (value: number): string => {
  return value.toLocaleString("fr-FR");
};

export default function OrganizerDashboard() {
  const { data: session } = useSession();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [pendingParticipations, setPendingParticipations] = useState<
    PendingParticipation[]
  >([]);
  const [stats, setStats] = useState<Stats>({
    totalCompetitions: 0,
    totalParticipants: 0,
    pendingRequests: 0,
    upcomingCompetitions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les compétitions
      const competitionsResponse = await fetch("/api/competitions");
      if (!competitionsResponse.ok) {
        throw new Error("Erreur lors de la récupération des compétitions");
      }
      const competitionsData = await competitionsResponse.json();
      const comps = competitionsData.competitions || [];

      // Nettoyer et valider les données des compétitions
      const cleanedCompetitions = comps.map((comp: any) => ({
        ...comp,
        participants: safeNumber(comp.participants),
        maxParticipants: safeNumber(comp.maxParticipants),
      }));

      setCompetitions(cleanedCompetitions);

      // Récupérer les demandes de participation en attente
      const participationsResponse = await fetch("/api/participations/pending");
      let participationsData;
      if (participationsResponse.ok) {
        participationsData = await participationsResponse.json();
        setPendingParticipations(participationsData.participations || []);
      } else {
        participationsData = { participations: [] };
      }

      // Calculer les statistiques avec validation
      const totalParticipants = cleanedCompetitions.reduce(
        (sum: number, comp: Competition) => {
          return sum + safeNumber(comp.participants);
        },
        0
      );

      const upcomingCompetitions = cleanedCompetitions.filter(
        (comp: Competition) => {
          if (!comp.startDate) return false;
          try {
            const startDate = new Date(comp.startDate);
            const now = new Date();
            return (
              startDate > now &&
              (comp.status === "OPEN" || comp.status === "CLOSED")
            );
          } catch {
            return false;
          }
        }
      ).length;

      setStats({
        totalCompetitions: safeNumber(cleanedCompetitions.length),
        totalParticipants: safeNumber(totalParticipants),
        pendingRequests: safeNumber(
          participationsData.participations?.length || 0
        ),
        upcomingCompetitions: safeNumber(upcomingCompetitions),
      });
    } catch (error) {
      console.error("Erreur:", error);
      setError(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredCompetitions = competitions.filter((comp) => {
    if (activeTab === "all") return true;
    return comp.status === activeTab.toUpperCase();
  });

  const getProgressPercentage = (current: number, max: number) => {
    const safeCurrent = safeNumber(current);
    const safeMax = safeNumber(max);
    if (safeMax === 0) return 0;
    return Math.min((safeCurrent / safeMax) * 100, 100);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non définie";
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="ml-2"
            >
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos compétitions et suivez vos statistiques
          </p>
        </div>
        <Link href="/organizer/competitions/create">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle compétition
          </Button>
        </Link>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Compétitions
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(stats.totalCompetitions)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Toutes vos compétitions
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Participants
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(stats.totalParticipants)}
            </div>
            <p className="text-xs text-muted-foreground">
              <UserCheck className="h-3 w-3 inline mr-1" />
              Participants inscrits
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Demandes en attente
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Bell className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-orange-600">
              {formatNumber(stats.pendingRequests)}
            </div>
            <p className="text-xs text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />À traiter
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prochaines compétitions
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-purple-600">
              {formatNumber(stats.upcomingCompetitions)}
            </div>
            <p className="text-xs text-muted-foreground">
              <Target className="h-3 w-3 inline mr-1" />À venir
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des compétitions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Mes Compétitions
              </CardTitle>
              <CardDescription>
                Gérez toutes vos compétitions depuis un seul endroit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="all">Toutes</TabsTrigger>
                  <TabsTrigger value="draft">Brouillon</TabsTrigger>
                  <TabsTrigger value="open">Ouvertes</TabsTrigger>
                  <TabsTrigger value="closed">Fermées</TabsTrigger>
                  <TabsTrigger value="in_progress">En cours</TabsTrigger>
                  <TabsTrigger value="completed">Terminées</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                  {filteredCompetitions.length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {activeTab === "all"
                          ? "Aucune compétition"
                          : `Aucune compétition ${activeTab}`}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Commencez par créer votre première compétition
                      </p>
                      <Link href="/organizer/competitions/create">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Créer une compétition
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredCompetitions.map((competition) => {
                        const config = statusConfig[competition.status];
                        const StatusIcon = config.icon;
                        const progressPercentage = getProgressPercentage(
                          competition.participants,
                          competition.maxParticipants
                        );

                        return (
                          <Card
                            key={competition.id}
                            className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group"
                          >
                            <div
                              className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
                            />
                            <CardContent className="p-6 relative">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">
                                      {categoryIcons[competition.category] ||
                                        "🏆"}
                                    </span>
                                    <div>
                                      <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                                        {competition.title}
                                      </h3>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Badge
                                          variant="outline"
                                          className={`${config.color} text-white border-0`}
                                        >
                                          <StatusIcon className="h-3 w-3 mr-1" />
                                          {config.label}
                                        </Badge>
                                        <span>•</span>
                                        <span>{competition.category}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span>
                                        Début:{" "}
                                        {formatDate(competition.startDate)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <MapPin className="h-4 w-4 text-muted-foreground" />
                                      <span>
                                        {competition.venue ||
                                          `${competition.city}, ${competition.country}`}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Users className="h-4 w-4 text-muted-foreground" />
                                      <span>
                                        {formatNumber(
                                          safeNumber(competition.participants)
                                        )}
                                        /
                                        {formatNumber(
                                          safeNumber(
                                            competition.maxParticipants
                                          )
                                        )}{" "}
                                        participants
                                      </span>
                                    </div>
                                  </div>

                                  {safeNumber(competition.maxParticipants) >
                                    0 && (
                                    <div className="mt-4">
                                      <div className="flex justify-between text-sm mb-1">
                                        <span>Participants inscrits</span>
                                        <span>
                                          {progressPercentage.toFixed(0)}%
                                        </span>
                                      </div>
                                      <Progress
                                        value={progressPercentage}
                                        className="h-2"
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col gap-2 ml-4">
                                  <Link
                                    href={`/organizer/competitions/${competition.id}`}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full"
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      Voir
                                    </Button>
                                  </Link>
                                  <Link
                                    href={`/organizer/competitions/${competition.id}/edit`}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full"
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Modifier
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Demandes de participation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Demandes en attente
                {stats.pendingRequests > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {formatNumber(stats.pendingRequests)}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingParticipations.length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Aucune demande en attente
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingParticipations.slice(0, 3).map((participation) => (
                    <div
                      key={participation.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {participation.participant.firstName}{" "}
                            {participation.participant.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {participation.competition.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(participation.createdAt)}
                          </p>
                        </div>
                        <Link
                          href={`/organizer/participations/${participation.id}`}
                        >
                          <Button variant="outline" size="sm">
                            Voir
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {pendingParticipations.length > 3 && (
                    <Link href="/organizer/participations">
                      <Button variant="outline" className="w-full">
                        Voir toutes les demandes (
                        {formatNumber(pendingParticipations.length)})
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prochaines compétitions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Prochaines compétitions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {competitions
                .filter((comp) => {
                  if (!comp.startDate) return false;
                  try {
                    const startDate = new Date(comp.startDate);
                    const now = new Date();
                    return (
                      startDate > now &&
                      (comp.status === "OPEN" || comp.status === "CLOSED")
                    );
                  } catch {
                    return false;
                  }
                })
                .slice(0, 3)
                .map((competition) => (
                  <div
                    key={competition.id}
                    className="p-3 border rounded-lg mb-3 last:mb-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {categoryIcons[competition.category] || "🏆"}
                      </span>
                      <p className="font-medium text-sm">{competition.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(competition.startDate)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatNumber(safeNumber(competition.participants))}/
                        {formatNumber(safeNumber(competition.maxParticipants))}
                      </span>
                    </div>
                  </div>
                ))}
              {stats.upcomingCompetitions === 0 && (
                <div className="text-center py-4">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Aucune compétition à venir
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
