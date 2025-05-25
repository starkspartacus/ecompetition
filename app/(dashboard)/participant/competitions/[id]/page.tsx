"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { notFound, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Trophy,
  Users,
  Clock,
  UserCheck,
  UserPlus,
  Star,
  Share2,
  Heart,
  Award,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  Info,
  Download,
  Eye,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// Competition status enum
const CompetitionStatus = {
  DRAFT: "draft",
  OPEN: "open",
  CLOSED: "closed",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Competition {
  _id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  status: string;
  category?: string;
  sport?: string;
  tournamentFormat?: string;
  rules?: any;
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  venue?: string;
  address?: string;
  city?: string;
  maxParticipants?: number;
  organizer?: {
    firstName: string;
    lastName: string;
    email: string;
    photoUrl?: string;
  };
}

interface CompetitionData {
  competition: Competition;
  stats: {
    participantCount: number;
    pendingCount: number;
  };
  isParticipating: boolean;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};

// Loading skeleton component
function CompetitionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Stats component with animations
function CompetitionStats({
  stats = { participantCount: 0, pendingCount: 0 },
}: {
  stats?: { participantCount: number; pendingCount: number };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-6 text-sm text-muted-foreground"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full"
      >
        <Users className="h-4 w-4 text-blue-600" />
        <span className="font-medium">
          {stats.participantCount} participants
        </span>
      </motion.div>
      {stats.pendingCount > 0 && (
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded-full"
        >
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="font-medium">{stats.pendingCount} en attente</span>
        </motion.div>
      )}
    </motion.div>
  );
}

// Participation status component
function ParticipationStatus({
  isParticipating,
}: {
  isParticipating: boolean;
}) {
  if (isParticipating) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        className="inline-flex"
      >
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 border-green-200"
        >
          <UserCheck className="h-3 w-3 mr-1" />
          Inscrit
        </Badge>
      </motion.div>
    );
  }

  return null;
}

