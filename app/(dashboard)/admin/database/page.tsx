"use client";

import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Database,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Users,
  Trophy,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

interface DatabaseHealth {
  status: "healthy" | "unhealthy";
  collections: Record<string, { count: number; indexes: number }>;
  errors: string[];
}

interface DatabaseStats {
  users: { total: number; recent: number };
  competitions: { total: number; active: number };
  teams: { total: number; active: number };
  matches: { total: number; upcoming: number };
}

export default function DatabaseAdminPage() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  const checkDatabaseHealth = async () => {
    setIsChecking(true);
    try {
      const response = await fetch("/api/admin/init-database");
      const data = await response.json();

      if (response.ok) {
        setHealth(data.health);
        setStats(data.stats);
        setLastCheck(data.timestamp);
        toast.success("État de la base de données vérifié");
      } else {
        toast.error(data.error || "Erreur lors de la vérification");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
      console.error(error);
    } finally {
      setIsChecking(false);
    }
  };

  const initializeDatabase = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch("/api/admin/init-database", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        setHealth(data.health);
        toast.success("Base de données initialisée avec succès");
        await checkDatabaseHealth();
      } else {
        toast.error(data.error || "Erreur lors de l'initialisation");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
      console.error(error);
    } finally {
      setIsInitializing(false);
    }
  };

  const cleanupDatabase = async () => {
    setIsCleaning(true);
    try {
      const response = await fetch("/api/admin/cleanup-database", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Nettoyage effectué avec succès");
        await checkDatabaseHealth();
      } else {
        toast.error(data.error || "Erreur lors du nettoyage");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
      console.error(error);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            Administration Base de Données
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestion et maintenance de la base de données MongoDB
          </p>
        </div>

        <Button
          onClick={checkDatabaseHealth}
          disabled={isChecking}
          variant="outline"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isChecking ? "animate-spin" : ""}`}
          />
          Vérifier l'état
        </Button>
      </div>

      {/* Actions principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Initialisation
            </CardTitle>
            <CardDescription>
              Créer les collections et index MongoDB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={initializeDatabase}
              disabled={isInitializing}
              className="w-full"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  isInitializing ? "animate-spin" : ""
                }`}
              />
              {isInitializing ? "Initialisation..." : "Initialiser la base"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Nettoyage
            </CardTitle>
            <CardDescription>Supprimer les données expirées</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={cleanupDatabase}
              disabled={isCleaning}
              variant="outline"
              className="w-full"
            >
              <Trash2
                className={`h-4 w-4 mr-2 ${isCleaning ? "animate-spin" : ""}`}
              />
              {isCleaning ? "Nettoyage..." : "Nettoyer la base"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* État de la base de données */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {health.status === "healthy" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              État de la base de données
            </CardTitle>
            <CardDescription>
              {lastCheck &&
                `Dernière vérification: ${new Date(
                  lastCheck
                ).toLocaleString()}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  health.status === "healthy" ? "default" : "destructive"
                }
              >
                {health.status === "healthy" ? "Saine" : "Problème détecté"}
              </Badge>
            </div>

            {health.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {health.errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(health.collections).map(([name, info]) => (
                <Card key={name} className="p-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{name}</h4>
                    <Badge variant="outline">{info.count} docs</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {info.indexes} index
                  </p>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques globales */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Statistiques globales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Utilisateurs
                    </p>
                    <p className="text-2xl font-bold">{stats.users.total}</p>
                    <p className="text-xs text-green-600">
                      +{stats.users.recent} ce mois
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Compétitions
                    </p>
                    <p className="text-2xl font-bold">
                      {stats.competitions.total}
                    </p>
                    <p className="text-xs text-green-600">
                      {stats.competitions.active} actives
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Équipes</p>
                    <p className="text-2xl font-bold">{stats.teams.total}</p>
                    <p className="text-xs text-green-600">
                      {stats.teams.active} actives
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Matchs</p>
                    <p className="text-2xl font-bold">{stats.matches.total}</p>
                    <p className="text-xs text-blue-600">
                      {stats.matches.upcoming} à venir
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">
              Initialisation de la base de données
            </h4>
            <p className="text-sm text-muted-foreground">
              Crée toutes les collections MongoDB nécessaires et leurs index
              optimisés. À exécuter lors du premier déploiement ou après des
              modifications de schéma.
            </p>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">
              Nettoyage de la base de données
            </h4>
            <p className="text-sm text-muted-foreground">
              Supprime les sessions expirées, tokens de vérification obsolètes
              et anciennes notifications. Recommandé d'exécuter régulièrement
              pour maintenir les performances.
            </p>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Via ligne de commande</h4>
            <code className="text-sm bg-muted p-2 rounded block">
              node scripts/init-database.js
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
