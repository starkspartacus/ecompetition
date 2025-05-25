"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  MapPin,
  Users,
  Trophy,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface Tournament {
  id: string;
  title: string;
  category: string;
  location: string;
  venue: string;
  startDate: string | null;
  registrationDeadline: string;
  maxParticipants: number;
  currentParticipants: number;
  organizer: string;
  status: string;
  daysUntilStart: number | null;
  isUpcoming: boolean;
  isOpen: boolean;
  imageUrl?: string | null;
  bannerUrl?: string | null;
}

export function UpcomingTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchTournaments = async () => {
    try {
      setError(null);
      const response = await fetch("/api/competitions/upcoming");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des tournois");
      }
      const data = await response.json();
      // Ensure data is an array
      const tournamentsData = Array.isArray(data)
        ? data
        : data?.competitions || data?.tournaments || [];
      setTournaments(tournamentsData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();

    // Actualisation automatique toutes les 30 secondes
    const interval = setInterval(fetchTournaments, 30000);

    return () => clearInterval(interval);
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "football":
        return "⚽";
      case "basketball":
        return "🏀";
      case "volleyball":
        return "🏐";
      case "handball":
        return "🤾";
      case "tennis":
        return "🎾";
      case "maracana":
        return "🏟️";
      default:
        return "🏆";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Date à définir";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Prochains tournois</h3>
          <div className="flex items-center gap-2 text-white/70">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm">En direct</span>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card
              key={i}
              className="bg-white/10 backdrop-blur-sm border-white/20"
            >
              <CardHeader>
                <Skeleton className="h-5 w-3/4 bg-white/20" />
                <Skeleton className="h-4 w-1/2 bg-white/20" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-white/20" />
                  <Skeleton className="h-4 w-2/3 bg-white/20" />
                  <Skeleton className="h-6 w-1/3 bg-white/20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Prochains tournois</h3>
          <Button
            onClick={fetchTournaments}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </div>
        <Card className="bg-red-500/10 backdrop-blur-sm border-red-500/20">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-red-400 font-medium text-sm">
                Erreur de chargement
              </p>
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Prochains tournois</h3>
        <div className="flex items-center gap-2 text-white/70">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs">
            {lastUpdate.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {Array.isArray(tournaments) && tournaments.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Trophy className="w-10 h-10 text-white/50 mb-3" />
            <p className="text-white/70 text-sm mb-2">Aucun tournoi à venir</p>
            <p className="text-white/50 text-xs mb-3">
              Soyez le premier à organiser un tournoi !
            </p>
            <Link href="/signup?role=organizer">
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Créer un tournoi
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 space-y-3">
          {Array.isArray(tournaments) &&
            tournaments.map((tournament) => (
              <Card
                key={tournament.id}
                className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getCategoryIcon(tournament.category)}
                      </span>
                      <div>
                        <CardTitle className="text-white text-sm leading-tight">
                          {tournament.title}
                        </CardTitle>
                        <p className="text-white/70 text-xs">
                          {tournament.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {tournament.isUpcoming && (
                        <Badge className="bg-orange-500 text-white animate-pulse text-xs px-2 py-0.5">
                          {tournament.daysUntilStart === 1
                            ? "Demain"
                            : `${tournament.daysUntilStart}j`}
                        </Badge>
                      )}
                      {tournament.isOpen && (
                        <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
                          Ouvert
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-white/80">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{tournament.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <CalendarDays className="w-3 h-3" />
                      <span>{formatDate(tournament.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Users className="w-3 h-3" />
                      <span>
                        {tournament.currentParticipants}/
                        {tournament.maxParticipants}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-white/60 text-xs">
                      Par {tournament.organizer}
                    </span>
                    {tournament.isOpen && (
                      <Link href={`/participant/competitions/${tournament.id}`}>
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white h-6 px-2 text-xs"
                        >
                          Participer
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <div className="text-center pt-2">
        <Link href="/participant/competitions/browse">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
          >
            Voir tous les tournois
          </Button>
        </Link>
      </div>
    </div>
  );
}
