"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Users,
  Plus,
  Edit,
  Trash2,
  Trophy,
  User,
  Loader2,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddPlayerDialog } from "@/components/add-player-dialog";
import { EditPlayerDialog } from "@/components/edit-player-dialog";

interface Player {
  id: string;
  name: string;
  age: number;
  position: string;
  number: number | null;
  photoUrl: string | null;
}

interface Team {
  id: string;
  name: string;
  description: string;
  logoUrl: string | null;
  colors: string;
  competitionId: string;
  competition: {
    id: string;
    title: string;
    category: string;
    status: string;
  } | null;
  ownerId: string;
  owner: {
    id: string;
    name: string;
    email: string;
  } | null;
  players: Player[];
  playersCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [editPlayerOpen, setEditPlayerOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [deletePlayerLoading, setDeletePlayerLoading] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadTeam();
  }, [teamId]);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teams/${teamId}`);
      const data = await response.json();

      if (response.ok) {
        setTeam(data.team);
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Impossible de charger l'équipe",
          variant: "destructive",
        });
        router.push("/participant/teams");
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'équipe:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerAdded = () => {
    setAddPlayerOpen(false);
    loadTeam();
  };

  const handlePlayerUpdated = () => {
    setEditPlayerOpen(false);
    setSelectedPlayer(null);
    loadTeam();
  };

  const handleEditPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setEditPlayerOpen(true);
  };

  const handleDeletePlayer = async (playerId: string) => {
    try {
      setDeletePlayerLoading(playerId);
      const response = await fetch(`/api/players/${playerId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Joueur supprimé",
          description: "Le joueur a été supprimé avec succès",
        });
        loadTeam();
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Impossible de supprimer le joueur",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du joueur:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setDeletePlayerLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/participant/teams">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Chargement...</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/participant/teams">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Équipe non trouvée
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/participant/teams">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center space-x-3">
            {team.logoUrl ? (
              <img
                src={team.logoUrl || "/placeholder.svg"}
                alt={team.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: team.colors }}
              >
                {team.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
              <p className="text-muted-foreground flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                {team.competition?.title || "Compétition"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/participant/teams/${team.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
          <Button onClick={() => setAddPlayerOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un joueur
          </Button>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Informations de l'équipe */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'équipe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {team.description && (
                <div>
                  <p className="text-sm font-medium mb-1">Description :</p>
                  <p className="text-sm text-muted-foreground">
                    {team.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Compétition :</p>
                  <p className="text-sm text-muted-foreground">
                    {team.competition?.title}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Catégorie :</p>
                  <p className="text-sm text-muted-foreground">
                    {team.competition?.category}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">
                    Nombre de joueurs :
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {team.playersCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Créée le :</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(team.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des joueurs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Joueurs ({team.playersCount})
                </CardTitle>
                <Button size="sm" onClick={() => setAddPlayerOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {team.players.length === 0 ? (
                <div className="text-center py-8">
                  <User className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Aucun joueur</h3>
                  <p className="mt-2 text-muted-foreground">
                    Ajoutez des joueurs à votre équipe pour commencer.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setAddPlayerOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter le premier joueur
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {team.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center space-x-3">
                        {player.photoUrl ? (
                          <img
                            src={player.photoUrl || "/placeholder.svg"}
                            alt={player.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{player.name}</p>
                            {player.number && (
                              <Badge variant="outline" className="text-xs">
                                #{player.number}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {player.age} ans
                            {player.position && ` • ${player.position}`}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditPlayer(player)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeletePlayer(player.id)}
                            className="text-red-600"
                            disabled={deletePlayerLoading === player.id}
                          >
                            {deletePlayerLoading === player.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Joueurs</span>
                <Badge variant="outline">{team.playersCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Statut</span>
                <Badge
                  variant={
                    team.competition?.status === "OPEN"
                      ? "default"
                      : "secondary"
                  }
                >
                  {team.competition?.status === "OPEN" ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/participant/teams/${team.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier l'équipe
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setAddPlayerOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un joueur
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/participant/competitions/${team.competitionId}`}>
                  <Trophy className="mr-2 h-4 w-4" />
                  Voir la compétition
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <AddPlayerDialog
        open={addPlayerOpen}
        onOpenChange={setAddPlayerOpen}
        teamId={team.id}
        onPlayerAdded={handlePlayerAdded}
      />

      {selectedPlayer && (
        <EditPlayerDialog
          open={editPlayerOpen}
          onOpenChange={setEditPlayerOpen}
          player={selectedPlayer}
          onPlayerUpdated={handlePlayerUpdated}
        />
      )}
    </div>
  );
}
