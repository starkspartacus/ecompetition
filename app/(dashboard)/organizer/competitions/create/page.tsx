"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarIcon,
  Trophy,
  MapPin,
  CalendarCheck,
  Info,
  CheckCircle,
  AlertCircle,
  Eye,
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { COMPETITION_CATEGORIES } from "@/constants/categories";
import {
  COMPETITION_RULES,
  OFFSIDE_RULES,
  SUBSTITUTION_RULES,
  YELLOW_CARD_RULES,
  MATCH_DURATIONS,
} from "@/constants/competition-rules";
import Image from "next/image";

const formSchema = z
  .object({
    name: z.string().min(3, {
      message: "Le nom doit contenir au moins 3 caractères.",
    }),
    description: z.string().min(10, {
      message: "La description doit contenir au moins 10 caractères.",
    }),
    category: z.string({
      required_error: "Veuillez sélectionner une catégorie.",
    }),
    location: z.string().min(3, {
      message: "Veuillez entrer un lieu valide.",
    }),
    venue: z.string().min(2, {
      message: "Veuillez entrer un nom de stade/quartier valide.",
    }),
    startDate: z.date({
      required_error: "Veuillez sélectionner une date de début.",
    }),
    endDate: z.date({
      required_error: "Veuillez sélectionner une date de fin.",
    }),
    registrationStartDate: z.date({
      required_error: "Veuillez sélectionner une date de début d'inscription.",
    }),
    registrationEndDate: z.date({
      required_error: "Veuillez sélectionner une date limite d'inscription.",
    }),
    maxParticipants: z.coerce.number().min(2, {
      message: "Le nombre minimum de participants est 2.",
    }),
    tournamentFormat: z.string().optional(),
    offsideRule: z.string().optional(),
    substitutionRule: z.string().optional(),
    yellowCardRule: z.string().optional(),
    matchDuration: z.string().optional(),
    customRules: z.string().optional(),
    imageUrl: z.string().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La date de fin doit être postérieure ou égale à la date de début",
    path: ["endDate"],
  })
  .refine((data) => data.registrationEndDate >= data.registrationStartDate, {
    message:
      "La date limite d'inscription doit être postérieure ou égale à la date de début d'inscription",
    path: ["registrationEndDate"],
  })
  .refine((data) => data.startDate >= data.registrationEndDate, {
    message:
      "La date de début de la compétition doit être postérieure à la date limite d'inscription",
    path: ["startDate"],
  });

