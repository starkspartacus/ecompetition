"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { COMPETITION_CATEGORIES } from "@/constants/categories";
import { uploadImage } from "@/lib/blob";
import { toast } from "@/components/ui/use-toast";
import { CountrySelector } from "@/components/country-selector";
import { PhoneInput } from "@/components/phone-input";
import { LocationSelector } from "@/components/location-selector";
import { AuthBackground } from "@/components/auth-background";
import type { Country } from "@/constants/countries";
import {
  Check,
  ChevronRight,
  User,
  MapPin,
  Camera,
  Trophy,
  Mail,
  Phone,
  Calendar,
  Lock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GoogleButton,
  SocialAuthDivider,
} from "@/components/social-auth-buttons";
import { VILLES } from "@/constants/villes";
import { COMMUNES } from "@/constants/communes";

// Schéma de validation amélioré avec des messages d'erreur plus descriptifs
const signupSchema = z.object({
  firstName: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom ne peut pas dépasser 50 caractères"),
  lastName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  email: z.string().email("Format d'email invalide. Exemple: nom@domaine.com"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(
      /[A-Z]/,
      "Le mot de passe doit contenir au moins une lettre majuscule"
    )
    .regex(
      /[a-z]/,
      "Le mot de passe doit contenir au moins une lettre minuscule"
    )
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
  dateOfBirth: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      return age - 1 >= 13;
    }

    return age >= 13;
  }, "Vous devez avoir au moins 13 ans pour vous inscrire"),
  countryCode: z.string().min(1, "Veuillez sélectionner un pays"),
  phoneNumber: z
    .string()
    .optional()
    .refine((val) => {
      // Si la valeur est vide ou undefined, la validation passe
      if (!val) return true;
      // Sinon, vérifier le format
      return /^[0-9]{6,15}$/.test(val.replace(/\s+/g, ""));
    }, "Format de numéro de téléphone invalide"),
  city: z.string().min(1, "Veuillez sélectionner une ville"),
  commune: z.string().optional(),
  address: z
    .string()
    .min(5, "L'adresse doit contenir au moins 5 caractères")
    .max(100, "L'adresse ne peut pas dépasser 100 caractères"),
  photo: z.any().optional(),
  role: z.enum(["ORGANIZER", "PARTICIPANT"]),
  competitionCategory: z.string().optional(),
});

type FormData = z.infer<typeof signupSchema>;

// Fonction pour calculer la force du mot de passe
function calculatePasswordStrength(password: string): number {
  if (!password) return 0;

  let strength = 0;

  // Longueur
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;

  // Complexité
  if (/[A-Z]/.test(password)) strength += 20; // Majuscules
  if (/[a-z]/.test(password)) strength += 20; // Minuscules
  if (/[0-9]/.test(password)) strength += 20; // Chiffres
  if (/[^A-Za-z0-9]/.test(password)) strength += 10; // Caractères spéciaux

  return Math.min(strength, 100);
}

// Fonction pour obtenir la couleur de la barre de progression
function getPasswordStrengthColor(strength: number): string {
  if (strength < 40) return "bg-red-500";
  if (strength < 70) return "bg-yellow-500";
  return "bg-green-500";
}

// Fonction pour obtenir le texte de la force du mot de passe
function getPasswordStrengthText(strength: number): string {
  if (strength < 40) return "Faible";
  if (strength < 70) return "Moyen";
  return "Fort";
}

