"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  User,
  Loader2,
  CheckCircle,
  AlertCircle,
  Search,
} from "lucide-react";

const joinSchema = z.object({
  code: z
    .string()
    .min(1, "Le code est requis")
    .max(8, "Le code ne peut pas dépasser 8 caractères"),
  message: z.string().optional(),
});

interface Competition {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxParticipants: number;
  currentParticipants: number;
  venue: string;
  city: string;
  country: string;
  uniqueCode: string;
  organizerName: string;
}

export default function JoinCompetitionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const competitionId = searchParams.get("id");

  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const form = useForm<z.infer<typeof joinSchema>>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      code: "",
      message: "",
    },
  });

  // Charger la compétition si un ID est fourni dans l'URL
  useEffect(() => {
    if (competitionId) {
      loadCompetitionById(competitionId);
    }
  }, [competitionId]);

  const loadCompetitionById = async (id: string) => {
    try {
      setIsLoading(true);
      console.log("🔍 Chargement de la compétition:", id);

      const response = await fetch(`/api/competitions/public?id=${id}`);
      const data = await response.json();

      if (response.ok && data.competitions && data.competitions.length > 0) {
        const comp = data.competitions[0];
        setCompetition(comp);
        form.setValue("code", comp.uniqueCode || "");
        console.log("✅ Compétition chargée:", comp.title);
      } else {
        console.log("❌ Compétition non trouvée");
        toast({
          title: "Compétition non trouvée",
          description:
            "La compétition demandée n'existe pas ou n'est plus disponible",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la compétition",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchCompetition = async (code: string) => {
    try {
      setIsSearching(true);
      console.log("🔍 Recherche avec le code:", code);

      const response = await fetch(`/api/competitions?code=${code}`);
      const data = await response.json();

      if (response.ok && data.competitions && data.competitions.length > 0) {
        const comp = data.competitions[0];
        setCompetition(comp);
        console.log("✅ Compétition trouvée:", comp.title);

        toast({
          title: "Compétition trouvée !",
          description: `${comp.title} - ${comp.organizerName}`,
        });
      } else {
        console.log("❌ Aucune compétition trouvée avec ce code");
        setCompetition(null);
        toast({
          title: "Aucune compétition trouvée",
          description: "Vérifiez le code et réessayez",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("❌ Erreur lors de la recherche:", error);
      toast({
        title: "Erreur",
        description:
          error.message || "Une erreur est survenue lors de la recherche",
        variant: "destructive",
      });
      setCompetition(null);
    } finally {
      setIsSearching(false);
    }
  };

  const joinCompetition = async () => {
    if (!competition) return;

    try {
      setIsJoining(true);
      console.log("🎯 Demande de participation pour:", competition.id);

      const response = await fetch("/api/competitions/participate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          competitionId: competition.id,
          uniqueCode: competition.uniqueCode,
          message: form.getValues("message") || "",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Demande envoyée avec succès");
        toast({
          title: "Demande envoyée !",
          description:
            "Votre demande de participation a été envoyée à l'organisateur",
        });

        // Rediriger vers la page des compétitions du participant
        setTimeout(() => {
          router.push("/participant/competitions");
        }, 2000);
      } else {
        console.log("❌ Erreur lors de la demande:", data.error);
        toast({
          title: "Erreur",
          description:
            data.error ||
            "Une erreur est survenue lors de la demande de participation",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("❌ Erreur lors de la demande de participation:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur inattendue est survenue",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof joinSchema>) => {
    if (!competition) {
      await searchCompetition(values.code);
    } else {
      await joinCompetition();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            Inscriptions ouvertes
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600">
            Inscriptions fermées
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">En cours</Badge>
        );
      case "COMPLETED":
        return <Badge className="bg-gray-500 hover:bg-gray-600">Terminé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canJoin =
    competition &&
    competition.status === "OPEN" &&
    new Date(competition.registrationDeadline) > new Date() &&
    competition.currentParticipants < competition.maxParticipants;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Rejoindre une compétition
          </h1>
          <p className="text-muted-foreground">
            Chargement des détails de la compétition...
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Rejoindre une compétition
        </h1>
        <p className="text-muted-foreground">
          Entrez le code unique fourni par l'organisateur pour rejoindre une
          compétition
        </p>
      </div>
      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire de recherche */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Rechercher une compétition
              </CardTitle>
              <CardDescription>
                Utilisez le code fourni par l'organisateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code de la compétition</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ABC123XY"
                            {...field}
                            className="uppercase"
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Code à 8 caractères fourni par l'organisateur
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {competition && (
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Message pour l'organisateur (optionnel)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Présentez-vous ou ajoutez un message pour l'organisateur..."
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormDescription>
                            Ce message sera visible par l'organisateur
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button
                    type="submit"
                    disabled={isSearching || isJoining}
                    className="w-full"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Recherche...
                      </>
                    ) : isJoining ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi de la demande...
                      </>
                    ) : !competition ? (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Rechercher
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Demander à participer
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Détails de la compétition */}
        <div>
          {competition ? (
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {competition.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <User className="h-4 w-4" />
                      Organisé par {competition.organizerName}
                    </CardDescription>
                  </div>
                  {getStatusBadge(competition.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Description
                  </p>
                  <p className="text-sm">{competition.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Catégorie</p>
                      <p className="text-sm font-medium">
                        {competition.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Lieu</p>
                      <p className="text-sm font-medium">{competition.venue}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Date de début
                      </p>
                      <p className="text-sm font-medium">
                        {formatDate(competition.startDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Date limite d'inscription
                      </p>
                      <p className="text-sm font-medium">
                        {formatDate(competition.registrationDeadline)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      Participants
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {competition.currentParticipants} /{" "}
                        {competition.maxParticipants}
                      </p>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{
                            width: `${Math.min(
                              (competition.currentParticipants /
                                competition.maxParticipants) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {!canJoin && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      {competition.status !== "OPEN"
                        ? "Les inscriptions ne sont pas ouvertes"
                        : new Date(competition.registrationDeadline) <=
                          new Date()
                        ? "La date limite d'inscription est dépassée"
                        : "Le nombre maximum de participants est atteint"}
                    </p>
                  </div>
                )}

                {canJoin && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Vous pouvez demander à participer à cette compétition
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <div className="text-center">
                <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Les détails de la compétition s'afficheront ici après la
                  recherche
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
