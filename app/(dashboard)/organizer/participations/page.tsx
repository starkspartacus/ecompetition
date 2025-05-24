import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// Interface pour la participation
interface Participation {
  id: string;
  competitionId: string;
  participantId: string;
  participantName: string;
  participantEmail: string;
  status: string;
  message: string;
  createdAt: Date;
  competitionTitle: string;
}

// Interface pour la map des compétitions
interface CompetitionsMap {
  [key: string]: {
    title: string;
    sport: string;
    category: string;
  };
}

export default async function ParticipationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ORGANIZER") {
    redirect("/signin");
  }

  const db = await getDb();
  const organizerId = session.user.id;

  // Récupérer les compétitions de l'organisateur
  const competitionsCollection = db.collection("Competition");
  const competitionsData = await competitionsCollection
    .find({ organizerId: new ObjectId(organizerId) })
    .project({ _id: 1, title: 1, sport: 1, category: 1 })
    .toArray();

  // Créer un map des compétitions pour faciliter l'accès
  const competitionsMap: CompetitionsMap = competitionsData.reduce(
    (acc, comp) => {
      acc[comp._id.toString()] = {
        title: comp.title || "Sans titre",
        sport: comp.sport || "",
        category: comp.category || "",
      };
      return acc;
    },
    {} as CompetitionsMap
  );

  // Récupérer les participations
  const participationsCollection = db.collection("Participation");
  const competitionIds = competitionsData.map((comp) => comp._id);

  const allParticipationsData = await participationsCollection
    .find({
      competitionId: { $in: competitionIds },
    })
    .sort({ createdAt: -1 })
    .toArray();

  // Convertir les données MongoDB en format utilisable
  const allParticipations: Participation[] = allParticipationsData.map((p) => {
    const compId = p.competitionId.toString();
    return {
      id: p._id.toString(),
      competitionId: compId,
      participantId: p.participantId.toString(),
      participantName: p.participantName || "Participant",
      participantEmail: p.participantEmail || "",
      status: p.status,
      message: p.message || "",
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      competitionTitle: competitionsMap[compId]?.title || "Compétition",
    };
  });

  // Filtrer les participations par statut
  const pendingParticipations = allParticipations.filter(
    (p) => p.status === "PENDING"
  );
  const approvedParticipations = allParticipations.filter(
    (p) => p.status === "APPROVED"
  );
  const rejectedParticipations = allParticipations.filter(
    (p) => p.status === "REJECTED"
  );

  // Fonction pour afficher une liste de participations
  const renderParticipationsList = (participations: Participation[]) => {
    if (participations.length === 0) {
      return (
        <div className="flex items-center justify-center py-8 text-center">
          <p className="text-muted-foreground">Aucune demande trouvée</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {participations.map((participation) => (
          <Card key={participation.id} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {participation.participantName}
                </CardTitle>
                <Badge
                  variant={
                    participation.status === "PENDING"
                      ? "outline"
                      : participation.status === "APPROVED"
                      ? "success"
                      : "destructive"
                  }
                >
                  {participation.status}
                </Badge>
              </div>
              <CardDescription>
                {participation.competitionTitle} •{" "}
                {formatDistanceToNow(new Date(participation.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {participation.message && (
                <div className="mb-4 rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium">Message du participant:</p>
                  <p className="mt-1">{participation.message}</p>
                </div>
              )}
              <div className="flex justify-end">
                <Link href={`/organizer/participations/${participation.id}`}>
                  <Button variant="outline" size="sm">
                    {participation.status === "PENDING" ? "Gérer" : "Détails"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Demandes de participation
          </h1>
          <p className="text-muted-foreground">
            Gérez les demandes de participation à vos compétitions
          </p>
        </div>
        <Link href="/organizer/dashboard">
          <Button variant="outline">Retour au tableau de bord</Button>
        </Link>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="relative">
            En attente
            {pendingParticipations.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingParticipations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approuvées
            {approvedParticipations.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {approvedParticipations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Refusées
            {rejectedParticipations.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {rejectedParticipations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6">
          {renderParticipationsList(pendingParticipations)}
        </TabsContent>
        <TabsContent value="approved" className="mt-6">
          {renderParticipationsList(approvedParticipations)}
        </TabsContent>
        <TabsContent value="rejected" className="mt-6">
          {renderParticipationsList(rejectedParticipations)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
