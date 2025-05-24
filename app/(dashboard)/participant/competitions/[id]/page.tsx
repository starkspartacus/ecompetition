import { getCompetitionById } from "@/lib/db-helpers";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Trophy,
  Users,
  Clock,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompetitionStatus } from "@/lib/prisma-schema";

export default async function ParticipantCompetitionView({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return notFound();
  }

  const competition = await getCompetitionById(params.id);
  if (!competition) {
    return notFound();
  }

  // Format dates
  const startDate = competition.startDate
    ? new Date(competition.startDate)
    : null;
  const endDate = competition.endDate ? new Date(competition.endDate) : null;
  const registrationDeadline = competition.registrationDeadline
    ? new Date(competition.registrationDeadline)
    : null;

  // Format location
  const location = [competition.address, competition.venue]
    .filter(Boolean)
    .join(", ");

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case CompetitionStatus.DRAFT:
        return "bg-gray-200 text-gray-800";
      case CompetitionStatus.OPEN:
        return "bg-green-100 text-green-800";
      case CompetitionStatus.CLOSED:
        return "bg-amber-100 text-amber-800";
      case CompetitionStatus.IN_PROGRESS:
        return "bg-purple-100 text-purple-800";
      case CompetitionStatus.COMPLETED:
        return "bg-indigo-100 text-indigo-800";
      case CompetitionStatus.CANCELLED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case CompetitionStatus.DRAFT:
        return "Brouillon";
      case CompetitionStatus.OPEN:
        return "Inscriptions ouvertes";
      case CompetitionStatus.CLOSED:
        return "Inscriptions fermées";
      case CompetitionStatus.IN_PROGRESS:
        return "En cours";
      case CompetitionStatus.COMPLETED:
        return "Terminée";
      case CompetitionStatus.CANCELLED:
        return "Annulée";
      default:
        return status;
    }
  };

  // Format rules for display
  const formatRules = (rules: any) => {
    if (!rules) return "Règles non spécifiées";

    if (Array.isArray(rules)) {
      return rules.join(", ");
    }

    if (typeof rules === "string") {
      try {
        // Try to parse if it's a JSON string
        const parsedRules = JSON.parse(rules);
        if (Array.isArray(parsedRules)) {
          return parsedRules.join(", ");
        }
        return rules;
      } catch (e) {
        // If it's not valid JSON, return as is
        return rules;
      }
    }

    return "Règles non spécifiées";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/participant/competitions/browse">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Retour</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{competition.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(competition.status)}>
            {formatStatus(competition.status)}
          </Badge>
          {competition.status === CompetitionStatus.OPEN && (
            <Button asChild>
              <Link
                href={`/participant/competitions/join?id=${competition.id}`}
              >
                S'inscrire
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Image de la compétition */}
          <div className="relative aspect-video overflow-hidden rounded-lg">
            {competition.imageUrl ? (
              <Image
                src={competition.imageUrl || "/placeholder.svg"}
                alt={competition.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 66vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                <Trophy className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">
                {competition.description || "Aucune description disponible."}
              </p>
            </CardContent>
          </Card>

          {/* Règles */}
          <Card>
            <CardHeader>
              <CardTitle>Règles et format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Format de compétition</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {competition.tournamentFormat || "Format non spécifié"}
                </p>
              </div>

              <div>
                <h3 className="font-medium">Règles</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatRules(competition.rules)}
                </p>
              </div>

              <div>
                <h3 className="font-medium">Catégorie</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {competition.category || "Catégorie non spécifiée"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Informations de base */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <h3 className="font-medium">Dates</h3>
                  {startDate && endDate ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Du {format(startDate, "d MMMM yyyy", { locale: fr })} au{" "}
                      {format(endDate, "d MMMM yyyy", { locale: fr })}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Dates non spécifiées
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <h3 className="font-medium">Inscription jusqu'au</h3>
                  {registrationDeadline ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(registrationDeadline, "d MMMM yyyy", {
                        locale: fr,
                      })}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Date limite non spécifiée
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-500" />
                <div>
                  <h3 className="font-medium">Lieu</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {location || "Lieu non spécifié"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-gray-500" />
                <div>
                  <h3 className="font-medium">Participants</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {competition.maxParticipants
                      ? `Maximum ${competition.maxParticipants} participants`
                      : "Nombre illimité"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organisateur */}
          <Card>
            <CardHeader>
              <CardTitle>Organisateur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {competition.organizer?.photoUrl ? (
                  <Image
                    src={competition.organizer.photoUrl || "/placeholder.svg"}
                    alt={`${competition.organizer.firstName} ${competition.organizer.lastName}`}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                    {competition.organizer?.firstName?.[0] || "O"}
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {competition.organizer?.firstName}{" "}
                    {competition.organizer?.lastName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Organisateur
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {competition.status === CompetitionStatus.OPEN ? (
                <Button className="w-full" asChild>
                  <Link
                    href={`/participant/competitions/join?id=${competition.id}`}
                  >
                    S'inscrire à cette compétition
                  </Link>
                </Button>
              ) : (
                <Button className="w-full" disabled>
                  Inscriptions{" "}
                  {competition.status === CompetitionStatus.CLOSED
                    ? "fermées"
                    : "indisponibles"}
                </Button>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/participant/competitions/browse">
                  Voir d'autres compétitions
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