// Fonction utilitaire pour convertir le code pays en clé de VILLES
function getVillesKey(countryCode: string): keyof typeof VILLES | undefined {
  if (!countryCode) return undefined;
  switch (countryCode.toUpperCase()) {
    case "FR":
      return "france";
    case "SN":
      return "senegal";
    case "CI":
      return "cote_ivoire";
    default:
      return undefined;
  }
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole =
    searchParams.get("role") === "organizer" ? "ORGANIZER" : "PARTICIPANT";

  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<"email" | "phone" | "google">(
    "email"
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [dialCode, setDialCode] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formProgress, setFormProgress] = useState({
    step1: 0,
    step2: 0,
    step3: 0,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      dateOfBirth: "",
      countryCode: "",
      phoneNumber: "",
      city: "",
      commune: "",
      address: "",
      role: defaultRole,
      competitionCategory: defaultRole === "ORGANIZER" ? "FOOTBALL" : undefined,
    },
    mode: "onChange", // Active la validation en temps réel
  });

  // Observer les valeurs du formulaire pour mettre à jour la progression
  const watchedValues = form.watch();

  // Mettre à jour la force du mot de passe
  useEffect(() => {
    const password = form.watch("password");
    setPasswordStrength(calculatePasswordStrength(password));
  }, [form.watch("password")]);

  // Calculer la progression du formulaire
  useEffect(() => {
    // Utilisons une fonction pour calculer la progression
    const calculateProgress = () => {
      // Étape 1
      const step1Fields = [
        "firstName",
        "lastName",
        "email",
        "password",
        "dateOfBirth",
      ];
      const step1Valid = step1Fields.filter((field) => {
        const value = form.getValues(field as keyof FormData);
        return value && !form.formState.errors[field as keyof FormData];
      }).length;

      // Étape 2
      const step2Fields = ["countryCode", "city", "address"];
      const step2Valid = step2Fields.filter((field) => {
        const value = form.getValues(field as keyof FormData);
        return value && !form.formState.errors[field as keyof FormData];
      }).length;

      // Étape 3
      const step3Fields = ["role"];
      const role = form.getValues("role");
      if (role === "ORGANIZER") {
        step3Fields.push("competitionCategory");
      }
      const step3Valid = step3Fields.filter((field) => {
        const value = form.getValues(field as keyof FormData);
        return value && !form.formState.errors[field as keyof FormData];
      }).length;

      return {
        step1: Math.round((step1Valid / step1Fields.length) * 100),
        step2: Math.round((step2Valid / step2Fields.length) * 100),
        step3: Math.round((step3Valid / step3Fields.length) * 100),
      };
    };

    // Mettre à jour la progression
    const newProgress = calculateProgress();
    setFormProgress(newProgress);

    // Dépendances spécifiques au lieu de watchedValues
  }, [
    form.formState.errors,
    form.formState.touchedFields,
    form.getValues("role"),
  ]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille de l'image ne doit pas dépasser 5MB",
          variant: "destructive",
        });
        return;
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Type de fichier non supporté",
          description: "Veuillez sélectionner une image (JPG, PNG, etc.)",
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
    }
  };

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setDialCode(country.dialCode);
  };

  const nextStep = async () => {
    if (currentStep === 1) {
      const step1Fields = [
        "firstName",
        "lastName",
        "email",
        "password",
        "dateOfBirth",
      ];
      const step1Valid = await Promise.all(
        step1Fields.map((field) => form.trigger(field as keyof FormData))
      );

      if (step1Valid.every(Boolean)) {
        setCurrentStep(2);
      } else {
        // Mettre en évidence les champs avec erreur
        toast({
          title: "Formulaire incomplet",
          description: "Veuillez corriger les erreurs avant de continuer",
          variant: "destructive",
        });
      }
    } else if (currentStep === 2) {
      const step2Fields = ["countryCode", "city", "address"];
      const step2Valid = await Promise.all(
        step2Fields.map((field) => form.trigger(field as keyof FormData))
      );

      if (step2Valid.every(Boolean)) {
        setCurrentStep(3);
      } else {
        toast({
          title: "Formulaire incomplet",
          description: "Veuillez corriger les erreurs avant de continuer",
          variant: "destructive",
        });
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (values: FormData) => {
    try {
      setIsLoading(true);

      // Upload photo if provided
      let photoUrl = null;
      if (photoFile) {
        try {
          photoUrl = await uploadImage(photoFile);
        } catch (error) {
          toast({
            title: "Erreur",
            description:
              "Impossible de télécharger l'image. L'inscription continuera sans photo.",
            variant: "destructive",
          });
          // Continue without photo
        }
      }

      // Format phone number with country code
      const formattedPhoneNumber = values.phoneNumber
        ? `${dialCode}${values.phoneNumber.replace(/^0+/, "")}`
        : undefined;

      // Create user
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
          dateOfBirth: values.dateOfBirth,
          country: values.countryCode,
          city: values.city,
          commune: values.commune,
          address: values.address,
          phoneNumber: formattedPhoneNumber,
          photoUrl,
          role: values.role,
          competitionCategory: values.competitionCategory,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Une erreur est survenue lors de l'inscription"
        );
      }

      toast({
        title: "Inscription réussie",
        description: "Vous pouvez maintenant vous connecter",
      });

      router.push("/signin");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error.message || "Une erreur est survenue lors de l'inscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const role = form.watch("role");
  const countryCode = form.watch("countryCode");
  const city = form.watch("city");
  const commune = form.watch("commune");

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } },
  };

  // Fonction pour vérifier si un champ est valide
  const isFieldValid = (fieldName: keyof FormData) => {
    const value = form.getValues(fieldName);
    return value && !form.formState.errors[fieldName];
  };

  // Composant pour afficher l'état de validation d'un champ
  const ValidationStatus = ({ fieldName }: { fieldName: keyof FormData }) => {
    const value = form.getValues(fieldName);
    const error = form.formState.errors[fieldName];
    const touched = form.formState.touchedFields[fieldName];

    if (!value || !touched) return null;

    return error ? (
      <AlertCircle className="h-5 w-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
    ) : (
      <CheckCircle2 className="h-5 w-5 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />
    );
  };

  return (
    <AuthBackground variant="signup">
      <div className="container max-w-6xl flex-1 flex items-center justify-center py-12">
        <Card className="w-full max-w-4xl shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-primary/10">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-5">
              {/* Sidebar with steps */}
              <div className="hidden md:flex flex-col bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-l-lg">
                <div className="text-xl font-bold mb-8 flex items-center gap-2">
                  <Trophy className="h-6 w-6" />
                  e-compétition
                </div>
                <div className="space-y-6 flex-1">
                  <div
                    className={`flex items-center space-x-3 ${
                      currentStep >= 1 ? "text-white" : "text-white/60"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= 1
                          ? "bg-white text-blue-600"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {currentStep > 1 ? <Check className="h-5 w-5" /> : "1"}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Informations personnelles</p>
                      <p className="text-xs opacity-80">
                        Identité et connexion
                      </p>
                      <Progress
                        value={formProgress.step1}
                        className="h-1 mt-1 bg-white/20"
                      />
                    </div>
                  </div>

                  <div
                    className={`flex items-center space-x-3 ${
                      currentStep >= 2 ? "text-white" : "text-white/60"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= 2
                          ? "bg-white text-blue-600"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {currentStep > 2 ? <Check className="h-5 w-5" /> : "2"}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Localisation</p>
                      <p className="text-xs opacity-80">Pays et adresse</p>
                      <Progress
                        value={formProgress.step2}
                        className="h-1 mt-1 bg-white/20"
                      />
                    </div>
                  </div>

                  <div
                    className={`flex items-center space-x-3 ${
                      currentStep >= 3 ? "text-white" : "text-white/60"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= 3
                          ? "bg-white text-blue-600"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {currentStep > 3 ? <Check className="h-5 w-5" /> : "3"}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Profil</p>
                      <p className="text-xs opacity-80">Photo et préférences</p>
                      <Progress
                        value={formProgress.step3}
                        className="h-1 mt-1 bg-white/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  <p className="text-sm opacity-80">Déjà inscrit ?</p>
                  <Link
                    href="/signin"
                    className="text-sm font-medium underline"
                  >
                    Se connecter
                  </Link>
                </div>
              </div>

              {/* Form content */}
              <div className="col-span-4 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">Créer un compte</h1>
                  <div className="md:hidden">
                    <p className="text-sm text-muted-foreground">
                      Étape {currentStep} sur 3
                    </p>
                  </div>
                </div>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    {/* Step 1: Personal Information */}
                    <AnimatePresence mode="wait">
                      {currentStep === 1 && (
                        <motion.div
                          className="space-y-4"
                          key="step1"
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={stepVariants}
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <User className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-medium">
                              Informations personnelles
                            </h2>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-1.5">
                                    <User className="h-4 w-4 text-primary" />
                                    Prénom
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        placeholder="John"
                                        {...field}
                                        className={`bg-white/80 backdrop-blur-sm transition-all ${
                                          form.formState.errors.firstName
                                            ? "border-red-500 focus-visible:ring-red-500"
                                            : isFieldValid("firstName")
                                            ? "border-green-500 focus-visible:ring-green-500"
                                            : "border-primary/20 hover:border-primary/40"
                                        }`}
                                      />
                                      <ValidationStatus fieldName="firstName" />
                                    </div>
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
                                  <FormLabel className="flex items-center gap-1.5">
                                    <User className="h-4 w-4 text-primary" />
                                    Nom
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        placeholder="Doe"
                                        {...field}
                                        className={`bg-white/80 backdrop-blur-sm transition-all ${
                                          form.formState.errors.lastName
                                            ? "border-red-500 focus-visible:ring-red-500"
                                            : isFieldValid("lastName")
                                            ? "border-green-500 focus-visible:ring-green-500"
                                            : "border-primary/20 hover:border-primary/40"
                                        }`}
                                      />
                                      <ValidationStatus fieldName="lastName" />
                                    </div>
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
                                <FormLabel className="flex items-center gap-1.5">
                                  <Mail className="h-4 w-4 text-primary" />
                                  Email
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      placeholder="john.doe@example.com"
                                      type="email"
                                      {...field}
                                      className={`bg-white/80 backdrop-blur-sm transition-all ${
                                        form.formState.errors.email
                                          ? "border-red-500 focus-visible:ring-red-500"
                                          : isFieldValid("email")
                                          ? "border-green-500 focus-visible:ring-green-500"
                                          : "border-primary/20 hover:border-primary/40"
                                      }`}
                                    />
                                    <ValidationStatus fieldName="email" />
                                  </div>
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
                                <FormLabel className="flex items-center gap-1.5">
                                  <Lock className="h-4 w-4 text-primary" />
                                  Mot de passe
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      placeholder="********"
                                      type="password"
                                      {...field}
                                      className={`bg-white/80 backdrop-blur-sm transition-all ${
                                        form.formState.errors.password
                                          ? "border-red-500 focus-visible:ring-red-500"
                                          : isFieldValid("password")
                                          ? "border-green-500 focus-visible:ring-green-500"
                                          : "border-primary/20 hover:border-primary/40"
                                      }`}
                                    />
                                    <ValidationStatus fieldName="password" />
                                  </div>
                                </FormControl>
                                {field.value && (
                                  <div className="mt-2">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs">
                                        Force du mot de passe:
                                      </span>
                                      <span
                                        className={`text-xs font-medium ${
                                          passwordStrength < 40
                                            ? "text-red-500"
                                            : passwordStrength < 70
                                            ? "text-yellow-500"
                                            : "text-green-500"
                                        }`}
                                      >
                                        {getPasswordStrengthText(
                                          passwordStrength
                                        )}
                                      </span>
                                    </div>
                                    <Progress
                                      value={passwordStrength}
                                      className={`h-1 ${getPasswordStrengthColor(
                                        passwordStrength
                                      )}`}
                                    />
                                    <ul className="text-xs mt-2 space-y-1 text-muted-foreground">
                                      <li
                                        className={`flex items-center gap-1 ${
                                          /[A-Z]/.test(field.value)
                                            ? "text-green-500"
                                            : ""
                                        }`}
                                      >
                                        {/[A-Z]/.test(field.value) ? (
                                          <CheckCircle2 className="h-3 w-3" />
                                        ) : (
                                          <AlertCircle className="h-3 w-3" />
                                        )}
                                        Au moins une lettre majuscule
                                      </li>
                                      <li
                                        className={`flex items-center gap-1 ${
                                          /[a-z]/.test(field.value)
                                            ? "text-green-500"
                                            : ""
                                        }`}
                                      >
                                        {/[a-z]/.test(field.value) ? (
                                          <CheckCircle2 className="h-3 w-3" />
                                        ) : (
                                          <AlertCircle className="h-3 w-3" />
                                        )}
                                        Au moins une lettre minuscule
                                      </li>
                                      <li
                                        className={`flex items-center gap-1 ${
                                          /[0-9]/.test(field.value)
                                            ? "text-green-500"
                                            : ""
                                        }`}
                                      >
                                        {/[0-9]/.test(field.value) ? (
                                          <CheckCircle2 className="h-3 w-3" />
                                        ) : (
                                          <AlertCircle className="h-3 w-3" />
                                        )}
                                        Au moins un chiffre
                                      </li>
                                      <li
                                        className={`flex items-center gap-1 ${
                                          field.value.length >= 8
                                            ? "text-green-500"
                                            : ""
                                        }`}
                                      >
                                        {field.value.length >= 8 ? (
                                          <CheckCircle2 className="h-3 w-3" />
                                        ) : (
                                          <AlertCircle className="h-3 w-3" />
                                        )}
                                        Au moins 8 caractères
                                      </li>
                                    </ul>
                                  </div>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="dateOfBirth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-1.5">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  Date de naissance
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type="date"
                                      {...field}
                                      className={`bg-white/80 backdrop-blur-sm transition-all ${
                                        form.formState.errors.dateOfBirth
                                          ? "border-red-500 focus-visible:ring-red-500"
                                          : isFieldValid("dateOfBirth")
                                          ? "border-green-500 focus-visible:ring-green-500"
                                          : "border-primary/20 hover:border-primary/40"
                                      }`}
                                    />
                                    <ValidationStatus fieldName="dateOfBirth" />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Vous devez avoir au moins 13 ans pour vous
                                  inscrire
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                      )}

                      {/* Step 2: Location */}
                      {currentStep === 2 && (
                        <motion.div
                          className="space-y-4"
                          key="step2"
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={stepVariants}
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <MapPin className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-medium">
                              Localisation
                            </h2>
                          </div>

                          <FormField
                            control={form.control}
                            name="countryCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-1.5">
                                  <MapPin className="h-4 w-4 text-primary" />
                                  Pays
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <CountrySelector
                                      value={field.value}
                                      onChange={field.onChange}
                                      onCountryChange={handleCountryChange}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 gap-4">
                            <FormField
                              control={form.control}
                              name="city"
                              render={({ field }) => {
                                const villesKey = getVillesKey(countryCode);
                                return (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                      <MapPin className="h-4 w-4 text-primary" />
                                      Ville
                                    </FormLabel>
                                    <FormControl>
                                      <Select
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          form.setValue("commune", ""); // reset commune
                                        }}
                                        value={field.value}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Sélectionner une ville" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {villesKey &&
                                          VILLES[villesKey] &&
                                          VILLES[villesKey].length > 0 ? (
                                            VILLES[villesKey].map(
                                              (ville: {
                                                value: string;
                                                label: string;
                                              }) => (
                                                <SelectItem
                                                  key={ville.value}
                                                  value={ville.value}
                                                >
                                                  {ville.label}
                                                </SelectItem>
                                              )
                                            )
                                          ) : (
                                            <SelectItem
                                              value="__none__"
                                              disabled
                                            >
                                              Aucune ville disponible
                                            </SelectItem>
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                );
                              }}
                            />

                            <FormField
                              control={form.control}
                              name="commune"
                              render={({ field }) => {
                                const communes = city
                                  ? COMMUNES[city as keyof typeof COMMUNES] ||
                                    []
                                  : [];
                                return (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                      <MapPin className="h-4 w-4 text-primary" />
                                      Commune
                                    </FormLabel>
                                    <FormControl>
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={
                                          !city || communes.length === 0
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Sélectionner une commune" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {communes.length > 0 ? (
                                            communes.map((commune) => (
                                              <SelectItem
                                                key={commune.value}
                                                value={commune.value}
                                              >
                                                {commune.label}
                                              </SelectItem>
                                            ))
                                          ) : (
                                            <SelectItem
                                              value="__none__"
                                              disabled
                                            >
                                              Aucune commune disponible
                                            </SelectItem>
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormDescription>
                                      {!city
                                        ? "Sélectionnez d'abord une ville"
                                        : communes.length === 0
                                        ? "Aucune commune disponible pour cette ville"
                                        : "Sélectionnez votre commune"}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                );
                              }}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-1.5">
                                  <MapPin className="h-4 w-4 text-primary" />
                                  Adresse
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      placeholder="123 Rue Example"
                                      {...field}
                                      className={`bg-white/80 backdrop-blur-sm transition-all ${
                                        form.formState.errors.address
                                          ? "border-red-500 focus-visible:ring-red-500"
                                          : isFieldValid("address")
                                          ? "border-green-500 focus-visible:ring-green-500"
                                          : "border-primary/20 hover:border-primary/40"
                                      }`}
                                    />
                                    <ValidationStatus fieldName="address" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-1.5">
                                  <Phone className="h-4 w-4 text-primary" />
                                  Numéro de téléphone
                                </FormLabel>
                                <FormControl>
                                  <PhoneInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    countryCode={countryCode}
                                    onCountryCodeChange={(code) =>
                                      form.setValue("countryCode", code)
                                    }
                                    onDialCodeChange={setDialCode}
                                    placeholder="Numéro de téléphone"
                                    className={`${
                                      form.formState.errors.phoneNumber
                                        ? "border-red-500 focus-visible:ring-red-500"
                                        : field.value &&
                                          !form.formState.errors.phoneNumber
                                        ? "border-green-500 focus-visible:ring-green-500"
                                        : ""
                                    }`}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Optionnel - Utilisé pour les notifications
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                      )}

                      {/* Step 3: Profile */}
                      {currentStep === 3 && (
                        <motion.div
                          className="space-y-4"
                          key="step3"
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={stepVariants}
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <Camera className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-medium">Profil</h2>
                          </div>

                          <FormField
                            control={form.control}
                            name="photo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-1.5">
                                  <Camera className="h-4 w-4 text-primary" />
                                  Photo de profil
                                </FormLabel>
                                <FormControl>
                                  <div className="flex flex-col items-center gap-4">
                                    <div className="relative h-32 w-32 overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center border-2 border-primary/20">
                                      {photoPreview ? (
                                        <img
                                          src={
                                            photoPreview || "/placeholder.svg"
                                          }
                                          alt="Preview"
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
                                  </div>
                                </FormControl>
                                <FormDescription className="text-center">
                                  Optionnel - Ajoutez une photo de profil (max
                                  5MB)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex items-center gap-2 mt-8 mb-2">
                            <Trophy className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-medium">
                              Type de compte
                            </h2>
                          </div>

                          <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Je souhaite</FormLabel>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                  <Button
                                    type="button"
                                    variant={
                                      field.value === "ORGANIZER"
                                        ? "default"
                                        : "outline"
                                    }
                                    className={`h-auto py-6 flex flex-col items-center justify-center gap-2 ${
                                      field.value === "ORGANIZER"
                                        ? "ring-2 ring-primary bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                                        : "bg-white/80 backdrop-blur-sm hover:bg-white/90"
                                    }`}
                                    onClick={() =>
                                      form.setValue("role", "ORGANIZER")
                                    }
                                  >
                                    <Trophy className="h-8 w-8" />
                                    <div className="text-center">
                                      <div className="font-medium">
                                        Organiser
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Créer et gérer des compétitions
                                      </div>
                                    </div>
                                  </Button>

                                  <Button
                                    type="button"
                                    variant={
                                      field.value === "PARTICIPANT"
                                        ? "default"
                                        : "outline"
                                    }
                                    className={`h-auto py-6 flex flex-col items-center justify-center gap-2 ${
                                      field.value === "PARTICIPANT"
                                        ? "ring-2 ring-primary bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                                        : "bg-white/80 backdrop-blur-sm hover:bg-white/90"
                                    }`}
                                    onClick={() =>
                                      form.setValue("role", "PARTICIPANT")
                                    }
                                  >
                                    <User className="h-8 w-8" />
                                    <div className="text-center">
                                      <div className="font-medium">
                                        Participer
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Rejoindre des compétitions
                                      </div>
                                    </div>
                                  </Button>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {role === "ORGANIZER" && (
                            <FormField
                              control={form.control}
                              name="competitionCategory"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-1.5">
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
                                      {COMPETITION_CATEGORIES.map(
                                        (category) => (
                                          <SelectItem
                                            key={category.value}
                                            value={category.value}
                                          >
                                            {category.label}
                                          </SelectItem>
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Vous pourrez organiser d'autres types de
                                    compétitions plus tard
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                          {currentStep === 3 && (
                            <div className="mt-6">
                              <SocialAuthDivider />
                              <div className="mt-4 space-y-4">
                                <GoogleButton callbackUrl="/signup" />
                                <div className="text-xs text-center text-muted-foreground">
                                  En vous connectant avec Google, vous pourrez
                                  créer un compte plus rapidement.
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Navigation buttons */}
                    <div className="flex justify-between pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
                      >
                        Précédent
                      </Button>

                      {currentStep < 3 ? (
                        <Button
                          type="button"
                          onClick={nextStep}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          Suivant
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={isLoading || !form.formState.isValid}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          {isLoading ? "Inscription en cours..." : "S'inscrire"}
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthBackground>
  );
}
