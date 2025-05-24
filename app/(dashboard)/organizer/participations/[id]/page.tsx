import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ParticipationActions } from "./participation-actions";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, Mail, MessageSquare, User } from "lucide-react";

export default async function ParticipationDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ORGANIZER") {
    redirect("/signin");
  }

  const db = await getDb();
  const participationsCollection = db.collection("Participation");

  // Récupérer la participation
  const participation = await participationsCollection.findOne({
    _id: new ObjectId(params.id),
  });

  if (!participation) {
    notFound();
  }

  // Récupérer la compétition
  const competitionsCollection = db.collection("Competition");
  const competition = await competitionsCollection.findOne({
    _id: new ObjectId(participation.competitionId),
  });

  if (!competition) {
    notFound();
  }

  // Vérifier que l'organisateur est bien le propriétaire de la compétition
  if (competition.organizerId.toString() !== session.user.id) {
    redirect("/organizer/dashboard");
  }

  // Récupérer les informations du participant
  const usersCollection = db.collection("User");
  const participant = await usersCollection.findOne({
    _id: new ObjectId(participation.participantId),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Détails de la demande
          </h1>
          <p className="text-muted-foreground">
            Demande de participation de{" "}
            {participation.participantName || "Participant"}
          </p>
        </div>
        <Link href="/organizer/participations">
          <Button variant="outline">Retour aux demandes</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations sur la demande</CardTitle>
            <CardDescription>
              Détails de la demande de participation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Statut</span>
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
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Date de demande</span>
                <span className="text-sm">
                  {new Date(participation.createdAt).toLocaleDateString()} (
                  {formatDistanceToNow(new Date(participation.createdAt), {
                    addSuffix: true,
                    locale: fr,
                  })}
                  )
                </span>
              </div>
              {participation.approvedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Date d'approbation
                  </span>
                  <span className="text-sm">
                    {new Date(participation.approvedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {participation.rejectedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Date de refus</span>
                  <span className="text-sm">
                    {new Date(participation.rejectedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {participation.message && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Message du participant
                    </span>
                  </div>
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <p>{participation.message}</p>
                  </div>
                </div>
              )}
            </div>

            {participation.status === "PENDING" && (
              <div className="mt-6">
                <ParticipationActions
                  participationId={params.id}
                  competitionId={participation.competitionId.toString()}
                  participantId={participation.participantId.toString()}
                  participantName={
                    participation.participantName || "Participant"
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations sur le participant</CardTitle>
              <CardDescription>Détails du participant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {participation.participantName}
                    </p>
                    {participant && (
                      <p className="text-sm text-muted-foreground">
                        {participant.firstName} {participant.lastName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p>{participation.participantEmail}</p>
                  </div>
                </div>
                {participant && participant.phone && (
                  <div className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 h-5 w-5 text-muted-foreground"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <div>
                      <p>{participant.phone}</p>
                    </div>
                  </div>
                )}
                {participant && participant.createdAt && (
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm">
                        Membre depuis{" "}
                        {new Date(participant.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations sur la compétition</CardTitle>
              <CardDescription>Détails de la compétition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{competition.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {competition.sport} • {competition.category}
                  </p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Date de début</p>
                    <p className="text-sm">
                      {new Date(competition.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date de fin</p>
                    <p className="text-sm">
                      {new Date(competition.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Lieu</p>
                    <p className="text-sm">{competition.venue}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Ville</p>
                    <p className="text-sm">{competition.city}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <Link href={`/organizer/competitions/${competition._id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Voir la compétition
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
