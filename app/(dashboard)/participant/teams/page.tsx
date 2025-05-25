import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Plus, Trophy, MapPin, Edit, Eye } from "lucide-react";

async function getParticipantTeams(userId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/teams`,
      {
        headers: {
          Cookie: `next-auth.session-token=${userId}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.teams || [];
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des équipes:", error);
  }

  return [];
}

async function getParticipantCompetitions(userId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/competitions`,
      {
        headers: {
          Cookie: `next-auth.session-token=${userId}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.competitions || [];
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des compétitions:", error);
  }

  return [];
}

export default async function ParticipantTeamsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "PARTICIPANT") {
    redirect("/signin");
  }

  const teams = await getParticipantTeams(session.user.id);
  const competitions = await getParticipantCompetitions(session.user.id);

  // Filtrer les compétitions où le participant peut créer une équipe
  const availableCompetitions = competitions.filter((comp: any) => {
    // Vérifier qu'il n'a pas déjà une équipe dans cette compétition
    const hasTeam = teams.some((team: any) => team.competitionId === comp.id);
    return !hasTeam && comp.status === "OPEN";
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes équipes</h1>
          <p className="text-muted-foreground">
            Gérez vos équipes et vos joueurs
          </p>
        </div>
        {availableCompetitions.length > 0 && (
          <Button asChild>
            <Link href="/participant/teams/create">
              <Plus className="mr-2 h-4 w-4" />
              Créer une équipe
            </Link>
          </Button>
        )}
      </div>

      <Separator />

      {teams.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aucune équipe</h3>
          <p className="mt-2 text-muted-foreground">
            Vous n'avez pas encore créé d'équipe. Créez votre première équipe
            pour commencer.
          </p>
          {availableCompetitions.length > 0 ? (
            <Button asChild className="mt-4">
              <Link href="/participant/teams/create">
                <Plus className="mr-2 h-4 w-4" />
                Créer ma première équipe
              </Link>
            </Button>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Vous devez d'abord être accepté dans une compétition pour créer
              une équipe.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team: any) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl || "/placeholder.svg"}
                        alt={team.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: team.colors }}
                      >
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        {team.competitionName}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {team.playersCount}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {team.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {team.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/participant/teams/${team.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/participant/teams/${team.id}/edit`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Link>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Créée le {new Date(team.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {availableCompetitions.length > 0 && teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Créer une nouvelle équipe</CardTitle>
            <CardDescription>
              Vous pouvez créer des équipes pour les compétitions suivantes :
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {availableCompetitions.map((comp: any) => (
                <div
                  key={comp.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{comp.title}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {comp.city}
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <Link
                      href={`/participant/teams/create?competitionId=${comp.id}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
