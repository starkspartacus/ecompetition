"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { COMPETITION_CATEGORIES } from "@/constants/categories";
import {
  OFFSIDE_RULES,
  SUBSTITUTION_RULES,
  YELLOW_CARD_RULES,
  MATCH_DURATIONS,
} from "@/constants/competition-rules";
import { VILLES } from "@/constants/villes";
import { COMMUNES } from "@/constants/communes";
import {
  User,
  Settings,
  Trophy,
  Mail,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  UserPlus,
  Scroll,
  Loader2,
  Info,
} from "lucide-react";
import { CountrySelector } from "@/components/country-selector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  uploadImageServer,
  validateImageFile,
  createPreviewUrl,
  IMAGE_CONFIGS,
} from "@/lib/blob";

const profileSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Format d'email invalide"),
  phoneNumber: z.string().optional(),
  countryCode: z.string().min(1, "Veuillez sélectionner un pays"),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  city: z.string().min(1, "La ville est requise"),
  commune: z.string().optional(),
  bio: z.string().optional(),
  competitionCategory: z.string().optional(),
});

const competitionRulesSchema = z.object({
  competitionId: z.string().min(1, "Veuillez sélectionner une compétition"),
  offsideRule: z.string().optional(),
  substitutionRule: z.string().optional(),
  yellowCardRule: z.string().optional(),
  matchDuration: z.string().optional(),
  customRules: z.string().optional(),
});

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCompetitions, setIsLoadingCompetitions] = useState(false);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<any>(null);
  const [availableCities, setAvailableCities] = useState<
    { value: string; label: string }[]
  >([]);
  const [availableCommunes, setAvailableCommunes] = useState<
    { value: string; label: string }[]
  >([]);
  const [activeTab, setActiveTab] = useState("profile");

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      countryCode: "",
      address: "",
      city: "",
      commune: "",
      bio: "",
      competitionCategory: "",
    },
  });

  const rulesForm = useForm<z.infer<typeof competitionRulesSchema>>({
    resolver: zodResolver(competitionRulesSchema),
    defaultValues: {
      competitionId: "",
      offsideRule: "ENABLED",
      substitutionRule: "LIMITED",
      yellowCardRule: "STANDARD",
      matchDuration: "STANDARD",
      customRules: "",
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  // Mettre à jour les villes disponibles lorsque le pays change
  useEffect(() => {
    const countryCode = profileForm.watch("countryCode");
    if (countryCode) {
      const countryKey = countryCode.toLowerCase() as keyof typeof VILLES;
      const citiesData = VILLES[countryKey];

      if (Array.isArray(citiesData)) {
        // Si c'est déjà un tableau avec la bonne structure
        if (
          citiesData.length > 0 &&
          typeof citiesData[0] === "object" &&
          "value" in citiesData[0]
        ) {
          setAvailableCities(citiesData as { value: string; label: string }[]);
        } else {
          // Si c'est un tableau de strings, on le transforme
          setAvailableCities(
            citiesData.map((city: any) => ({
              value: String(city),
              label: String(city),
            }))
          );
        }
      } else {
        setAvailableCities([]);
      }
    } else {
      setAvailableCities([]);
    }
  }, [profileForm.watch("countryCode")]);

  // Mettre à jour les communes disponibles lorsque la ville change
  useEffect(() => {
    const city = profileForm.watch("city");
    if (city) {
      const cityKey = city as keyof typeof COMMUNES;
      const communesData = COMMUNES[cityKey];

      if (Array.isArray(communesData)) {
        // Si c'est déjà un tableau avec la bonne structure
        if (
          communesData.length > 0 &&
          typeof communesData[0] === "object" &&
          "value" in communesData[0]
        ) {
          setAvailableCommunes(
            communesData as { value: string; label: string }[]
          );
        } else if (
          communesData.length > 0 &&
          typeof communesData[0] === "object" &&
          "name" in communesData[0]
        ) {
          // Si c'est un tableau d'objets avec code et name
          setAvailableCommunes(
            communesData.map((commune: any) => ({
              value: commune.code || String(commune),
              label: commune.name || String(commune),
            }))
          );
        } else {
          // Si c'est un tableau de strings, on le transforme
          setAvailableCommunes(
            communesData.map((commune: any) => ({
              value: String(commune),
              label: String(commune),
            }))
          );
        }
      } else {
        setAvailableCommunes([]);
      }
    } else {
      setAvailableCommunes([]);
    }
  }, [profileForm.watch("city")]);

  useEffect(() => {
    // Charger les informations de l'utilisateur
    const fetchUserData = async () => {
      try {
        console.log("Chargement des données utilisateur...");

        // Utiliser les données de session si disponibles
        if (session?.user) {
          console.log("Utilisation des données de session:", session.user);

          // Récupérer les détails complets depuis l'API
          const response = await fetch("/api/auth/user");

          if (!response.ok) {
            throw new Error(
              `Erreur lors de la récupération des données utilisateur: ${response.status}`
            );
          }

          const data = await response.json();
          console.log("Données utilisateur reçues:", data);

          if (data.user) {
            const user = data.user;

            // Mettre à jour le formulaire avec les données
            const formData = {
              firstName: user.firstName || session.user.name || "",
              lastName: user.lastName || session.user.name || "",
              email: user.email || session.user.email || "",
              phoneNumber: user.phoneNumber || "",
              countryCode: user.countryCode || "",
              address: user.address || "",
              city: user.city || "",
              commune: user.commune || "",
              bio: user.bio || "",
              competitionCategory: user.competitionCategory || "",
            };

            console.log("Données du formulaire:", formData);
            profileForm.reset(formData);

            if (user.photoUrl) {
              setPhotoPreview(user.photoUrl);
            }

            // Si on a un pays, charger les villes
            if (user.countryCode) {
              const countryKey =
                user.countryCode.toLowerCase() as keyof typeof VILLES;
              const citiesData = VILLES[countryKey];
              if (citiesData) {
                // Traiter les villes selon leur format
                if (Array.isArray(citiesData)) {
                  if (
                    citiesData.length > 0 &&
                    typeof citiesData[0] === "object" &&
                    "value" in citiesData[0]
                  ) {
                    setAvailableCities(
                      citiesData as { value: string; label: string }[]
                    );
                  } else {
                    setAvailableCities(
                      citiesData.map((city: any) => ({
                        value: String(city),
                        label: String(city),
                      }))
                    );
                  }
                }
              }

              // Si on a une ville, charger les communes
              if (user.city) {
                const cityKey = user.city as keyof typeof COMMUNES;
                const communesData = COMMUNES[cityKey];
                if (communesData && Array.isArray(communesData)) {
                  if (
                    communesData.length > 0 &&
                    typeof communesData[0] === "object" &&
                    "name" in communesData[0]
                  ) {
                    setAvailableCommunes(
                      communesData.map((commune: any) => ({
                        value: commune.code || String(commune),
                        label: commune.name || String(commune),
                      }))
                    );
                  } else {
                    setAvailableCommunes(
                      communesData.map((commune: any) => ({
                        value: String(commune),
                        label: String(commune),
                      }))
                    );
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement des données utilisateur:",
          error
        );
        toast({
          title: "Erreur",
          description:
            "Impossible de charger vos informations. Veuillez réessayer plus tard.",
          variant: "destructive",
        });
      }
    };

    // Charger les compétitions de l'organisateur
    const fetchCompetitions = async () => {
      if (activeTab !== "competitions") return;

      try {
        setIsLoadingCompetitions(true);
        console.log("Chargement des compétitions...");
        const response = await fetch("/api/competitions");

        if (!response.ok) {
          throw new Error(
            `Erreur lors de la récupération des compétitions: ${response.status}`
          );
        }

        const data = await response.json();
        console.log("Compétitions reçues:", data);

        if (data.competitions) {
          setCompetitions(data.competitions);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des compétitions:", error);
        toast({
          title: "Erreur",
          description:
            "Impossible de charger vos compétitions. Veuillez réessayer plus tard.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCompetitions(false);
      }
    };

    if (session) {
      fetchUserData();
      if (session.user.role === "ORGANIZER") {
        fetchCompetitions();
      }
    }
  }, [session, profileForm, activeTab]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Validation immédiate
        const validation = validateImageFile(file, IMAGE_CONFIGS.profile);
        if (!validation.valid) {
          toast({
            title: "Fichier invalide",
            description: validation.error,
            variant: "destructive",
          });
          return;
        }

        // Prévisualisation immédiate
        const previewUrl = createPreviewUrl(file);
        setPhotoPreview(previewUrl);
        setPhotoFile(file);

        toast({
          title: "Photo sélectionnée",
          description: "La photo sera uploadée lors de la sauvegarde",
        });
      } catch (error) {
        console.error("Erreur sélection photo:", error);
        toast({
          title: "Erreur",
          description: "Impossible de traiter cette image",
          variant: "destructive",
        });
      }
    }
  };

  const handleCompetitionChange = async (competitionId: string) => {
    try {
      setIsLoadingRules(true);
      console.log("Chargement des règles pour la compétition:", competitionId);

      const competition = competitions.find((c) => c.id === competitionId);
      setSelectedCompetition(competition);

      // Récupérer les règles spécifiques de la compétition
      const response = await fetch(`/api/competitions/${competitionId}/rules`);

      if (!response.ok) {
        throw new Error(
          `Erreur lors de la récupération des règles: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Règles reçues:", data);

      if (data.rules) {
        rulesForm.reset({
          competitionId,
          offsideRule: data.rules.offsideRule || "ENABLED",
          substitutionRule: data.rules.substitutionRule || "LIMITED",
          yellowCardRule: data.rules.yellowCardRule || "STANDARD",
          matchDuration: data.rules.matchDuration || "STANDARD",
          customRules: data.rules.customRules || "",
        });
      } else {
        // Si aucune règle n'est définie, utiliser les valeurs par défaut
        rulesForm.reset({
          competitionId,
          offsideRule: "ENABLED",
          substitutionRule: "LIMITED",
          yellowCardRule: "STANDARD",
          matchDuration: "STANDARD",
          customRules: "",
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des règles:", error);
      toast({
        title: "Erreur",
        description:
          "Impossible de charger les règles de cette compétition. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRules(false);
    }
  };

  const handleCountryChange = (countryCode: string) => {
    profileForm.setValue("countryCode", countryCode);

    // Réinitialiser la ville et la commune lorsque le pays change
    profileForm.setValue("city", "");
    profileForm.setValue("commune", "");
  };

  const handleCityChange = (city: string) => {
    profileForm.setValue("city", city);

    // Réinitialiser la commune lorsque la ville change
    profileForm.setValue("commune", "");
  };

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    try {
      setIsLoading(true);
      console.log("Soumission du profil avec les valeurs:", values);

      // Upload photo if provided
      let photoUrl = null;
      if (photoFile) {
        console.log("Téléchargement de la photo...");
        photoUrl = await uploadImageServer(photoFile, "profile", {
          userId: session?.user?.id || "unknown",
          userName: `${values.firstName} ${values.lastName}`,
        });
        console.log("Photo téléchargée:", photoUrl);
      }

      // Update user profile
      console.log("Mise à jour du profil...");
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          photoUrl: photoUrl || photoPreview,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message ||
            "Une erreur est survenue lors de la mise à jour du profil"
        );
      }

      console.log("Profil mis à jour avec succès");
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès",
      });
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      toast({
        title: "Erreur",
        description:
          error.message ||
          "Une erreur est survenue lors de la mise à jour du profil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRulesSubmit = async (
    values: z.infer<typeof competitionRulesSchema>
  ) => {
    try {
      setIsLoading(true);
      console.log("Soumission des règles avec les valeurs:", values);

      // Update competition rules
      console.log("Mise à jour des règles...");
      const response = await fetch(
        `/api/competitions/${values.competitionId}/rules`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            offsideRule: values.offsideRule,
            substitutionRule: values.substitutionRule,
            yellowCardRule: values.yellowCardRule,
            matchDuration: values.matchDuration,
            customRules: values.customRules,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message ||
            "Une erreur est survenue lors de la mise à jour des règles"
        );
      }

      console.log("Règles mises à jour avec succès");
      toast({
        title: "Règles mises à jour",
        description:
          "Les règles de la compétition ont été mises à jour avec succès",
      });
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour des règles:", error);
      toast({
        title: "Erreur",
        description:
          error.message ||
          "Une erreur est survenue lors de la mise à jour des règles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Paramètres
        </h1>
        <p className="text-muted-foreground">
          Gérez votre profil et vos préférences
        </p>
      </div>
      <Separator />

      <Tabs
        defaultValue="profile"
        className="w-full"
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Profil</span>
          </TabsTrigger>
          {session?.user.role === "ORGANIZER" && (
            <TabsTrigger
              value="competitions"
              className="flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              <span>Compétitions</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="col-span-1 md:row-span-2">
              <CardHeader>
                <CardTitle>Photo de profil</CardTitle>
                <CardDescription>
                  Votre photo sera visible par les autres utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="relative h-32 w-32 overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center border-2 border-primary/20">
                  {photoPreview ? (
                    <img
                      src={photoPreview || "/placeholder.svg"}
                      alt="Photo de profil"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16 text-primary/40" />
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="cursor-pointer max-w-xs bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
                />
              </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-3">
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Mettez à jour vos informations personnelles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form
                    onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <User className="h-4 w-4 text-primary" />
                              Prénom
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <User className="h-4 w-4 text-primary" />
                              Nom
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-primary" />
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-primary" />
                              Téléphone
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
                              />
                            </FormControl>
                            <FormDescription>
                              Numéro de téléphone (optionnel)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="countryCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            Pays
                          </FormLabel>
                          <FormControl>
                            <CountrySelector
                              value={field.value}
                              onChange={handleCountryChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              Ville
                            </FormLabel>
                            <Select
                              onValueChange={handleCityChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all">
                                  <SelectValue placeholder="Sélectionner une ville" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableCities.length > 0 ? (
                                  availableCities.map((city) => (
                                    <SelectItem
                                      key={city.value}
                                      value={city.value}
                                    >
                                      {city.label}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-cities" disabled>
                                    Aucune ville disponible
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="commune"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              Commune
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={availableCommunes.length === 0}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all">
                                  <SelectValue placeholder="Sélectionner une commune" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableCommunes.length > 0 ? (
                                  availableCommunes.map((commune) => (
                                    <SelectItem
                                      key={commune.value}
                                      value={commune.value}
                                    >
                                      {commune.label}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-communes" disabled>
                                    Aucune commune disponible
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Commune (optionnel)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            Adresse
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {session?.user.role === "ORGANIZER" && (
                      <FormField
                        control={profileForm.control}
                        name="competitionCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-primary" />
                              Catégorie de compétition principale
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
                            <FormDescription>
                              Votre catégorie de compétition principale
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            Biographie
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="min-h-32 bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
                            />
                          </FormControl>
                          <FormDescription>
                            Parlez de vous (optionnel)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Mise à jour...
                        </>
                      ) : (
                        "Mettre à jour le profil"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {session?.user.role === "ORGANIZER" && (
          <TabsContent value="competitions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Règles de compétition</CardTitle>
                <CardDescription>
                  Configurez les règles pour vos compétitions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCompetitions ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Chargement des compétitions...</span>
                  </div>
                ) : competitions.length === 0 ? (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertTitle>Aucune compétition trouvée</AlertTitle>
                    <AlertDescription>
                      Vous n'avez pas encore créé de compétition. Créez une
                      compétition pour pouvoir configurer ses règles.
                    </AlertDescription>
                    <Button
                      className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      onClick={() =>
                        router.push("/organizer/competitions/create")
                      }
                    >
                      Créer une compétition
                    </Button>
                  </Alert>
                ) : (
                  <Form {...rulesForm}>
                    <form
                      onSubmit={rulesForm.handleSubmit(onRulesSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={rulesForm.control}
                        name="competitionId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-primary" />
                              Sélectionner une compétition
                            </FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleCompetitionChange(value);
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all">
                                  <SelectValue placeholder="Sélectionner une compétition" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {competitions.map((competition) => (
                                  <SelectItem
                                    key={competition.id}
                                    value={competition.id}
                                  >
                                    {competition.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Choisissez la compétition dont vous souhaitez
                              modifier les règles
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {isLoadingRules ? (
                        <div className="flex justify-center items-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="ml-2">Chargement des règles...</span>
                        </div>
                      ) : selectedCompetition ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={rulesForm.control}
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
                              control={rulesForm.control}
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
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={rulesForm.control}
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
                              control={rulesForm.control}
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
                            control={rulesForm.control}
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
                                  Spécifiez des règles supplémentaires pour
                                  votre compétition (optionnel)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Mise à jour...
                              </>
                            ) : (
                              "Mettre à jour les règles"
                            )}
                          </Button>
                        </>
                      ) : (
                        <Alert className="bg-amber-50 border-amber-200">
                          <Info className="h-4 w-4 text-amber-500" />
                          <AlertTitle>Sélectionnez une compétition</AlertTitle>
                          <AlertDescription>
                            Veuillez sélectionner une compétition pour
                            configurer ses règles.
                          </AlertDescription>
                        </Alert>
                      )}
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
