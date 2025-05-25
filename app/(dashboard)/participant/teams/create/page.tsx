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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, Trophy, Users } from "lucide-react";
import Link from "next/link";

const teamSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  competitionId: z.string().min(1, "Veuillez sélectionner une compétition"),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional(),
  colors: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Couleur invalide")
    .optional(),
});

interface Competition {
  id: string;
  title: string;
  category: string;
  city: string;
  status: string;
}

export default function CreateTeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCompetitionId = searchParams.get("competitionId");

  const [isLoading, setIsLoading] = useState(false);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loadingCompetitions, setLoadingCompetitions] = useState(true);

  const form = useForm<z.infer<typeof teamSchema>>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      competitionId: preselectedCompetitionId || "",
      description: "",
      colors: "#3B82F6",
    },
  });

  useEffect(() => {
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    try {
      setLoadingCompetitions(true);
      console.log("🔍 Chargement des compétitions...");

      const response = await fetch("/api/competitions");
      console.log("🔍 Réponse API:", response.status, response.statusText);

      const data = await response.json();
      console.log("🔍 Données reçues:", data);

      if (response.ok) {
        // Filtrer les compétitions où l'utilisateur peut créer une équipe
        const availableCompetitions = data.competitions.filter(
          (comp: any) => comp.status === "OPEN"
        );
        console.log(
          "🔍 Compétitions disponibles:",
          availableCompetitions.length
        );
        setCompetitions(availableCompetitions);
      } else {
        console.error("❌ Erreur API:", data.error);
        toast({
          title: "Erreur",
          description: data.error || "Impossible de charger les compétitions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement des compétitions:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement",
        variant: "destructive",
      });
    } finally {
      setLoadingCompetitions(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof teamSchema>) => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Équipe créée !",
          description: `L'équipe "${values.name}" a été créée avec succès`,
        });

        router.push(`/participant/teams/${data.team.id}`);
      } else {
        toast({
          title: "Erreur",
          description:
            data.error ||
            "Une erreur est survenue lors de la création de l'équipe",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la création de l'équipe:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingCompetitions) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/participant/teams">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Créer une équipe
          </h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/participant/teams">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Créer une équipe
          </h1>
          <p className="text-muted-foreground">
            Créez votre équipe pour participer à une compétition
          </p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'équipe</CardTitle>
              <CardDescription>
                Remplissez les informations de base de votre équipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="competitionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compétition</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez une compétition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {competitions.map((competition) => (
                              <SelectItem
                                key={competition.id}
                                value={competition.id}
                              >
                                <div className="flex items-center gap-2">
                                  <Trophy className="h-4 w-4" />
                                  <span>{competition.title}</span>
                                  <span className="text-muted-foreground">
                                    • {competition.city}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choisissez la compétition pour laquelle vous voulez
                          créer cette équipe
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de l'équipe</FormLabel>
                        <FormControl>
                          <Input placeholder="Les Champions" {...field} />
                        </FormControl>
                        <FormDescription>
                          Le nom de votre équipe (2-50 caractères)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (optionnel)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Décrivez votre équipe, votre style de jeu, vos objectifs..."
                            {...field}
                            rows={4}
                          />
                        </FormControl>
                        <FormDescription>
                          Une description de votre équipe (max 500 caractères)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="colors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Couleur de l'équipe</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-3">
                            <Input
                              type="color"
                              {...field}
                              className="w-16 h-10 p-1 border rounded"
                            />
                            <Input
                              placeholder="#3B82F6"
                              value={field.value}
                              onChange={field.onChange}
                              className="flex-1"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Choisissez la couleur principale de votre équipe
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        <>
                          <Users className="mr-2 h-4 w-4" />
                          Créer l'équipe
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <Link href="/participant/teams">Annuler</Link>
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Aperçu</CardTitle>
              <CardDescription>
                Voici à quoi ressemblera votre équipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{
                      backgroundColor: form.watch("colors") || "#3B82F6",
                    }}
                  >
                    {form.watch("name")?.charAt(0)?.toUpperCase() || "E"}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {form.watch("name") || "Nom de l'équipe"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {competitions.find(
                        (c) => c.id === form.watch("competitionId")
                      )?.title || "Compétition"}
                    </p>
                  </div>
                </div>

                {form.watch("description") && (
                  <div>
                    <p className="text-sm font-medium mb-1">Description :</p>
                    <p className="text-sm text-muted-foreground">
                      {form.watch("description")}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Après la création, vous pourrez ajouter des joueurs à votre
                    équipe.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
