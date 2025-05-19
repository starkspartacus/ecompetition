"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { COMPETITION_CATEGORIES } from "@/constants/categories";
import {
  OFFSIDE_RULES,
  SUBSTITUTION_RULES,
  YELLOW_CARD_RULES,
  MATCH_DURATIONS,
} from "@/constants/competition-rules";
import { uploadImage } from "@/lib/blob";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
  Trophy,
  MapPin,
  Users,
  Calendar,
  ImageIcon,
  Info,
  Scroll,
  Award,
  BellIcon as Whistle,
  Clock,
  UserPlus,
  AlertTriangle,
} from "lucide-react";

const competitionSchema = z
  .object({
    title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
    address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
    venue: z.string().min(2, "Le nom du stade/quartier est requis"),
    maxParticipants: z.coerce.number().min(2, "Minimum 2 participants requis"),
    category: z.string().min(1, "La catégorie est requise"),
    registrationStartDate: z.string().refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      return selectedDate >= today;
    }, "La date de début d'inscription doit être aujourd'hui ou dans le futur"),
    registrationDeadline: z.string().refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      return selectedDate > today;
    }, "La date limite doit être dans le futur"),
    description: z.string().optional(),
    image: z.any().optional(),
    offsideRule: z.string().optional(),
    substitutionRule: z.string().optional(),
    yellowCardRule: z.string().optional(),
    matchDuration: z.string().optional(),
    customRules: z.string().optional(),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.registrationStartDate);
      const endDate = new Date(data.registrationDeadline);
      return endDate > startDate;
    },
    {
      message:
        "La date limite d'inscription doit être postérieure à la date de début",
      path: ["registrationDeadline"],
    }
  );

export default function CreateCompetitionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");

  const form = useForm<z.infer<typeof competitionSchema>>({
    resolver: zodResolver(competitionSchema),
    defaultValues: {
      title: "",
      address: "",
      venue: "",
      maxParticipants: 10,
      category: "",
      registrationStartDate: new Date().toISOString().split("T")[0],
      registrationDeadline: "",
      description: "",
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

  const onSubmit = async (values: z.infer<typeof competitionSchema>) => {
    try {
      setIsLoading(true);

      // Upload image if provided
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      // Create competition
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message ||
            "Une erreur est survenue lors de la création de la compétition"
        );
      }

      const data = await response.json();

      toast({
        title: "Compétition créée",
        description: `Code unique: ${data.competition.uniqueCode}`,
      });

      router.push(`/organizer/competitions/${data.competition.id}`);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error.message ||
          "Une erreur est survenue lors de la création de la compétition",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-8 w-8 text-primary" />
          Créer une compétition
        </h1>
        <p className="text-muted-foreground">
          Remplissez le formulaire ci-dessous pour créer une nouvelle
          compétition
        </p>
      </div>
      <Separator />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 max-w-4xl"
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>Général</span>
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Lieu</span>
              </TabsTrigger>
              <TabsTrigger value="dates" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Dates</span>
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <Whistle className="h-4 w-4" />
                <span>Règles</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={tabVariants}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-medium">
                    Informations générales
                  </h2>
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        Titre de la compétition
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Tournoi de football inter-quartiers"
                          {...field}
                          className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        Catégorie
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all">
                            <SelectValue placeholder="Sélectionner une catégorie" />
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
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Nombre maximum de participants
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="2"
                          {...field}
                          className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
                        />
                      </FormControl>
                      <FormDescription>
                        Nombre maximum d'équipes pouvant participer
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
                      <FormLabel className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez votre compétition..."
                          {...field}
                          className="min-h-32 bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
                        />
                      </FormControl>
                      <FormDescription>
                        Fournissez des détails sur votre compétition (optionnel)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        Image / Logo de la compétition
                      </FormLabel>
                      <FormControl>
                        <div className="flex flex-col items-start gap-4">
                          {imagePreview && (
                            <div className="relative h-40 w-40 overflow-hidden rounded-md">
                              <img
                                src={imagePreview || "/placeholder.svg"}
                                alt="Preview"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="cursor-pointer bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Ajoutez une image ou un logo pour votre compétition
                        (optionnel)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="location" className="space-y-6">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={tabVariants}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-medium">
                    Lieu de la compétition
                  </h2>
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Adresse
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123 Rue du Stade"
                          {...field}
                          className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
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
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Quartier / Stade
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Stade Municipal"
                          {...field}
                          className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="dates" className="space-y-6">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={tabVariants}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-medium">Dates importantes</h2>
                </div>

                <FormField
                  control={form.control}
                  name="registrationStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Date de début des inscriptions
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
                        />
                      </FormControl>
                      <FormDescription>
                        Date à partir de laquelle les équipes peuvent s'inscrire
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registrationDeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Date limite d'inscription
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
                        />
                      </FormControl>
                      <FormDescription>
                        Les inscriptions seront automatiquement fermées après
                        cette date
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="rules" className="space-y-6">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={tabVariants}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Whistle className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-medium">
                    Règles de la compétition
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="offsideRule"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-primary" />
                          Règle du hors-jeu
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all">
                              <SelectValue placeholder="Sélectionner une règle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {OFFSIDE_RULES.map((rule) => (
                              <SelectItem key={rule.value} value={rule.value}>
                                {rule.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {
                            OFFSIDE_RULES.find((r) => r.value === field.value)
                              ?.description
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
                        <FormLabel className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-primary" />
                          Règle de remplacement
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all">
                              <SelectValue placeholder="Sélectionner une règle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SUBSTITUTION_RULES.map((rule) => (
                              <SelectItem key={rule.value} value={rule.value}>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="yellowCardRule"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          Règle des cartons jaunes
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all">
                              <SelectValue placeholder="Sélectionner une règle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {YELLOW_CARD_RULES.map((rule) => (
                              <SelectItem key={rule.value} value={rule.value}>
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
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          Durée des matchs
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all">
                              <SelectValue placeholder="Sélectionner une durée" />
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
                            MATCH_DURATIONS.find((d) => d.value === field.value)
                              ?.description
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
                      <FormLabel className="flex items-center gap-2">
                        <Scroll className="h-4 w-4 text-primary" />
                        Règles personnalisées
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ajoutez des règles spécifiques à votre compétition..."
                          {...field}
                          className="min-h-32 bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
                        />
                      </FormControl>
                      <FormDescription>
                        Spécifiez des règles supplémentaires pour votre
                        compétition (optionnel)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-4 border-t">
            {activeTab !== "general" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tabs = ["general", "location", "dates", "rules"];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1]);
                  }
                }}
                className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
              >
                Précédent
              </Button>
            )}

            {activeTab !== "rules" ? (
              <Button
                type="button"
                onClick={() => {
                  const tabs = ["general", "location", "dates", "rules"];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1]);
                  }
                }}
                className="ml-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Suivant
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading}
                className="ml-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isLoading ? "Création en cours..." : "Créer la compétition"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