export default function CreateCompetitionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uniqueCode, setUniqueCode] = useState<string | null>(null);
  const [showUniqueCode, setShowUniqueCode] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      location: "",
      venue: "",
      maxParticipants: 10,
      offsideRule: "ENABLED",
      substitutionRule: "LIMITED",
      yellowCardRule: "STANDARD",
      matchDuration: "STANDARD",
      customRules: "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Upload image if provided
      const imageUrl = null;
      if (imageFile) {
        // Ici, vous devriez implémenter la logique pour télécharger l'image
        // Par exemple, en utilisant une fonction uploadImage
        // imageUrl = await uploadImage(imageFile)
      }

      const response = await fetch("/api/competitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          imageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erreur lors de la création de la compétition"
        );
      }

      setUniqueCode(data.competition.uniqueCode);
      toast({
        title: "Compétition créée avec succès!",
        description: "Votre compétition a été créée avec succès.",
        variant: "default",
      });

      // Ne pas rediriger immédiatement pour permettre à l'utilisateur de voir le code unique
      // router.push('/organizer/dashboard');
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const copyUniqueCode = () => {
    if (uniqueCode) {
      navigator.clipboard.writeText(uniqueCode);
      toast({
        title: "Code copié!",
        description: "Le code unique a été copié dans le presse-papier",
      });
    }
  };

  const goToNextTab = () => {
    if (activeTab === "details") {
      // Valider les champs de l'onglet détails avant de passer à l'onglet suivant
      form.trigger(["name", "description", "category", "location", "venue"]);
      const hasErrors =
        !!form.formState.errors.name ||
        !!form.formState.errors.description ||
        !!form.formState.errors.category ||
        !!form.formState.errors.location ||
        !!form.formState.errors.venue;

      if (!hasErrors) {
        setActiveTab("dates");
      }
    } else if (activeTab === "dates") {
      form.trigger([
        "startDate",
        "endDate",
        "registrationStartDate",
        "registrationEndDate",
        "maxParticipants",
      ]);
      const hasErrors =
        !!form.formState.errors.startDate ||
        !!form.formState.errors.endDate ||
        !!form.formState.errors.registrationStartDate ||
        !!form.formState.errors.registrationEndDate ||
        !!form.formState.errors.maxParticipants;

      if (!hasErrors) {
        setActiveTab("rules");
      }
    }
  };

  const goToPreviousTab = () => {
    if (activeTab === "dates") {
      setActiveTab("details");
    } else if (activeTab === "rules") {
      setActiveTab("dates");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="w-full">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl md:text-3xl font-bold">
                Créer une nouvelle compétition
              </CardTitle>
              <CardDescription className="text-gray-100">
                Remplissez le formulaire ci-dessous pour créer une nouvelle
                compétition.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {uniqueCode ? (
                <div className="space-y-6">
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">
                      Compétition créée avec succès!
                    </AlertTitle>
                    <AlertDescription className="text-green-700">
                      Votre compétition a été créée avec succès. Vous pouvez
                      maintenant partager le code unique avec les participants.
                    </AlertDescription>
                  </Alert>

                  <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">
                      Code unique de la compétition
                    </h3>
                    <div className="relative">
                      <div className="p-4 bg-white rounded-md border border-gray-300 flex justify-between items-center">
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowUniqueCode(!showUniqueCode)}
                            className="mr-2"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {showUniqueCode ? "Masquer" : "Afficher"}
                          </Button>
                          {showUniqueCode ? (
                            <span className="font-mono text-lg font-bold">
                              {uniqueCode}
                            </span>
                          ) : (
                            <span className="font-mono text-lg font-bold">
                              ••••••••••
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyUniqueCode}
                        >
                          Copier
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                      Partagez ce code avec les participants pour qu'ils
                      puissent s'inscrire à cette compétition. Ce code est
                      unique et ne peut être utilisé que pour cette compétition.
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => router.push("/organizer/dashboard")}
                    >
                      Retour au tableau de bord
                    </Button>
                    <Button
                      onClick={() =>
                        router.push(`/organizer/competitions/${uniqueCode}`)
                      }
                    >
                      Voir les détails de la compétition
                    </Button>
                  </div>
                </div>
              ) : (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <Tabs
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Détails</TabsTrigger>
                        <TabsTrigger value="dates">Dates</TabsTrigger>
                        <TabsTrigger value="rules">Règles</TabsTrigger>
                      </TabsList>

                      <TabsContent value="details" className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
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
                          </div>

                          <div className="md:col-span-2">
                            <FormField
                              control={form.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Décrivez votre compétition en détail..."
                                      className="min-h-[120px]"
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
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Catégorie</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionnez une catégorie" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {COMPETITION_CATEGORIES.map((category) => (
                                      <SelectItem
                                        key={category.value}
                                        value={category.value}
                                      >
                                        {category.label}
                                      </SelectItem>
                                    ))}
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
                                <FormLabel>Adresse</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="123 Rue du Stade, Abidjan"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="venue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Stade / Quartier</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Stade Municipal"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="md:col-span-2">
                            <FormField
                              control={form.control}
                              name="imageUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Image de la compétition</FormLabel>
                                  <FormControl>
                                    <div className="flex flex-col items-start gap-4">
                                      {imagePreview && (
                                        <div className="relative h-40 w-40 overflow-hidden rounded-md">
                                          <img
                                            src={
                                              imagePreview || "/placeholder.svg"
                                            }
                                            alt="Aperçu de l'image"
                                            className="h-full w-full object-cover"
                                          />
                                        </div>
                                      )}
                                      <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="cursor-pointer"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormDescription>
                                    Ajoutez une image représentative pour votre
                                    compétition (optionnel)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button type="button" onClick={goToNextTab}>
                            Suivant
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="dates" className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="registrationStartDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>
                                  Date de début d'inscription
                                </FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={`w-full pl-3 text-left font-normal ${
                                          !field.value &&
                                          "text-muted-foreground"
                                        }`}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP", {
                                            locale: fr,
                                          })
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
                                      disabled={(date) => date < new Date()}
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
                                <FormLabel>Date limite d'inscription</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={`w-full pl-3 text-left font-normal ${
                                          !field.value &&
                                          "text-muted-foreground"
                                        }`}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP", {
                                            locale: fr,
                                          })
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
                                      disabled={(date) => {
                                        const regStartDate = form.getValues(
                                          "registrationStartDate"
                                        );
                                        return (
                                          date < new Date() ||
                                          (regStartDate && date < regStartDate)
                                        );
                                      }}
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
                            name="startDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>
                                  Date de début de la compétition
                                </FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={`w-full pl-3 text-left font-normal ${
                                          !field.value &&
                                          "text-muted-foreground"
                                        }`}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP", {
                                            locale: fr,
                                          })
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
                                      disabled={(date) => {
                                        const regEndDate = form.getValues(
                                          "registrationEndDate"
                                        );
                                        return (
                                          date < new Date() ||
                                          (regEndDate && date < regEndDate)
                                        );
                                      }}
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
                                <FormLabel>
                                  Date de fin de la compétition
                                </FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={`w-full pl-3 text-left font-normal ${
                                          !field.value &&
                                          "text-muted-foreground"
                                        }`}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP", {
                                            locale: fr,
                                          })
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
                                      disabled={(date) => {
                                        const startDate =
                                          form.getValues("startDate");
                                        return (
                                          date < new Date() ||
                                          (startDate && date < startDate)
                                        );
                                      }}
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
                            name="maxParticipants"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Nombre maximum de participants
                                </FormLabel>
                                <FormControl>
                                  <Input type="number" min={2} {...field} />
                                </FormControl>
                                <FormDescription>
                                  Définissez le nombre maximum d'équipes pouvant
                                  participer à cette compétition
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="tournamentFormat"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Format du tournoi</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionnez un format" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {COMPETITION_RULES.map((format) => (
                                      <SelectItem
                                        key={format.value}
                                        value={format.value}
                                      >
                                        {format.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Choisissez le format de tournoi qui convient
                                  le mieux à votre compétition
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-between">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={goToPreviousTab}
                          >
                            Précédent
                          </Button>
                          <Button type="button" onClick={goToNextTab}>
                            Suivant
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="rules" className="space-y-4 pt-4">
                        <Alert className="bg-blue-50 border-blue-200">
                          <Info className="h-4 w-4 text-blue-600" />
                          <AlertTitle className="text-blue-800">
                            Règles de la compétition
                          </AlertTitle>
                          <AlertDescription className="text-blue-700">
                            Définissez les règles spécifiques qui s'appliqueront
                            à votre compétition.
                          </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="offsideRule"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Règle du hors-jeu</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionnez une règle" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {OFFSIDE_RULES.map((rule) => (
                                      <SelectItem
                                        key={rule.value}
                                        value={rule.value}
                                      >
                                        {rule.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  {
                                    OFFSIDE_RULES.find(
                                      (r) => r.value === field.value
                                    )?.description
                                  }
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="substitutionRule"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Règle de remplacement</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionnez une règle" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {SUBSTITUTION_RULES.map((rule) => (
                                      <SelectItem
                                        key={rule.value}
                                        value={rule.value}
                                      >
                                        {rule.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  {
                                    SUBSTITUTION_RULES.find(
                                      (r) => r.value === field.value
                                    )?.description
                                  }
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="yellowCardRule"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Règle des cartons jaunes</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionnez une règle" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {YELLOW_CARD_RULES.map((rule) => (
                                      <SelectItem
                                        key={rule.value}
                                        value={rule.value}
                                      >
                                        {rule.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  {
                                    YELLOW_CARD_RULES.find(
                                      (r) => r.value === field.value
                                    )?.description
                                  }
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="matchDuration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Durée des matchs</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionnez une durée" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {MATCH_DURATIONS.map((duration) => (
                                      <SelectItem
                                        key={duration.value}
                                        value={duration.value}
                                      >
                                        {duration.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  {
                                    MATCH_DURATIONS.find(
                                      (d) => d.value === field.value
                                    )?.description
                                  }
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="customRules"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Règles personnalisées</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Ajoutez des règles spécifiques à votre compétition..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Décrivez toutes les règles supplémentaires
                                spécifiques à votre compétition (optionnel)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-between">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={goToPreviousTab}
                          >
                            Précédent
                          </Button>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                              ? "Création en cours..."
                              : "Créer la compétition"}
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="hidden lg:block">
          <Card className="w-full sticky top-4">
            <CardHeader>
              <CardTitle>Guide de création</CardTitle>
              <CardDescription>
                Suivez ces étapes pour créer votre compétition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative h-40 w-full overflow-hidden rounded-lg mb-4">
                <Image
                  src="/placeholder-jfb9l.png"
                  alt="Organisation de compétition sportive"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <div className="bg-blue-100 text-blue-700 rounded-full p-1 mt-0.5">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">
                      Détails de la compétition
                    </h3>
                    <p className="text-xs text-gray-500">
                      Donnez un nom accrocheur et une description détaillée.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start space-x-2">
                  <div className="bg-purple-100 text-purple-700 rounded-full p-1 mt-0.5">
                    <CalendarCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Dates importantes</h3>
                    <p className="text-xs text-gray-500">
                      Définissez les dates d'inscription et de la compétition.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start space-x-2">
                  <div className="bg-green-100 text-green-700 rounded-full p-1 mt-0.5">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">
                      Lieu et participants
                    </h3>
                    <p className="text-xs text-gray-500">
                      Précisez le lieu et le nombre maximum de participants.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start space-x-2">
                  <div className="bg-amber-100 text-amber-700 rounded-full p-1 mt-0.5">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">
                      Règles de la compétition
                    </h3>
                    <p className="text-xs text-gray-500">
                      Définissez les règles pour une compétition équitable.
                    </p>
                  </div>
                </div>
              </div>

              <Alert className="bg-gray-50 border-gray-200 mt-4">
                <Info className="h-4 w-4 text-gray-600" />
                <AlertTitle className="text-gray-800 text-sm">
                  Conseil
                </AlertTitle>
                <AlertDescription className="text-gray-700 text-xs">
                  Une fois la compétition créée, vous recevrez un code unique à
                  partager avec les participants.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
