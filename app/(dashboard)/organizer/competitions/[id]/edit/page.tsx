"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarIcon,
  Trophy,
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COMPETITION_RULES } from "@/constants/competition-rules";

// Schéma de validation pour le formulaire
const formSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z
    .string()
    .min(10, "La description doit contenir au moins 10 caractères"),
  category: z.string().min(1, "Veuillez sélectionner une catégorie"),
  location: z.string().min(3, "Le lieu doit contenir au moins 3 caractères"),
  startDate: z.date({
    required_error: "Veuillez sélectionner une date de début",
  }),
  endDate: z.date({ required_error: "Veuillez sélectionner une date de fin" }),
  registrationStartDate: z.date({
    required_error: "Veuillez sélectionner une date de début d'inscription",
  }),
  registrationEndDate: z.date({
    required_error: "Veuillez sélectionner une date de fin d'inscription",
  }),
  maxParticipants: z.coerce
    .number()
    .min(1, "Le nombre maximum de participants doit être au moins 1"),
  status: z.string().min(1, "Veuillez sélectionner un statut"),
  isPublic: z.boolean(),
  rules: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditCompetitionPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [competition, setCompetition] = useState<any>(null);

  // Initialiser le formulaire
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      location: "",
      startDate: new Date(),
      endDate: new Date(),
      registrationStartDate: new Date(),
      registrationEndDate: new Date(),
      maxParticipants: 10,
      status: "DRAFT",
      isPublic: true,
      rules: [],
    },
  });

  // Récupérer les données de la compétition
  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/competitions/${id}`);

        if (!response.ok) {
          throw new Error(
            `Erreur ${response.status}: ${await response.text()}`
          );
        }

        const data = await response.json();
        setCompetition(data.competition);

        // Préparer les données pour le formulaire
        const formData = {
          ...data.competition,
          startDate: data.competition.startDate
            ? new Date(data.competition.startDate)
            : new Date(),
          endDate: data.competition.endDate
            ? new Date(data.competition.endDate)
            : new Date(),
          registrationStartDate: data.competition.registrationStartDate
            ? new Date(data.competition.registrationStartDate)
            : new Date(),
          registrationEndDate: data.competition.registrationEndDate
            ? new Date(data.competition.registrationEndDate)
            : new Date(),
          rules: data.competition.rules || [],
        };

        // Mettre à jour les valeurs du formulaire
        Object.entries(formData).forEach(([key, value]) => {
          if (key in form.getValues()) {
            form.setValue(key as any, value);
          }
        });
      } catch (err) {
        console.error("Erreur lors de la récupération de la compétition:", err);
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCompetition();
    }
  }, [id, form]);

  // Gérer la soumission du formulaire
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/competitions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Une erreur est survenue lors de la mise à jour"
        );
      }

      const result = await response.json();
      setSuccess("Compétition mise à jour avec succès");

      // Mettre à jour les données locales
      setCompetition(result.competition);

      // Rediriger après 2 secondes
      setTimeout(() => {
        router.push(`/organizer/competitions/${id}`);
      }, 2000);
    } catch (err) {
      console.error("Erreur lors de la mise à jour:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  // Gérer le changement de statut rapide
  const handleStatusChange = async (newStatus: string) => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/competitions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            "Une erreur est survenue lors de la mise à jour du statut"
        );
      }

      const result = await response.json();
      setSuccess(
        `Statut mis à jour: ${
          newStatus === "PUBLISHED" ? "Publié" : "Brouillon"
        }`
      );

      // Mettre à jour les données locales
      setCompetition(result.competition);
      form.setValue("status", newStatus);

      // Réinitialiser le message après 3 secondes
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du statut:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Chargement de la compétition...</span>
        </div>
      </div>
    );
  }

  if (error && !competition) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Modifier la compétition
          </h1>
          <p className="text-muted-foreground mt-1">
            Modifiez les détails de votre compétition ou changez son statut
          </p>
        </div>

        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button
            variant={competition?.status === "DRAFT" ? "outline" : "secondary"}
            onClick={() => handleStatusChange("DRAFT")}
            disabled={submitting || competition?.status === "DRAFT"}
          >
            Brouillon
          </Button>
          <Button
            variant={
              competition?.status === "PUBLISHED" ? "outline" : "default"
            }
            onClick={() => handleStatusChange("PUBLISHED")}
            disabled={submitting || competition?.status === "PUBLISHED"}
          >
            Publier
          </Button>
        </div>
      </div>

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Succès</AlertTitle>
          <AlertDescription className="text-green-700">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Informations générales</TabsTrigger>
              <TabsTrigger value="dates">Dates et inscriptions</TabsTrigger>
              <TabsTrigger value="rules">Règles et paramètres</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                  <CardDescription>
                    Modifiez les informations de base de votre compétition
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de la compétition</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Tournoi de football inter-écoles"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Décrivez votre compétition en détail..."
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégorie</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez une catégorie" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="FOOTBALL">Football</SelectItem>
                              <SelectItem value="BASKETBALL">
                                Basketball
                              </SelectItem>
                              <SelectItem value="VOLLEYBALL">
                                Volleyball
                              </SelectItem>
                              <SelectItem value="HANDBALL">Handball</SelectItem>
                              <SelectItem value="TENNIS">Tennis</SelectItem>
                              <SelectItem value="ATHLETICS">
                                Athlétisme
                              </SelectItem>
                              <SelectItem value="SWIMMING">Natation</SelectItem>
                              <SelectItem value="MARACANA">Maracana</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lieu</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Stade Municipal, Abidjan"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Compétition publique
                          </FormLabel>
                          <FormDescription>
                            Les compétitions publiques sont visibles par tous
                            les utilisateurs
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dates" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dates et inscriptions</CardTitle>
                  <CardDescription>
                    Définissez les dates de votre compétition et les paramètres
                    d'inscription
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="registrationStartDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date de début des inscriptions</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`w-full pl-3 text-left font-normal ${
                                    !field.value ? "text-muted-foreground" : ""
                                  }`}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: fr })
                                  ) : (
                                    <span>Sélectionnez une date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="registrationEndDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date de fin des inscriptions</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`w-full pl-3 text-left font-normal ${
                                    !field.value ? "text-muted-foreground" : ""
                                  }`}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: fr })
                                  ) : (
                                    <span>Sélectionnez une date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date de début de la compétition</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`w-full pl-3 text-left font-normal ${
                                    !field.value ? "text-muted-foreground" : ""
                                  }`}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: fr })
                                  ) : (
                                    <span>Sélectionnez une date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date de fin de la compétition</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`w-full pl-3 text-left font-normal ${
                                    !field.value ? "text-muted-foreground" : ""
                                  }`}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: fr })
                                  ) : (
                                    <span>Sélectionnez une date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre maximum de participants</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Définissez le nombre maximum de participants pour
                          votre compétition
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rules" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Règles et paramètres</CardTitle>
                  <CardDescription>
                    Définissez les règles spécifiques de votre compétition
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut de la compétition</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un statut" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DRAFT">Brouillon</SelectItem>
                            <SelectItem value="PUBLISHED">Publiée</SelectItem>
                            <SelectItem value="REGISTRATION_OPEN">
                              Inscriptions ouvertes
                            </SelectItem>
                            <SelectItem value="REGISTRATION_CLOSED">
                              Inscriptions fermées
                            </SelectItem>
                            <SelectItem value="IN_PROGRESS">
                              En cours
                            </SelectItem>
                            <SelectItem value="COMPLETED">Terminée</SelectItem>
                            <SelectItem value="CANCELLED">Annulée</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Le statut détermine la visibilité et l'état de votre
                          compétition
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator className="my-4" />

                  <FormField
                    control={form.control}
                    name="rules"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Règles de la compétition</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          {COMPETITION_RULES.map((rule) => (
                            <div
                              key={rule.value}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type="checkbox"
                                id={rule.value}
                                checked={field.value?.includes(rule.value)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const currentRules = field.value || [];

                                  if (checked) {
                                    field.onChange([
                                      ...currentRules,
                                      rule.value,
                                    ]);
                                  } else {
                                    field.onChange(
                                      currentRules.filter(
                                        (value) => value !== rule.value
                                      )
                                    );
                                  }
                                }}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <label htmlFor={rule.value} className="text-sm">
                                {rule.label}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormDescription>
                          Sélectionnez les règles qui s'appliquent à votre
                          compétition
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Enregistrer les
                  modifications
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
