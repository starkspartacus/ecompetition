import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarDays, Trophy, Users, Activity } from "lucide-react";

// Helper function to safely convert numbers
function safeNumber(value: any): number {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

export default async function ParticipantDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "PARTICIPANT") {
    redirect("/signin");
  }

  try {
    const db = await getDb();

    // Récupérer les participations du participant avec les informations des compétitions
    const participations = await db
      .collection("Participation")
      .aggregate([
        {
          $match: {
            participantId: new ObjectId(session.user.id),
          },
        },
        {
          $lookup: {
            from: "Competition",
            localField: "competitionId",
            foreignField: "_id",
            as: "competition",
          },
        },
        {
          $unwind: {
            path: "$competition",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ])
      .toArray();

    // Récupérer les équipes du participant avec les informations des compétitions et joueurs
    const teams = await db
      .collection("Team")
      .aggregate([
        {
          $match: {
            ownerId: new ObjectId(session.user.id),
          },
        },
        {
          $lookup: {
            from: "Competition",
            localField: "competitionId",
            foreignField: "_id",
            as: "competition",
          },
        },
        {
          $unwind: {
            path: "$competition",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: "Player",
            localField: "_id",
            foreignField: "teamId",
            as: "players",
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ])
      .toArray();

    // Statistiques
    const totalCompetitions = safeNumber(participations.length);
    const acceptedCompetitions = safeNumber(
      participations.filter((p) => p.status === "ACCEPTED").length
    );
    const pendingCompetitions = safeNumber(
      participations.filter((p) => p.status === "PENDING").length
    );
    const totalTeams = safeNumber(teams.length);
    const totalPlayers = safeNumber(
      teams.reduce((acc, team) => acc + (team.players?.length || 0), 0)
    );

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {session.user.name}. Gérez vos participations et équipes.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Compétitions
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCompetitions}</div>
              <p className="text-xs text-muted-foreground">
                {acceptedCompetitions} compétitions acceptées
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Équipes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTeams}</div>
              <p className="text-xs text-muted-foreground">
                Dans toutes vos compétitions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Demandes en attente
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCompetitions}</div>
              <p className="text-xs text-muted-foreground">
                Demandes en cours de traitement
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Joueurs</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPlayers}</div>
              <p className="text-xs text-muted-foreground">
                Dans toutes vos équipes
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Mes compétitions</CardTitle>
              <CardDescription>
                Vos {Math.min(participations.length, 5)} dernières compétitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {participations.length > 0 ? (
                <div className="space-y-4">
                  {participations.slice(0, 5).map((participation) => (
                    <div
                      key={participation._id.toString()}
                      className="flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {participation.competition?.title || "Compétition"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Statut:{" "}
                          {participation.status === "ACCEPTED"
                            ? "Accepté"
                            : participation.status === "PENDING"
                            ? "En attente"
                            : "Rejeté"}
                        </p>
                      </div>
                      <Link
                        href={`/participant/competitions/${
                          participation.competition?._id ||
                          participation.competitionId
                        }`}
                      >
                        <Button variant="outline" size="sm">
                          Voir
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="mb-4 text-muted-foreground">
                    Vous n'avez pas encore rejoint de compétition
                  </p>
                  <Link href="/participant/competitions/browse">
                    <Button>Rejoindre une compétition</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Mes équipes</CardTitle>
              <CardDescription>Vos équipes créées</CardDescription>
            </CardHeader>
            <CardContent>
              {teams.length > 0 ? (
                <div className="space-y-4">
                  {teams.slice(0, 3).map((team) => (
                    <div
                      key={team._id.toString()}
                      className="flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {team.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {team.players?.length || 0} joueurs •{" "}
                          {team.competition?.title || "Compétition"}
                        </p>
                      </div>
                      <Link href={`/participant/teams/${team._id}`}>
                        <Button variant="outline" size="sm">
                          Gérer
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">
                    Vous n'avez pas encore créé d'équipe
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error("❌ Erreur lors du chargement du dashboard:", error);

    // Fallback UI en cas d'erreur
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {session.user.name}.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Compétitions
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Chargement...</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Équipes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Chargement...</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Demandes en attente
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Chargement...</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Joueurs</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Chargement...</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Erreur de chargement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Une erreur s'est produite lors du chargement de vos données.
            </p>
            <div className="mt-4">
              <Link href="/participant/competitions/browse">
                <Button>Parcourir les compétitions</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
