"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Upload,
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Mail,
  Lock,
  Calendar,
  Phone,
  MapPin,
  Home,
  Users,
  ImageIcon,
  Trophy,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
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
import { CountrySelector } from "@/components/country-selector";
import { CitySelector } from "@/components/city-selector";
import { CommuneSelector } from "@/components/commune-selector";
import { PhoneInput } from "@/components/phone-input";
import { uploadImage, getPlaceholderImage } from "@/lib/blob";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { COMPETITION_CATEGORIES } from "@/constants/categories";
import { cn } from "@/lib/utils";
import { COUNTRIES, getCountryByCode } from "@/constants/countries";
import { CITIES } from "@/constants/villes";
import { COMMUNES } from "@/constants/communes";

// Schéma de validation simplifié
const formSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "Le prénom doit contenir au moins 2 caractères."),
    lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
    email: z.string().email("Veuillez entrer une adresse email valide."),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    dateOfBirth: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    commune: z.string().optional(),
    address: z.string().optional(),
    phoneNumber: z.string().optional(),
    phoneCountryCode: z.string().optional(),
    photoUrl: z.string().nullable().optional(),
    role: z.enum(["PARTICIPANT", "ORGANIZER"]),
    competitionCategory: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === "ORGANIZER" && !data.competitionCategory) {
        return false;
      }
      return true;
    },
    {
      message: "Veuillez sélectionner une catégorie de compétition.",
      path: ["competitionCategory"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

// Étapes du formulaire
const STEPS = [
  {
    id: "account",
    title: "Compte",
    description: "Informations de base",
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
    icon: User,
  },
  {
    id: "personal",
    title: "Personnel",
    description: "Informations personnelles",
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    icon: Calendar,
  },
  {
    id: "address",
    title: "Adresse",
    description: "Localisation",
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    textColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-200 dark:border-amber-800",
    icon: MapPin,
  },
  {
    id: "role",
    title: "Rôle",
    description: "Type d'utilisateur",
    color: "from-purple-500 to-violet-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    textColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-200 dark:border-purple-800",
    icon: Users,
  },
  {
    id: "photo",
    title: "Photo",
    description: "Photo de profil",
    color: "from-rose-500 to-pink-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/20",
    textColor: "text-rose-600 dark:text-rose-400",
    borderColor: "border-rose-200 dark:border-rose-800",
    icon: ImageIcon,
  },
];

export default function SignUpPage() {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      dateOfBirth: "",
      country: "",
      city: "",
      commune: "",
      address: "",
      phoneNumber: "",
      phoneCountryCode: "FR",
      photoUrl: null,
      role: "PARTICIPANT",
      competitionCategory: "",
    },
    mode: "onTouched",
  });

  const watchRole = form.watch("role");
  const watchCountry = form.watch("country");
  const watchCity = form.watch("city");
  const watchPhoneCountryCode = form.watch("phoneCountryCode");
  const currentStep = STEPS[step];

  // Mettre à jour le code pays du téléphone lorsque le pays change
  useEffect(() => {
    if (watchCountry) {
      // Trouver le pays correspondant dans la liste des pays
      const country = COUNTRIES.find((c) => c.code === watchCountry);
      if (country) {
        form.setValue("phoneCountryCode", country.code);
      }
    }
  }, [watchCountry, form]);

  // Réinitialiser la ville et la commune quand le pays change
  useEffect(() => {
    if (watchCountry) {
      const currentCity = form.getValues("city");
      const cityExists = CITIES.some(
        (city) => city.code === currentCity && city.countryCode === watchCountry
      );
      if (!cityExists) {
        form.setValue("city", "");
        form.setValue("commune", "");
      }
    }
  }, [watchCountry, form]);

  // Réinitialiser la commune quand la ville change
  useEffect(() => {
    if (watchCity) {
      const currentCommune = form.getValues("commune");
      const communeExists = COMMUNES.some(
        (commune) =>
          commune.code === currentCommune && commune.cityCode === watchCity
      );
      if (!communeExists) {
        form.setValue("commune", "");
      }
    }
  }, [watchCity, form]);

  // Gérer le changement de photo
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Type de fichier non supporté",
        description: "Veuillez sélectionner une image (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille de l'image ne doit pas dépasser 5MB",
        variant: "destructive",
      });
      return;
    }

    setPhotoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Gérer le changement de code pays pour le téléphone
  const handlePhoneCountryCodeChange = (code: string) => {
    form.setValue("phoneCountryCode", code);
  };

  // Vérifier si l'étape actuelle est valide
  const isStepValid = async () => {
    let fieldsToValidate: string[] = [];

    switch (step) {
      case 0:
        fieldsToValidate = ["firstName", "lastName", "email", "password"];
        break;
      case 1:
        fieldsToValidate = ["dateOfBirth", "phoneNumber"];
        break;
      case 2:
        fieldsToValidate = ["country", "city", "commune", "address"];
        break;
      case 3:
        fieldsToValidate = ["role"];
        if (watchRole === "ORGANIZER") {
          fieldsToValidate.push("competitionCategory");
        }
        break;
      case 4:
        return true; // L'étape de la photo est toujours valide
      default:
        return false;
    }

    const result = await form.trigger(fieldsToValidate as any);
    return result;
  };

  // Passer à l'étape suivante
  const goToNextStep = async () => {
    const isValid = await isStepValid();

    if (isValid) {
      if (step < STEPS.length - 1) {
        setStep((prev) => prev + 1);
        window.scrollTo(0, 0);
      } else {
        await handleSubmit();
      }
    } else {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
    }
  };

  // Revenir à l'étape précédente
  const goToPreviousStep = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const values = form.getValues();

      // Télécharger la photo si elle existe
      let photoUrl = values.photoUrl;
      if (photoFile) {
        try {
          photoUrl = await uploadImage(photoFile);
        } catch (error) {
          console.error("Erreur lors du téléchargement de la photo:", error);
          photoUrl = getPlaceholderImage(300, 300, "Photo de profil");
          toast({
            title: "Avertissement",
            description:
              "Impossible de télécharger la photo. Une image par défaut sera utilisée.",
            variant: "warning",
          });
        }
      }

      // Préparer les données à envoyer
      const formData = {
        ...values,
        photoUrl,
      };

      // Créer un nouvel objet sans phoneCountryCode au lieu de le supprimer
      const { phoneCountryCode, ...dataToSend } = formData;

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setRegistrationComplete(true);
        setTimeout(() => {
          router.push("/signin");
        }, 3000);
      } else {
        toast({
          title: "Échec de l'inscription",
          description:
            data.message || "Une erreur est survenue lors de l'inscription.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Erreur lors de l'inscription:", error);
      toast({
        title: "Échec de l'inscription",
        description:
          error.message ||
          "Une erreur inattendue est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Obtenir les noms pour l'affichage
  const getLocationNames = () => {
    const country = COUNTRIES.find((c) => c.code === watchCountry);
    const city = CITIES.find((c) => c.code === watchCity);
    const commune = COMMUNES.find((c) => c.code === form.getValues("commune"));

    return {
      countryName: country?.name || "",
      cityName: city?.name || "",
      communeName: commune?.name || "",
    };
  };

  // Afficher l'écran de succès
  if (registrationComplete) {
    return (
      <div className="container max-w-md py-20 flex flex-col items-center justify-center">
        <Card className="w-full border-none shadow-xl bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-4">
              <Check className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Inscription réussie !
            </CardTitle>
            <CardDescription className="text-base">
              Votre compte a été créé avec succès
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <p className="text-center text-muted-foreground mb-6">
              Vous allez être redirigé vers la page de connexion dans quelques
              instants...
            </p>
            <Button
              onClick={() => router.push("/signin")}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium px-8 py-2"
            >
              Se connecter maintenant
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
      <Card className="border-none shadow-xl overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="relative pb-2">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Créer un compte
          </CardTitle>
          <CardDescription className="text-base">
            Étape {step + 1} sur {STEPS.length} : {currentStep.title}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Barre de progression */}
          <div className="w-full mb-8">
            <div className="flex justify-between items-center mb-2">
              {STEPS.map((s, i) => (
                <div
                  key={s.id}
                  className={cn(
                    "flex flex-col items-center",
                    i <= step ? s.textColor : "text-gray-400 dark:text-gray-600"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2",
                      i < step
                        ? `${s.borderColor} ${s.bgColor}`
                        : i === step
                        ? `border-2 ${s.borderColor} ${s.bgColor}`
                        : "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    {i < step ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <s.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs mt-1 font-medium hidden md:block">
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r",
                  currentStep.color
                )}
                style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          <Form {...form}>
            <form className="space-y-6">
              {/* Étape 1: Informations de base */}
              {step === 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-center mb-6">
                    <div
                      className={cn(
                        "p-4 rounded-full",
                        currentStep.bgColor,
                        currentStep.textColor
                      )}
                    >
                      <User className="h-8 w-8" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            <User className="h-4 w-4" />
                            Prénom
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Jean"
                              {...field}
                              className="border-blue-200 dark:border-blue-800 focus-visible:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            <User className="h-4 w-4" />
                            Nom
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Dupont"
                              {...field}
                              className="border-blue-200 dark:border-blue-800 focus-visible:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <Mail className="h-4 w-4" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="jean.dupont@example.com"
                            {...field}
                            className="border-blue-200 dark:border-blue-800 focus-visible:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <Lock className="h-4 w-4" />
                          Mot de passe
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            className="border-blue-200 dark:border-blue-800 focus-visible:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                        <div className="text-xs text-gray-500 mt-2">
                          Le mot de passe doit contenir au moins 8 caractères.
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Étape 2: Informations personnelles */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-center mb-6">
                    <div
                      className={cn(
                        "p-4 rounded-full",
                        currentStep.bgColor,
                        currentStep.textColor
                      )}
                    >
                      <Calendar className="h-8 w-8" />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <Calendar className="h-4 w-4" />
                          Date de naissance
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="phoneCountryCode"
                      render={({ field }) => (
                        <FormItem className="hidden">
                          <FormControl>
                            <Input type="hidden" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <Phone className="h-4 w-4" />
                            Téléphone
                          </FormLabel>
                          <FormControl>
                            <PhoneInput
                              value={field.value || ""}
                              onChange={field.onChange}
                              countryCode={watchPhoneCountryCode || "FR"}
                              onCountryCodeChange={handlePhoneCountryCodeChange}
                              className="border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-500"
                            />
                          </FormControl>
                          <FormMessage />
                          <div className="text-xs text-gray-500 mt-1">
                            {watchCountry
                              ? `Le code pays est automatiquement défini selon le pays sélectionné (${
                                  getCountryByCode(watchCountry)?.name || ""
                                }).`
                              : "Vous pouvez changer le code pays en sélectionnant un pays à l'étape suivante."}
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Étape 3: Adresse */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-center mb-6">
                    <div
                      className={cn(
                        "p-4 rounded-full",
                        currentStep.bgColor,
                        currentStep.textColor
                      )}
                    >
                      <MapPin className="h-8 w-8" />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <MapPin className="h-4 w-4" />
                          Pays
                        </FormLabel>
                        <FormControl>
                          <CountrySelector
                            value={field.value || ""}
                            onChange={(value) => {
                              field.onChange(value);
                              // Le code pays du téléphone sera mis à jour automatiquement via useEffect
                            }}
                            className="border-amber-200 dark:border-amber-800 focus-visible:ring-amber-500"
                          />
                        </FormControl>
                        <FormMessage />
                        <div className="text-xs text-gray-500 mt-1">
                          La sélection d'un pays mettra automatiquement à jour
                          le code téléphonique et filtrera les villes
                          disponibles.
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <Home className="h-4 w-4" />
                            Ville
                          </FormLabel>
                          <FormControl>
                            <CitySelector
                              value={field.value || ""}
                              onChange={field.onChange}
                              countryCode={watchCountry}
                              className="border-amber-200 dark:border-amber-800 focus-visible:ring-amber-500"
                              placeholder={
                                watchCountry
                                  ? "Sélectionnez une ville"
                                  : "Sélectionnez d'abord un pays"
                              }
                            />
                          </FormControl>
                          <FormMessage />
                          {!watchCountry && (
                            <div className="text-xs text-amber-600 mt-1">
                              Veuillez d'abord sélectionner un pays.
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="commune"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <Home className="h-4 w-4" />
                            Commune
                          </FormLabel>
                          <FormControl>
                            <CommuneSelector
                              value={field.value || ""}
                              onChange={field.onChange}
                              cityCode={watchCity}
                              className="border-amber-200 dark:border-amber-800 focus-visible:ring-amber-500"
                              placeholder={
                                watchCity
                                  ? "Sélectionnez une commune"
                                  : "Sélectionnez d'abord une ville"
                              }
                            />
                          </FormControl>
                          <FormMessage />
                          {!watchCity && (
                            <div className="text-xs text-amber-600 mt-1">
                              Veuillez d'abord sélectionner une ville.
                            </div>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <Home className="h-4 w-4" />
                          Adresse
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Rue de la Paix"
                            {...field}
                            className="border-amber-200 dark:border-amber-800 focus-visible:ring-amber-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Affichage récapitulatif de la localisation */}
                  {(watchCountry || watchCity || form.getValues("commune")) && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mb-2">
                        Localisation sélectionnée :
                      </p>
                      <div className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
                        {watchCountry && (
                          <div>• Pays : {getLocationNames().countryName}</div>
                        )}
                        {watchCity && (
                          <div>• Ville : {getLocationNames().cityName}</div>
                        )}
                        {form.getValues("commune") && (
                          <div>
                            • Commune : {getLocationNames().communeName}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Étape 4: Rôle */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-center mb-6">
                    <div
                      className={cn(
                        "p-4 rounded-full",
                        currentStep.bgColor,
                        currentStep.textColor
                      )}
                    >
                      <Users className="h-8 w-8" />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                          <Users className="h-4 w-4" />
                          Rôle
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-purple-200 dark:border-purple-800 focus-visible:ring-purple-500">
                              <SelectValue placeholder="Sélectionnez un rôle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PARTICIPANT">
                              Participant
                            </SelectItem>
                            <SelectItem value="ORGANIZER">
                              Organisateur
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchRole === "ORGANIZER" && (
                    <FormField
                      control={form.control}
                      name="competitionCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                            <Trophy className="h-4 w-4" />
                            Catégorie de compétition
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-purple-200 dark:border-purple-800 focus-visible:ring-purple-500">
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
                  )}
                </div>
              )}

              {/* Étape 5: Photo de profil */}
              {step === 4 && (
                <div className="flex flex-col items-center space-y-6">
                  <div className="flex items-center justify-center mb-2">
                    <div
                      className={cn(
                        "p-4 rounded-full",
                        currentStep.bgColor,
                        currentStep.textColor
                      )}
                    >
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  </div>

                  <FormLabel className="text-center text-lg flex items-center gap-2 justify-center text-rose-600 dark:text-rose-400">
                    <ImageIcon className="h-5 w-5" />
                    Photo de profil
                  </FormLabel>

                  <div className="relative">
                    <div
                      className={cn(
                        "absolute inset-0 rounded-full blur-md opacity-30",
                        photoPreview ? "bg-rose-500/30" : "bg-muted"
                      )}
                    />
                    <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-800 relative z-10">
                      <AvatarImage
                        src={photoPreview || ""}
                        alt="Photo de profil"
                      />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white">
                        {form.getValues("firstName")?.charAt(0) || ""}
                        {form.getValues("lastName")?.charAt(0) || ""}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      accept="image/*"
                      id="photo"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("photo")?.click()}
                      className="border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Télécharger une photo
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Ajoutez une photo de profil pour personnaliser votre compte.
                    Cette étape est facultative, vous pourrez toujours ajouter
                    une photo plus tard.
                  </p>
                </div>
              )}
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={goToPreviousStep}
            disabled={step === 0 || isLoading}
            className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>

          <Button
            type="button"
            onClick={goToNextStep}
            disabled={isLoading}
            className={cn(
              "text-white font-medium",
              step === 0
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                : step === 1
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                : step === 2
                ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                : step === 3
                ? "bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
                : "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Veuillez patienter
              </>
            ) : step === STEPS.length - 1 ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Terminer
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