export default function ParticipantCompetitionView({ params }: PageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [competitionData, setCompetitionData] =
    useState<CompetitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(
    null
  );

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    if (!resolvedParams?.id || !session?.user?.id) return;

    const fetchCompetitionData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`🔍 Fetch competition data for ID: ${resolvedParams.id}`);

        const response = await fetch(
          `/api/competitions/${resolvedParams.id}/details`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("Compétition non trouvée");
          } else {
            setError("Erreur lors du chargement de la compétition");
          }
          return;
        }

        const data = await response.json();
        console.log(`✅ Competition data loaded:`, data.competition.title);
        setCompetitionData(data);
      } catch (error) {
        console.error("❌ Erreur fetch competition:", error);
        setError("Erreur de connexion");
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitionData();
  }, [resolvedParams, session]);

  if (!session?.user?.id) {
    return notFound();
  }

  if (loading || !resolvedParams) {
    return <CompetitionSkeleton />;
  }

  if (error || !competitionData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Compétition non trouvée
            </h2>
            <p className="text-gray-600 mb-4">
              {error || "Cette compétition n'existe pas ou a été supprimée."}
            </p>
            <Button asChild>
              <Link href="/participant/competitions/browse">
                Retour aux compétitions
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    competition,
    stats = { participantCount: 0, pendingCount: 0 },
    isParticipating = false,
  } = competitionData;

  // Format dates safely
  const startDate = competition.startDate
    ? new Date(competition.startDate)
    : null;
  const endDate = competition.endDate ? new Date(competition.endDate) : null;
  const registrationDeadline = competition.registrationDeadline
    ? new Date(competition.registrationDeadline)
    : null;

  // Format location
  const location = [competition.venue, competition.address, competition.city]
    .filter(Boolean)
    .join(", ");

  // Get status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case CompetitionStatus.DRAFT:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: AlertCircle,
          label: "Brouillon",
        };
      case CompetitionStatus.OPEN:
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
          label: "Inscriptions ouvertes",
        };
      case CompetitionStatus.CLOSED:
        return {
          color: "bg-amber-100 text-amber-800 border-amber-200",
          icon: Clock,
          label: "Inscriptions fermées",
        };
      case CompetitionStatus.IN_PROGRESS:
        return {
          color: "bg-purple-100 text-purple-800 border-purple-200",
          icon: Zap,
          label: "En cours",
        };
      case CompetitionStatus.COMPLETED:
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Trophy,
          label: "Terminée",
        };
      case CompetitionStatus.CANCELLED:
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: AlertCircle,
          label: "Annulée",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: Info,
          label: status,
        };
    }
  };

  const statusConfig = getStatusConfig(competition.status);
  const StatusIcon = statusConfig.icon;

  // Format rules for display
  const formatRules = (rules: any) => {
    if (!rules) return ["Règles non spécifiées"];

    if (Array.isArray(rules)) {
      return rules;
    }

    if (typeof rules === "string") {
      try {
        const parsedRules = JSON.parse(rules);
        if (Array.isArray(parsedRules)) {
          return parsedRules;
        }
        return [rules];
      } catch (e) {
        return [rules];
      }
    }

    return ["Règles non spécifiées"];
  };

  // Check if user can register
  const canRegister =
    competition.status === CompetitionStatus.OPEN &&
    (!registrationDeadline || registrationDeadline > new Date());

  // Calculate registration progress
  const registrationProgress =
    competition.maxParticipants && stats?.participantCount
      ? (stats.participantCount / competition.maxParticipants) * 100
      : 0;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: competition.title,
          text: competition.description,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Lien copié !",
          description:
            "Le lien de la compétition a été copié dans le presse-papiers.",
        });
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié !",
        description:
          "Le lien de la compétition a été copié dans le presse-papiers.",
      });
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    toast({
      title: liked ? "Retiré des favoris" : "Ajouté aux favoris",
      description: liked
        ? "Cette compétition a été retirée de vos favoris."
        : "Cette compétition a été ajoutée à vos favoris.",
    });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950"
    >
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="rounded-full"
              >
                <Link href="/participant/competitions/browse">
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Retour</span>
                </Link>
              </Button>
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                {competition.title}
              </motion.h1>
              <CompetitionStats stats={stats} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ParticipationStatus isParticipating={isParticipating} />

            <motion.div whileHover={{ scale: 1.05 }} className="inline-flex">
              <Badge className={`${statusConfig.color} border`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </motion.div>

            <div className="flex gap-2">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleLike}
                  className="rounded-full"
                >
                  <Heart
                    className={`h-4 w-4 ${
                      liked ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  className="rounded-full"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </motion.div>

              {canRegister && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    asChild
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Link
                      href={`/participant/competitions/join?id=${resolvedParams.id}`}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      S'inscrire
                    </Link>
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Competition image */}
            <motion.div variants={cardVariants} whileHover="hover">
              <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <div className="relative aspect-video overflow-hidden">
                  {competition.imageUrl ? (
                    <Image
                      src={competition.imageUrl || "/placeholder.svg"}
                      alt={competition.title}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      priority
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                      <Trophy className="h-24 w-24 text-blue-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    {competition.category && (
                      <Badge className="bg-white/90 text-gray-800">
                        <Target className="h-3 w-3 mr-1" />
                        {competition.category}
                      </Badge>
                    )}
                    {competition.sport && (
                      <Badge className="bg-white/90 text-gray-800">
                        <Award className="h-3 w-3 mr-1" />
                        {competition.sport}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Description */}
            <motion.div variants={cardVariants} whileHover="hover">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-gray-700 dark:text-gray-300 leading-relaxed">
                    {competition.description ||
                      "Aucune description disponible."}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Rules and format */}
            <motion.div variants={cardVariants} whileHover="hover">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-purple-600" />
                    Règles et format
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {competition.tournamentFormat && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-600" />
                        Format de compétition
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {competition.tournamentFormat}
                      </p>
                    </motion.div>
                  )}

                  <Separator />

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Règles
                    </h3>
                    <div className="space-y-2">
                      {formatRules(competition.rules).map((rule, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {rule}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Basic information */}
            <motion.div variants={cardVariants} whileHover="hover">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Informations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950"
                  >
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Dates
                      </h3>
                      {startDate && endDate ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Du {format(startDate, "d MMMM yyyy", { locale: fr })}{" "}
                          au {format(endDate, "d MMMM yyyy", { locale: fr })}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Dates non spécifiées
                        </p>
                      )}
                    </div>
                  </motion.div>

                  {registrationDeadline && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950"
                    >
                      <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          Inscription jusqu'au
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {format(
                            registrationDeadline,
                            "d MMMM yyyy 'à' HH:mm",
                            { locale: fr }
                          )}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {location && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950"
                    >
                      <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          Lieu
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {location}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950"
                  >
                    <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Participants
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {competition.maxParticipants
                          ? `${stats.participantCount}/${competition.maxParticipants} participants`
                          : `${stats.participantCount} participants`}
                      </p>
                      {competition.maxParticipants && (
                        <div className="space-y-1">
                          <Progress
                            value={registrationProgress}
                            className="h-2"
                          />
                          <p className="text-xs text-gray-500">
                            {Math.round(registrationProgress)}% des places
                            occupées
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Organizer */}
            {competition.organizer && (
              <motion.div variants={cardVariants} whileHover="hover">
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-orange-600" />
                      Organisateur
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950"
                    >
                      <Avatar className="h-12 w-12 border-2 border-orange-200">
                        <AvatarImage
                          src={
                            competition.organizer.photoUrl || "/placeholder.svg"
                          }
                          alt={`${competition.organizer.firstName} ${competition.organizer.lastName}`}
                        />
                        <AvatarFallback className="bg-orange-100 text-orange-700">
                          {competition.organizer.firstName?.[0] || "O"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {competition.organizer.firstName}{" "}
                          {competition.organizer.lastName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Organisateur
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <Star className="h-3 w-3 text-gray-300" />
                          <span className="text-xs text-gray-500 ml-1">
                            4.2
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div variants={cardVariants} whileHover="hover">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AnimatePresence mode="wait">
                    {canRegister ? (
                      <motion.div
                        key="register"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12"
                          asChild
                        >
                          <Link
                            href={`/participant/competitions/join?id=${resolvedParams.id}`}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            S'inscrire à cette compétition
                          </Link>
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="disabled"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Button className="w-full h-12" disabled>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Inscriptions{" "}
                          {competition.status === CompetitionStatus.CLOSED
                            ? "fermées"
                            : "indisponibles"}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-2 gap-2">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/participant/competitions/browse">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Retour
                        </Link>
                      </Button>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Suivre
                      </Button>
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Discuter
                      </Button>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Règlement
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
