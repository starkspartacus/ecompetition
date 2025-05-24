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
import { CalendarDays, Trophy, Users, Activity, Bell } from "lucide-react";
import { ObjectId } from "mongodb";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// Interface pour la compétition
interface Competition {
  id: string;
  _id?: any;
  title: string;
  status: string;
  teams: any[];
  participants: any[];
  participations: any[];
  createdAt: Date;
  registrationDeadline: Date;
  startDate: Date;
  endDate: Date;
  venue: string;
  address: string;
  city: string;
  maxParticipants: number;
  currentParticipants: number;
  sport: string;
  category: string;
  description?: string;
}

// Interface pour la participation
interface Participation {
  id: string;
  _id?: any;
  competitionId: string;
  participantId: string;
  participantName: string;
  participantEmail: string;
  status: string;
  message: string;
  createdAt: Date;
  competitionTitle?: string;
}

// Interface pour la map des compétitions
interface CompetitionsMap {
  [key: string]: Competition;
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
    .find({ organizerId: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .toArray();

  // Récupérer les participations en attente
  const participationsCollection = db.collection("Participation");
  const competitionIds = competitionsData.map((comp: any) => comp._id);

  const pendingParticipationsData = await participationsCollection
    .find({
      competitionId: { $in: competitionIds },
      status: "PENDING",
    })
    .sort({ createdAt: -1 })
    .toArray();

  // Créer un map des compétitions pour faciliter l'accès
  const competitionsMap: CompetitionsMap = competitionsData.reduce(
    (acc: CompetitionsMap, comp: any) => {
      acc[comp._id.toString()] = {
        id: comp._id.toString(),
        _id: comp._id,
        title: comp.title || "Sans titre",
        status: comp.status || "DRAFT",
        teams: comp.teams || [],
        participants: comp.participants || [],
        participations: comp.participations || [],
        createdAt: comp.createdAt ? new Date(comp.createdAt) : new Date(),
        registrationDeadline: comp.registrationDeadline
          ? new Date(comp.registrationDeadline)
          : new Date(),
        startDate: comp.startDate ? new Date(comp.startDate) : new Date(),
        endDate: comp.endDate ? new Date(comp.endDate) : new Date(),
        venue: comp.venue || "",
        address: comp.address || "",
        city: comp.city || "",
        maxParticipants: comp.maxParticipants || 0,
        currentParticipants: comp.currentParticipants || 0,
        sport: comp.sport || "",
        category: comp.category || "",
        description: comp.description || "",
      };
      return acc;
    },
    {} as CompetitionsMap
  );

  // Ajouter le titre de la compétition à chaque participation
  const pendingParticipations: Participation[] = pendingParticipationsData.map(
    (p: any) => {
      const compId = p.competitionId.toString();
      return {
        id: p._id.toString(),
        _id: p._id,
        competitionId: compId,
        participantId: p.participantId.toString(),
        participantName: p.participantName || "Participant",
        participantEmail: p.participantEmail || "",
        status: p.status,
        message: p.message || "",
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        competitionTitle: competitionsMap[compId]?.title || "Compétition",
      };
    }
  );

  // Récupérer les notifications non lues
  const notificationsCollection = db.collection("Notification");
  const unreadNotifications = await notificationsCollection
    .find({
      userId: new ObjectId(userId),
      read: false,
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  // Convertir les données MongoDB en format utilisable
  const competitions: Competition[] = competitionsData.map((comp: any) => ({
    id: comp._id.toString(),
    _id: comp._id,
    title: comp.title || "Sans titre",
    status: comp.status || "DRAFT",
    teams: comp.teams || [],
    participants: comp.participants || [],
    participations: comp.participations || [],
    createdAt: comp.createdAt ? new Date(comp.createdAt) : new Date(),
    registrationDeadline: comp.registrationDeadline
      ? new Date(comp.registrationDeadline)
      : new Date(),
    startDate: comp.startDate ? new Date(comp.startDate) : new Date(),
    endDate: comp.endDate ? new Date(comp.endDate) : new Date(),
    venue: comp.venue || "",
    address: comp.address || "",
    city: comp.city || "",
    maxParticipants: comp.maxParticipants || 0,
    currentParticipants: comp.currentParticipants || 0,
    sport: comp.sport || "",
    category: comp.category || "",
    description: comp.description || "",
  }));

  // Statistiques
  const totalCompetitions = competitions.length;
  const activeCompetitions = competitions.filter(
    (comp) => comp.status === "OPEN" || comp.status === "IN_PROGRESS"
  ).length;
  const totalParticipants = competitions.reduce(
    (acc, comp) => acc + (comp.participants?.length || 0),
    0
  );
  const pendingRequests = pendingParticipations.length;
  const upcomingCompetitions = competitions.filter(
    (c) => new Date(c.startDate) > new Date()
  ).length;

  // Trier les compétitions par date de création (les plus récentes d'abord)
  const sortedCompetitions = [...competitions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Obtenir les compétitions à venir (qui n'ont pas encore commencé)
  const upcomingCompetitionsList = competitions
    .filter((c) => new Date(c.startDate) > new Date())
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {session.user.name}. Gérez vos compétitions et suivez
            leur évolution.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/organizer/participations">
            <Button
              variant="outline"
              className={`flex items-center gap-2 ${
                pendingRequests > 0 ? "border-orange-500" : ""
              }`}
            >
              <Bell
                className={`h-4 w-4 ${
                  pendingRequests > 0 ? "text-orange-500" : ""
                }`}
              />
              Demandes
              {pendingRequests > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingRequests}
                </Badge>
              )}
            </Button>
          </Link>
          <Link href="/organizer/competitions/create">
            <Button>Créer une compétition</Button>
          </Link>
        </div>
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
              Participants inscrits
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipants}</div>
            <p className="text-xs text-muted-foreground">
              Dans toutes vos compétitions
            </p>
          </CardContent>
        </Card>
        <Link href="/organizer/participations" className="block">
          <Card
            className={pendingRequests > 0 ? "border-orange-500 shadow-md" : ""}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Demandes en attente
              </CardTitle>
              <Activity
                className={`h-4 w-4 ${
                  pendingRequests > 0
                    ? "text-orange-500"
                    : "text-muted-foreground"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  pendingRequests > 0 ? "text-orange-500" : ""
                }`}
              >
                {pendingRequests}
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingRequests > 0
                  ? "Demandes à traiter"
                  : "Aucune demande en attente"}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Prochains événements
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCompetitions}</div>
            <p className="text-xs text-muted-foreground">
              Compétitions à venir
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Vos compétitions</CardTitle>
            <CardDescription>
              Toutes vos compétitions organisées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedCompetitions.length > 0 ? (
              <div className="space-y-4">
                {sortedCompetitions.map((competition) => (
                  <div
                    key={competition.id}
                    className="flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium leading-none">
                          {competition.title}
                        </p>
                        <Badge
                          variant={
                            competition.status === "OPEN"
                              ? "success"
                              : competition.status === "IN_PROGRESS"
                              ? "default"
                              : competition.status === "COMPLETED"
                              ? "outline"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {competition.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {competition.participants?.length || 0} participants •{" "}
                        {competition.sport} •{" "}
                        {new Date(competition.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Link href={`/organizer/competitions/${competition.id}`}>
                      <Button variant="outline" size="sm">
                        Gérer
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Demandes de participation</CardTitle>
              <CardDescription>
                Demandes en attente de validation
              </CardDescription>
            </div>
            {pendingRequests > 0 && (
              <Link href="/organizer/participations">
                <Button variant="outline" size="sm">
                  Voir tout
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {pendingRequests > 0 ? (
              <div className="space-y-4">
                {pendingParticipations.slice(0, 5).map((participation) => (
                  <div
                    key={participation.id}
                    className="flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {participation.participantName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {participation.competitionTitle} •{" "}
                        {formatDistanceToNow(
                          new Date(participation.createdAt),
                          { addSuffix: true, locale: fr }
                        )}
                      </p>
                    </div>
                    <Link
                      href={`/organizer/participations/${participation.id}`}
                    >
                      <Button variant="outline" size="sm">
                        Gérer
                      </Button>
                    </Link>
                  </div>
                ))}
                {pendingRequests > 5 && (
                  <div className="mt-2 text-center">
                    <Link href="/organizer/participations">
                      <Button variant="link" size="sm">
                        Voir les {pendingRequests - 5} autres demandes
                      </Button>
                    </Link>
                  </div>
                )}
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

      {upcomingCompetitionsList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prochaines compétitions</CardTitle>
            <CardDescription>Vos compétitions à venir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingCompetitionsList.map((competition) => (
                <Card key={competition.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">
                      {competition.title}
                    </CardTitle>
                    <CardDescription>
                      {competition.sport} • {competition.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <CalendarDays className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {new Date(
                              competition.startDate
                            ).toLocaleDateString()}{" "}
                            -{" "}
                            {new Date(competition.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(competition.startDate),
                              { addSuffix: true, locale: fr }
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <div>
                          <p>
                            {competition.currentParticipants} /{" "}
                            {competition.maxParticipants} participants
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Trophy className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <div>
                          <p>{competition.venue}</p>
                          <p className="text-muted-foreground">
                            {competition.city}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link href={`/organizer/competitions/${competition.id}`}>
                        <Button variant="outline" className="w-full">
                          Gérer
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
