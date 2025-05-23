import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarDays, Trophy, Users, Activity } from "lucide-react";

// Interface pour la compétition
interface Competition {
  id: string;
  _id?: any;
  title: string;
  status: string;
  teams: any[];
  participations: any[];
  createdAt: Date;
  registrationDeadline: Date;
}

export default async function OrganizerDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ORGANIZER") {
    redirect("/signin");
  }

  // Récupérer les compétitions de l'organisateur en utilisant MongoDB directement
  const db = await connectDB();

  // Récupérer l'ID de l'utilisateur
  let userId = session.user.id;
  if (!userId && session.user.email) {
    console.log(
      `ID utilisateur non trouvé dans la session, recherche par email: ${session.user.email}`
    );

    // Rechercher l'utilisateur par email
    const user = await db
      .collection("User")
      .findOne({ email: session.user.email });

    if (user && user._id) {
      userId = user._id.toString();
      console.log(`Utilisateur trouvé par email, ID: ${userId}`);
    }
  }

  if (!userId) {
    console.log(
      "Impossible de déterminer l'ID de l'utilisateur, affichage d'un tableau de bord vide"
    );
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {session.user.name}. Aucune compétition trouvée.
          </p>
        </div>
        <div className="flex justify-center py-8">
          <Link href="/organizer/competitions/create">
            <Button>Créer votre première compétition</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Récupérer les compétitions avec MongoDB
  const competitionsData = await db
    .collection("Competition")
    .find({ organizerId: userId })
    .toArray();

  // Convertir les données MongoDB en format utilisable
  const competitions: Competition[] = competitionsData.map((comp: any) => ({
    id: comp._id.toString(),
    _id: comp._id,
    title: comp.title || "Sans titre",
    status: comp.status || "DRAFT",
    teams: comp.teams || [],
    participations: comp.participations || [],
    createdAt: comp.createdAt ? new Date(comp.createdAt) : new Date(),
    registrationDeadline: comp.registrationDeadline
      ? new Date(comp.registrationDeadline)
      : new Date(),
  }));

  // Statistiques
  const totalCompetitions = competitions.length;
  const activeCompetitions = competitions.filter(
    (comp) => comp.status === "OPEN" || comp.status === "IN_PROGRESS"
  ).length;
  const totalTeams = competitions.reduce(
    (acc, comp) => acc + (comp.teams?.length || 0),
    0
  );
  const pendingRequests = competitions.reduce(
    (acc, comp) =>
      acc +
      (comp.participations?.filter((p) => p.status === "PENDING")?.length || 0),
    0
  );

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
              {
                competitions.filter(
                  (c) => new Date(c.registrationDeadline) > new Date()
                ).length
              }
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
              Vos {competitions.slice(0, 5).length} dernières compétitions
              créées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {competitions.length > 0 ? (
              <div className="space-y-4">
                {competitions.slice(0, 5).map((competition) => (
                  <div
                    key={competition.id}
                    className="flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {competition.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {competition.teams?.length || 0} équipes •{" "}
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
                  .filter(
                    (comp) =>
                      (comp.participations?.filter(
                        (p) => p.status === "PENDING"
                      )?.length || 0) > 0
                  )
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
                          {competition.participations?.filter(
                            (p) => p.status === "PENDING"
                          )?.length || 0}{" "}
                          demandes en attente
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
