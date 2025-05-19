import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarDays, Trophy, Users, Activity } from "lucide-react";

export default async function OrganizerDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ORGANIZER") {
    redirect("/signin");
  }

  // Récupérer les compétitions de l'organisateur
  const competitions = await prisma?.competition.findMany({
    where: {
      organizerId: session.user.id,
    },
    include: {
      teams: true,
      participations: {
        where: {
          status: "PENDING",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Statistiques
  const totalCompetitions = competitions?.length ?? 0;
  const activeCompetitions =
    competitions?.filter(
      (comp) => comp.status === "OPEN" || comp.status === "IN_PROGRESS"
    ).length ?? 0;
  const totalTeams =
    competitions?.reduce((acc, comp) => acc + comp.teams.length, 0) ?? 0;
  const pendingRequests =
    competitions?.reduce((acc, comp) => acc + comp.participations.length, 0) ??
    0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue, {session.user.name}. Gérez vos compétitions et suivez leur
          évolution.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compétitions totales
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompetitions}</div>
            <p className="text-xs text-muted-foreground">
              {activeCompetitions} compétitions actives
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Équipes inscrites
            </CardTitle>
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
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Demandes à traiter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Prochains événements
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {competitions?.filter(
                (c) => new Date(c.registrationDeadline) > new Date()
              ).length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Compétitions à venir
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Compétitions récentes</CardTitle>
            <CardDescription>
              Vos {competitions?.slice(0, 5).length} dernières compétitions
              créées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {competitions && competitions.length > 0 ? (
              <div className="space-y-4">
                {competitions?.slice(0, 5).map((competition) => (
                  <div
                    key={competition.id}
                    className="flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {competition.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {competition.teams.length} équipes •{" "}
                        {competition.status}
                      </p>
                    </div>
                    <Link href={`/organizer/competitions/${competition.id}`}>
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
                  Vous n'avez pas encore créé de compétition
                </p>
                <Link href="/organizer/competitions/create">
                  <Button>Créer une compétition</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Demandes de participation</CardTitle>
            <CardDescription>Demandes en attente de validation</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests > 0 ? (
              <div className="space-y-4">
                {competitions
                  ?.filter((comp) => comp.participations.length > 0)
                  .slice(0, 3)
                  .map((competition) => (
                    <div
                      key={competition.id}
                      className="flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {competition.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {competition.participations.length} demandes en
                          attente
                        </p>
                      </div>
                      <Link
                        href={`/organizer/competitions/${competition.id}/participants`}
                      >
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
                  Aucune demande en attente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
