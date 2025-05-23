"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Trophy,
  MapPin,
  CalendarCheck,
  Info,
  Users,
  Calendar,
  FileText,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Clock,
  Award,
  Layers,
  Settings,
  CalendarIcon,
  Loader2,
  Upload,
  Share2,
  Globe,
  Building,
  Home,
  ImageIcon,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import {
  COMPETITION_CATEGORIES,
  TOURNAMENT_FORMATS,
} from "@/constants/categories";
import { COMPETITION_RULES } from "@/constants/competition-rules";
import { CompetitionCategory, TournamentFormat } from "@/lib/prisma-schema";
import { COUNTRIES } from "@/constants/countries";
import { CITIES } from "@/constants/villes";
import { COMMUNES } from "@/constants/communes";

// Définition du schéma de validation
const formSchema = z
  .object({
    name: z.string().min(3, {
      message: "Le nom doit contenir au moins 3 caractères.",
    }),
    description: z.string().min(10, {
      message: "La description doit contenir au moins 10 caractères.",
    }),
    category: z.nativeEnum(CompetitionCategory, {
      required_error: "Veuillez sélectionner une catégorie.",
    }),
    country: z.string().min(1, {
      message: "Veuillez sélectionner un pays.",
    }),
    city: z.string().min(1, {
      message: "Veuillez sélectionner une ville.",
    }),
    commune: z.string().optional(),
    location: z.string().min(3, {
      message: "Veuillez entrer une adresse valide.",
    }),
    venue: z.string().min(3, {
      message: "Veuillez entrer un lieu précis valide.",
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
    initialStatus: z.enum(["DRAFT", "OPEN"], {
      required_error: "Veuillez choisir le statut initial.",
    }),
    tournamentFormat: z.nativeEnum(TournamentFormat).optional(),
    isPublic: z.boolean().default(true),
    rules: z.array(z.string()).optional(),
    image: z.instanceof(File).optional(),
    banner: z.instanceof(File).optional(),
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
  const [activeTab, setActiveTab] = useState("intro");
  const [formProgress, setFormProgress] = useState(0);
  const [availableCities, setAvailableCities] = useState<
    { value: string; label: string }[]
  >([]);
  const [availableCommunes, setAvailableCommunes] = useState<
    { value: string; label: string }[]
  >([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [socialCardPreview, setSocialCardPreview] = useState<string | null>(
    null
  );
  const [competitionData, setCompetitionData] = useState<any>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const socialCardCanvasRef = useRef<HTMLCanvasElement>(null);

  // Définition du type pour le formulaire
  type FormData = z.infer<typeof formSchema>;

  // Initialisation du formulaire avec un type explicite
  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      category: undefined as any,
      country: "FR",
      city: "",
      commune: "",
      location: "",
      venue: "",
      maxParticipants: 10,
      initialStatus: "DRAFT" as const,
      isPublic: true,
      rules: [],
    },
    resolver: zodResolver(formSchema) as any,
  });

  // Mettre à jour les villes disponibles lorsque le pays change
  useEffect(() => {
    const country = form.watch("country");
    if (country) {
      const filteredCities = CITIES.filter(
        (city) => city.countryCode === country
      ).map((city) => ({
        value: city.code,
        label: city.name,
      }));
      setAvailableCities(filteredCities);
      form.setValue("city", "");
      form.setValue("commune", "");
      setAvailableCommunes([]);
    }
  }, [form.watch("country")]);

  // Mettre à jour les communes disponibles lorsque la ville change
  useEffect(() => {
    const city = form.watch("city");
    if (city) {
      const filteredCommunes = COMMUNES.filter(
        (commune) => commune.cityCode === city
      ).map((commune) => ({
        value: commune.code,
        label: commune.name,
      }));
      setAvailableCommunes(filteredCommunes);
      form.setValue("commune", "");
    }
  }, [form.watch("city")]);

  // Mettre à jour la progression du formulaire
  useEffect(() => {
    const values = form.getValues();
    let progress = 0;

    if (values.name) progress += 8;
    if (values.description) progress += 8;
    if (values.category) progress += 8;
    if (values.country) progress += 8;
    if (values.city) progress += 8;
    if (values.location) progress += 8;
    if (values.venue) progress += 8;
    if (values.registrationStartDate) progress += 8;
    if (values.registrationEndDate) progress += 8;
    if (values.startDate) progress += 8;
    if (values.endDate) progress += 8;
    if (values.maxParticipants > 1) progress += 8;
    if (values.image) progress += 6;
    if (values.banner) progress += 6;

    setFormProgress(progress);
  }, [form.watch()]);

  // Générer la carte sociale pour les réseaux sociaux
  useEffect(() => {
    if (competitionData && socialCardCanvasRef.current) {
      const canvas = socialCardCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Définir la taille du canvas
      canvas.width = 1200;
      canvas.height = 630;

      // Dessiner l'arrière-plan
      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height
      );
      gradient.addColorStop(0, "#10b981"); // emerald-500
      gradient.addColorStop(1, "#3b82f6"); // blue-500
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ajouter un overlay semi-transparent
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dessiner l'image de la compétition si disponible
      if (imagePreview) {
        const img = new globalThis.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          // Dessiner l'image avec un effet d'opacité
          if (ctx) {
            ctx.globalAlpha = 0.2;
            ctx.drawImage(img, canvas.width / 2 - 150, 50, 300, 300);
            ctx.globalAlpha = 1.0;

            // Continuer avec le reste du dessin
            drawCardContent();
          }
        };
        img.src = imagePreview;
      } else {
        drawCardContent();
      }

      function drawCardContent() {
        if (!ctx) return;

        // Ajouter le titre
        ctx.font = "bold 60px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(competitionData.title, canvas.width / 2, 400);

        // Ajouter la catégorie
        ctx.font = "bold 40px Arial";
        ctx.fillStyle = "#f0f0f0";
        ctx.fillText(
          COMPETITION_CATEGORIES.find(
            (c) => c.value === competitionData.category
          )?.label || competitionData.category,
          canvas.width / 2,
          470
        );

        // Ajouter les dates
        ctx.font = "30px Arial";
        ctx.fillStyle = "#f0f0f0";
        const startDate = competitionData.startDate
          ? format(new Date(competitionData.startDate), "dd MMMM yyyy", {
              locale: fr,
            })
          : "";
        const endDate = competitionData.endDate
          ? format(new Date(competitionData.endDate), "dd MMMM yyyy", {
              locale: fr,
            })
          : "";
        ctx.fillText(`Du ${startDate} au ${endDate}`, canvas.width / 2, 520);

        // Ajouter le lieu
        ctx.font = "30px Arial";
        ctx.fillStyle = "#f0f0f0";
        const cityName =
          availableCities.find((c) => c.value === competitionData.city)
            ?.label || competitionData.city;
        const countryName =
          COUNTRIES.find((c) => c.code === competitionData.country)?.name ||
          competitionData.country;
        ctx.fillText(
          `${competitionData.venue}, ${cityName}, ${countryName}`,
          canvas.width / 2,
          570
        );

        // Ajouter le code unique
        if (uniqueCode) {
          ctx.font = "bold 36px Arial";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(`Code: ${uniqueCode}`, canvas.width / 2, 630 - 40);
        }

        // Convertir le canvas en URL de données
        const dataUrl = canvas.toDataURL("image/png");
        setSocialCardPreview(dataUrl);
      }
    }
  }, [competitionData, imagePreview, uniqueCode, availableCities]);

  // Gérer le changement d'image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("image", file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Gérer le changement de bannière
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("banner", file);
      const reader = new FileReader();
      reader.onload = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fonction pour télécharger la carte sociale
  const downloadSocialCard = () => {
    if (socialCardPreview) {
      const link = document.createElement("a");
      link.href = socialCardPreview;
      link.download = `competition-${uniqueCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Fonction pour partager sur les réseaux sociaux
  const shareOnSocial = (platform: string) => {
    if (!competitionData) return;

    const title = encodeURIComponent(
      `Rejoignez la compétition: ${competitionData.title}`
    );
    const description = encodeURIComponent(
      `Je vous invite à participer à cette compétition de ${
        COMPETITION_CATEGORIES.find((c) => c.value === competitionData.category)
          ?.label
      }. Utilisez le code: ${uniqueCode}`
    );
    const url = encodeURIComponent(
      `https://votre-site.com/competitions/${uniqueCode}`
    );

    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${description}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${description}&url=${url}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${description} ${url}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank");
    }
  };

  // Fonction de soumission du formulaire
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Préparer les données du formulaire
      const formData = new FormData();
      formData.append("title", data.name);
      formData.append("description", data.description);
      formData.append("category", data.category);
      formData.append("country", data.country);
      formData.append("city", data.city);
      if (data.commune) formData.append("commune", data.commune);
      formData.append("address", data.location);
      formData.append("venue", data.venue);
      formData.append(
        "registrationStartDate",
        data.registrationStartDate.toISOString()
      );
      formData.append(
        "registrationDeadline",
        data.registrationEndDate.toISOString()
      );
      formData.append("startDate", data.startDate.toISOString());
      formData.append("endDate", data.endDate.toISOString());
      formData.append("maxParticipants", data.maxParticipants.toString());
      formData.append("status", data.initialStatus);
      if (data.tournamentFormat)
        formData.append("tournamentFormat", data.tournamentFormat);
      formData.append("isPublic", data.isPublic.toString());
      if (data.rules && data.rules.length > 0)
        formData.append("rules", data.rules.join(", "));
      if (data.image) formData.append("image", data.image);
      if (data.banner) formData.append("banner", data.banner);

      // Envoyer les données au serveur
      const response = await fetch("/api/competitions", {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error || "Erreur lors de la création de la compétition"
        );
      }

      // Stocker les données de la compétition pour la prévisualisation
      setCompetitionData({
        ...data,
        id: responseData.competition.id,
      });

      setUniqueCode(responseData.competition.uniqueCode);
      toast({
        title: "Compétition créée avec succès!",
        description:
          "Votre compétition a été créée et est prête à être partagée.",
        variant: "success",
      });

      // Passer à l'onglet de prévisualisation
      setActiveTab("preview");
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
  };

  const goToNextTab = () => {
    if (activeTab === "intro") {
      setActiveTab("details");
    } else if (activeTab === "details") {
      // Valider les champs de l'onglet détails avant de passer à l'onglet suivant
      form.trigger([
        "name",
        "description",
        "category",
        "country",
        "city",
        "location",
        "venue",
      ]);
      const hasErrors =
        !!form.formState.errors.name ||
        !!form.formState.errors.description ||
        !!form.formState.errors.category ||
        !!form.formState.errors.country ||
        !!form.formState.errors.city ||
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
        setActiveTab("format");
      }
    } else if (activeTab === "format") {
      setActiveTab("media");
    } else if (activeTab === "media") {
      setActiveTab("rules");
    }
  };

  const goToPreviousTab = () => {
    if (activeTab === "details") {
      setActiveTab("intro");
    } else if (activeTab === "dates") {
      setActiveTab("details");
    } else if (activeTab === "format") {
      setActiveTab("dates");
    } else if (activeTab === "media") {
      setActiveTab("format");
    } else if (activeTab === "rules") {
      setActiveTab("media");
    }
  };

  const handleViewDetails = () => {
    if (uniqueCode) {
      router.push(`/organizer/competitions/${uniqueCode}`);
    }
  };

  const handleDashboard = () => {
    router.push("/organizer/dashboard");
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="w-full shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                Créer une nouvelle compétition
              </CardTitle>
              <CardDescription className="text-gray-100">
                Organisez votre événement sportif en quelques étapes simples
              </CardDescription>
              {formProgress > 0 && (
                <div className="w-full bg-white/20 rounded-full h-2.5 mt-4">
                  <div
                    className="bg-white h-2.5 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${formProgress}%` }}
                  ></div>
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              {uniqueCode && activeTab === "preview" ? (
                <div className="space-y-8">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold">
                      Compétition créée avec succès!
                    </h2>
                    <p className="text-gray-500">
                      Votre compétition a été créée et est prête à être
                      partagée. Utilisez la carte ci-dessous pour promouvoir
                      votre événement sur les réseaux sociaux.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-blue-600" />
                      Carte pour les réseaux sociaux
                    </h3>
                    <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-lg shadow-md mb-4">
                      {socialCardPreview ? (
                        <Image
                          src={
                            socialCardPreview ||
                            "/placeholder.svg?height=200&width=200&query=placeholder"
                          }
                          alt="Carte sociale pour les réseaux sociaux"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                        </div>
                      )}
                    </div>
                    <canvas ref={socialCardCanvasRef} className="hidden" />

                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button
                        variant="outline"
                        className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                        onClick={() => shareOnSocial("facebook")}
                      >
                        <Facebook className="mr-2 h-4 w-4" />
                        Partager sur Facebook
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100"
                        onClick={() => shareOnSocial("twitter")}
                      >
                        <Twitter className="mr-2 h-4 w-4" />
                        Partager sur Twitter
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100"
                        onClick={() => shareOnSocial("instagram")}
                      >
                        <Instagram className="mr-2 h-4 w-4" />
                        Partager sur Instagram
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                        onClick={downloadSocialCard}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger l'image
                      </Button>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-blue-700">
                      <Info className="h-5 w-5" />
                      Code unique de la compétition
                    </h3>
                    <div className="flex items-center justify-center p-3 bg-white rounded-md border border-blue-200 mb-2">
                      <span className="text-2xl font-mono font-bold text-blue-700">
                        {uniqueCode}
                      </span>
                    </div>
                    <p className="text-sm text-blue-600 text-center">
                      Partagez ce code avec les participants pour qu'ils
                      puissent rejoindre votre compétition.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={handleViewDetails}
                      className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Voir les détails de la compétition
                    </Button>
                    <Button variant="outline" onClick={handleDashboard}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Retour au tableau de bord
                    </Button>
                  </div>
                </div>
              ) : (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit as any)}
                    className="space-y-6"
                  >
                    <Tabs
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger
                          value="intro"
                          className="flex flex-col items-center gap-1 py-2"
                        >
                          <Info className="h-4 w-4" />
                          <span className="hidden sm:inline">Intro</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="details"
                          className="flex flex-col items-center gap-1 py-2"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="hidden sm:inline">Détails</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="dates"
                          className="flex flex-col items-center gap-1 py-2"
                        >
                          <Calendar className="h-4 w-4" />
                          <span className="hidden sm:inline">Dates</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="format"
                          className="flex flex-col items-center gap-1 py-2"
                        >
                          <Layers className="h-4 w-4" />
                          <span className="hidden sm:inline">Format</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="media"
                          className="flex flex-col items-center gap-1 py-2"
                        >
                          <ImageIcon className="h-4 w-4" />
                          <span className="hidden sm:inline">Médias</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="rules"
                          className="flex flex-col items-center gap-1 py-2"
                        >
                          <Settings className="h-4 w-4" />
                          <span className="hidden sm:inline">Règles</span>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="intro" className="space-y-4 pt-4">
                        <AnimatePresence mode="wait">
                          <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={fadeIn}
                            className="space-y-6"
                          >
                            <div className="relative h-40 w-full overflow-hidden rounded-lg mb-6">
                              <Image
                                src="/placeholder.svg?height=400&width=800&query=sports competition organization"
                                alt="Organisation de compétition sportive"
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                                <h3 className="text-white text-xl font-bold">
                                  Bienvenue dans l'assistant de création
                                </h3>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h2 className="text-2xl font-bold text-center">
                                Créez votre compétition en 6 étapes
                              </h2>
                              <p className="text-muted-foreground text-center">
                                Suivez ce guide pour configurer votre
                                compétition rapidement et efficacement.
                              </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <Card className="border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
                                    <FileText className="h-5 w-5" />
                                    1. Informations générales
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm text-emerald-800">
                                    Donnez un nom accrocheur et une description
                                    détaillée de votre compétition.
                                  </p>
                                </CardContent>
                              </Card>

                              <Card className="border border-blue-100 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                                    <Calendar className="h-5 w-5" />
                                    2. Dates importantes
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm text-blue-800">
                                    Définissez les dates d'inscription et de
                                    déroulement de la compétition.
                                  </p>
                                </CardContent>
                              </Card>

                              <Card className="border border-purple-100 bg-purple-50/50 hover:bg-purple-50 transition-colors">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
                                    <Layers className="h-5 w-5" />
                                    3. Format du tournoi
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm text-purple-800">
                                    Choisissez le format qui convient le mieux à
                                    votre compétition.
                                  </p>
                                </CardContent>
                              </Card>

                              <Card className="border border-pink-100 bg-pink-50/50 hover:bg-pink-50 transition-colors">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg flex items-center gap-2 text-pink-700">
                                    <ImageIcon className="h-5 w-5" />
                                    4. Médias et visuels
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm text-pink-800">
                                    Ajoutez des images attrayantes pour
                                    promouvoir votre compétition.
                                  </p>
                                </CardContent>
                              </Card>

                              <Card className="border border-amber-100 bg-amber-50/50 hover:bg-amber-50 transition-colors md:col-span-2">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
                                    <Settings className="h-5 w-5" />
                                    5. Règles et paramètres
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm text-amber-800">
                                    Définissez les règles pour une compétition
                                    équitable et bien organisée.
                                  </p>
                                </CardContent>
                              </Card>
                            </div>

                            <Alert className="bg-blue-50 border-blue-200">
                              <Info className="h-4 w-4 text-blue-600" />
                              <AlertTitle className="text-blue-800">
                                Conseil
                              </AlertTitle>
                              <AlertDescription className="text-blue-700">
                                Une fois la compétition créée, vous recevrez un
                                code unique à partager avec les participants et
                                une carte pour les réseaux sociaux.
                              </AlertDescription>
                            </Alert>

                            <div className="flex justify-end">
                              <Button
                                type="button"
                                onClick={goToNextTab}
                                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
                              >
                                Commencer
                                <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </TabsContent>

                      <TabsContent value="details" className="space-y-4 pt-4">
                        <AnimatePresence mode="wait">
                          <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={fadeIn}
                            className="space-y-6"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="md:col-span-2">
                                <FormField
                                  control={form.control as any}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="flex items-center gap-2">
                                        <Trophy className="h-4 w-4 text-emerald-600" />
                                        Nom de la compétition
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Ex: Tournoi de football inter-écoles 2023"
                                          {...field}
                                          className="border-emerald-200 focus-visible:ring-emerald-500"
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        Choisissez un nom clair et mémorable
                                        pour votre compétition.
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="md:col-span-2">
                                <FormField
                                  control={form.control as any}
                                  name="description"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-600" />
                                        Description
                                      </FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="Décrivez votre compétition en détail..."
                                          className="min-h-[120px] border-blue-200 focus-visible:ring-blue-500"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        Donnez des détails sur l'objectif, les
                                        participants attendus et tout autre
                                        information pertinente.
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control as any}
                                name="category"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      <Layers className="h-4 w-4 text-purple-600" />
                                      Catégorie
                                    </FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="border-purple-200 focus-visible:ring-purple-500">
                                          <SelectValue placeholder="Sélectionnez une catégorie" />
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
                                      La catégorie détermine le type de sport ou
                                      d'activité.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control as any}
                                name="country"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      <Globe className="h-4 w-4 text-emerald-600" />
                                      Pays
                                    </FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="border-emerald-200 focus-visible:ring-emerald-500">
                                          <SelectValue placeholder="Sélectionnez un pays" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {COUNTRIES.map((country) => (
                                          <SelectItem
                                            key={country.code}
                                            value={country.code}
                                          >
                                            <div className="flex items-center">
                                              <span className="mr-2">
                                                {country.flag}
                                              </span>
                                              <span>{country.name}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Pays où se déroulera la compétition.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control as any}
                                name="city"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      <Building className="h-4 w-4 text-blue-600" />
                                      Ville
                                    </FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                      disabled={!form.watch("country")}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="border-blue-200 focus-visible:ring-blue-500">
                                          <SelectValue placeholder="Sélectionnez une ville" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {availableCities.map((city) => (
                                          <SelectItem
                                            key={city.value}
                                            value={city.value}
                                          >
                                            {city.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Ville où se déroulera la compétition.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control as any}
                                name="commune"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      <Home className="h-4 w-4 text-amber-600" />
                                      Commune / Quartier
                                    </FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                      disabled={!form.watch("city")}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="border-amber-200 focus-visible:ring-amber-500">
                                          <SelectValue placeholder="Sélectionnez une commune (optionnel)" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {availableCommunes.map((commune) => (
                                          <SelectItem
                                            key={commune.value}
                                            value={commune.value}
                                          >
                                            {commune.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Commune ou quartier où se déroulera la
                                      compétition (optionnel).
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control as any}
                                name="location"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-red-600" />
                                      Adresse
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Ex: 123 Rue du Sport"
                                        {...field}
                                        className="border-red-200 focus-visible:ring-red-500"
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Indiquez l'adresse précise où se déroulera
                                      la compétition.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control as any}
                                name="venue"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-purple-600" />
                                      Lieu précis
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Ex: Stade Municipal, Université X"
                                        {...field}
                                        className="border-purple-200 focus-visible:ring-purple-500"
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Précisez le nom de l'établissement ou du
                                      lieu exact.
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
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Précédent
                              </Button>
                              <Button
                                type="button"
                                onClick={goToNextTab}
                                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
                              >
                                Suivant
                                <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </TabsContent>

                      <TabsContent value="dates" className="space-y-4 pt-4">
                        <AnimatePresence mode="wait">
                          <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={fadeIn}
                            className="space-y-6"
                          >
                            <Alert className="bg-blue-50 border-blue-200">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <AlertTitle className="text-blue-800">
                                Planification des dates
                              </AlertTitle>
                              <AlertDescription className="text-blue-700">
                                Assurez-vous que les dates d'inscription sont
                                antérieures aux dates de la compétition.
                              </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-emerald-700">
                                  <CalendarCheck className="h-5 w-5" />
                                  Période d'inscription
                                </h3>

                                <FormField
                                  control={form.control as any}
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
                                              className={`w-full pl-3 text-left font-normal border-emerald-200 ${
                                                !field.value &&
                                                "text-muted-foreground"
                                              }`}
                                            >
                                              {field.value ? (
                                                format(field.value, "PPP", {
                                                  locale: fr,
                                                })
                                              ) : (
                                                <span>
                                                  Sélectionnez une date
                                                </span>
                                              )}
                                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="w-auto p-0"
                                          align="start"
                                        >
                                          <CalendarComponent
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                              date < new Date()
                                            }
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                      <FormDescription>
                                        Date à partir de laquelle les
                                        participants peuvent s'inscrire.
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control as any}
                                  name="registrationEndDate"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                      <FormLabel>
                                        Date limite d'inscription
                                      </FormLabel>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            <Button
                                              variant={"outline"}
                                              className={`w-full pl-3 text-left font-normal border-red-200 ${
                                                !field.value &&
                                                "text-muted-foreground"
                                              }`}
                                            >
                                              {field.value ? (
                                                format(field.value, "PPP", {
                                                  locale: fr,
                                                })
                                              ) : (
                                                <span>
                                                  Sélectionnez une date
                                                </span>
                                              )}
                                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="w-auto p-0"
                                          align="start"
                                        >
                                          <CalendarComponent
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => {
                                              const regStartDate =
                                                form.getValues(
                                                  "registrationStartDate"
                                                );
                                              return (
                                                date < new Date() ||
                                                (regStartDate &&
                                                  date < regStartDate)
                                              );
                                            }}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                      <FormDescription>
                                        Date après laquelle les inscriptions ne
                                        seront plus acceptées.
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-700">
                                  <Calendar className="h-5 w-5" />
                                  Période de la compétition
                                </h3>

                                <FormField
                                  control={form.control as any}
                                  name="startDate"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                      <FormLabel>Date de début</FormLabel>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            <Button
                                              variant={"outline"}
                                              className={`w-full pl-3 text-left font-normal border-blue-200 ${
                                                !field.value &&
                                                "text-muted-foreground"
                                              }`}
                                            >
                                              {field.value ? (
                                                format(field.value, "PPP", {
                                                  locale: fr,
                                                })
                                              ) : (
                                                <span>
                                                  Sélectionnez une date
                                                </span>
                                              )}
                                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="w-auto p-0"
                                          align="start"
                                        >
                                          <CalendarComponent
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => {
                                              const regEndDate = form.getValues(
                                                "registrationEndDate"
                                              );
                                              return (
                                                date < new Date() ||
                                                (regEndDate &&
                                                  date < regEndDate)
                                              );
                                            }}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                      <FormDescription>
                                        Date à laquelle la compétition
                                        commencera.
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control as any}
                                  name="endDate"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                      <FormLabel>Date de fin</FormLabel>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            <Button
                                              variant={"outline"}
                                              className={`w-full pl-3 text-left font-normal border-purple-200 ${
                                                !field.value &&
                                                "text-muted-foreground"
                                              }`}
                                            >
                                              {field.value ? (
                                                format(field.value, "PPP", {
                                                  locale: fr,
                                                })
                                              ) : (
                                                <span>
                                                  Sélectionnez une date
                                                </span>
                                              )}
                                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="w-auto p-0"
                                          align="start"
                                        >
                                          <CalendarComponent
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
                                      <FormDescription>
                                        Date à laquelle la compétition se
                                        terminera.
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control as any}
                                name="maxParticipants"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      <Users className="h-4 w-4 text-amber-600" />
                                      Nombre maximum de participants
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min={2}
                                        {...field}
                                        className="border-amber-200 focus-visible:ring-amber-500"
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Limitez le nombre de participants pour une
                                      meilleure organisation.
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
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Précédent
                              </Button>
                              <Button
                                type="button"
                                onClick={goToNextTab}
                                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
                              >
                                Suivant
                                <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </TabsContent>

                      <TabsContent value="format" className="space-y-4 pt-4">
                        <AnimatePresence mode="wait">
                          <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={fadeIn}
                            className="space-y-6"
                          >
                            <Alert className="bg-purple-50 border-purple-200">
                              <Layers className="h-4 w-4 text-purple-600" />
                              <AlertTitle className="text-purple-800">
                                Format du tournoi
                              </AlertTitle>
                              <AlertDescription className="text-purple-700">
                                Le format détermine comment les équipes
                                s'affronteront et comment le vainqueur sera
                                déterminé.
                              </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={form.control as any}
                                name="tournamentFormat"
                                render={({ field }) => (
                                  <FormItem className="col-span-full">
                                    <FormLabel className="text-lg font-semibold flex items-center gap-2 text-emerald-700">
                                      <Trophy className="h-5 w-5" />
                                      Format du tournoi
                                    </FormLabel>
                                    <FormDescription className="mb-4">
                                      Choisissez le format qui convient le mieux
                                      à votre compétition.
                                    </FormDescription>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      {TOURNAMENT_FORMATS.map((format) => (
                                        <div
                                          key={format.value}
                                          className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                                            field.value === format.value
                                              ? "border-emerald-500 bg-emerald-50"
                                              : "border-gray-200 hover:border-emerald-200 hover:bg-gray-50"
                                          }`}
                                          onClick={() =>
                                            field.onChange(format.value)
                                          }
                                        >
                                          {field.value === format.value && (
                                            <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-emerald-500" />
                                          )}
                                          <h4 className="font-medium mb-2">
                                            {format.label}
                                          </h4>
                                          <p className="text-sm text-gray-500">
                                            {format.value === "ROUND_ROBIN" &&
                                              "Toutes les équipes s'affrontent entre elles."}
                                            {format.value === "GROUPS" &&
                                              "Les équipes sont réparties en groupes avant les phases finales."}
                                            {format.value === "KNOCKOUT" &&
                                              "Élimination directe dès la première défaite."}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control as any}
                                name="isPublic"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel>
                                        Compétition publique
                                      </FormLabel>
                                      <FormDescription>
                                        Si activé, votre compétition sera
                                        visible dans la liste des compétitions
                                        publiques.
                                      </FormDescription>
                                    </div>
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
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Précédent
                              </Button>
                              <Button
                                type="button"
                                onClick={goToNextTab}
                                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
                              >
                                Suivant
                                <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </TabsContent>

                      <TabsContent value="media" className="space-y-4 pt-4">
                        <AnimatePresence mode="wait">
                          <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={fadeIn}
                            className="space-y-6"
                          >
                            <Alert className="bg-pink-50 border-pink-200">
                              <ImageIcon className="h-4 w-4 text-pink-600" />
                              <AlertTitle className="text-pink-800">
                                Images de la compétition
                              </AlertTitle>
                              <AlertDescription className="text-pink-700">
                                Ajoutez des images attrayantes pour promouvoir
                                votre compétition sur les réseaux sociaux.
                              </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <FormLabel className="text-lg font-semibold flex items-center gap-2 text-emerald-700 mb-4">
                                  <ImageIcon className="h-5 w-5" />
                                  Logo / Image principale
                                </FormLabel>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden">
                                  <input
                                    type="file"
                                    ref={imageInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                  />
                                  {imagePreview ? (
                                    <div className="relative aspect-square w-full overflow-hidden rounded-md">
                                      <Image
                                        src={
                                          imagePreview ||
                                          "/placeholder.svg?height=200&width=200&query=placeholder"
                                        }
                                        alt="Aperçu de l'image"
                                        fill
                                        className="object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          onClick={() =>
                                            imageInputRef.current?.click()
                                          }
                                        >
                                          Changer
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      className="flex flex-col items-center justify-center py-8"
                                      onClick={() =>
                                        imageInputRef.current?.click()
                                      }
                                    >
                                      <Upload className="h-10 w-10 text-gray-400 mb-2" />
                                      <h3 className="text-sm font-medium mb-1">
                                        Cliquez pour ajouter une image
                                      </h3>
                                      <p className="text-xs text-gray-500">
                                        SVG, PNG, JPG (max. 5MB)
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  Cette image sera utilisée comme logo principal
                                  de votre compétition.
                                </p>
                              </div>

                              <div>
                                <FormLabel className="text-lg font-semibold flex items-center gap-2 text-blue-700 mb-4">
                                  <ImageIcon className="h-5 w-5" />
                                  Bannière
                                </FormLabel>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden">
                                  <input
                                    type="file"
                                    ref={bannerInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleBannerChange}
                                  />
                                  {bannerPreview ? (
                                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md">
                                      <Image
                                        src={
                                          bannerPreview ||
                                          "/placeholder.svg?height=200&width=200&query=placeholder"
                                        }
                                        alt="Aperçu de la bannière"
                                        fill
                                        className="object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          onClick={() =>
                                            bannerInputRef.current?.click()
                                          }
                                        >
                                          Changer
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      className="flex flex-col items-center justify-center py-8"
                                      onClick={() =>
                                        bannerInputRef.current?.click()
                                      }
                                    >
                                      <Upload className="h-10 w-10 text-gray-400 mb-2" />
                                      <h3 className="text-sm font-medium mb-1">
                                        Cliquez pour ajouter une bannière
                                      </h3>
                                      <p className="text-xs text-gray-500">
                                        Format recommandé: 1200 x 630px
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  Cette image sera utilisée comme bannière sur
                                  la page de votre compétition.
                                </p>
                              </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border mt-4">
                              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-purple-700">
                                <Share2 className="h-5 w-5" />
                                Prévisualisation pour les réseaux sociaux
                              </h3>
                              <p className="text-sm text-gray-600 mb-4">
                                Une carte pour les réseaux sociaux sera
                                automatiquement générée à partir de vos
                                informations. Vous pourrez la télécharger et la
                                partager une fois la compétition créée.
                              </p>
                              <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-lg bg-gradient-to-r from-emerald-500 to-blue-500 shadow-md">
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                                  {imagePreview && (
                                    <div className="relative h-24 w-24 rounded-full overflow-hidden mb-4 border-2 border-white">
                                      <Image
                                        src={
                                          imagePreview ||
                                          "/placeholder.svg?height=200&width=200&query=placeholder"
                                        }
                                        alt="Logo"
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  )}
                                  <h2 className="text-2xl font-bold text-center mb-2">
                                    {form.watch("name") ||
                                      "Nom de votre compétition"}
                                  </h2>
                                  <p className="text-lg font-medium mb-2">
                                    {COMPETITION_CATEGORIES.find(
                                      (c) => c.value === form.watch("category")
                                    )?.label || "Catégorie"}
                                  </p>
                                  <p className="text-sm mb-1">
                                    {form.watch("startDate") &&
                                      form.watch("endDate") &&
                                      `Du ${format(
                                        form.watch("startDate"),
                                        "dd MMMM yyyy",
                                        {
                                          locale: fr,
                                        }
                                      )} au ${format(
                                        form.watch("endDate"),
                                        "dd MMMM yyyy",
                                        { locale: fr }
                                      )}`}
                                  </p>
                                  <p className="text-sm">
                                    {form.watch("venue") &&
                                      form.watch("city") &&
                                      `${form.watch("venue")}, ${
                                        availableCities.find(
                                          (c) => c.value === form.watch("city")
                                        )?.label
                                      }`}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={goToPreviousTab}
                              >
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Précédent
                              </Button>
                              <Button
                                type="button"
                                onClick={goToNextTab}
                                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
                              >
                                Suivant
                                <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </TabsContent>

                      <TabsContent value="rules" className="space-y-4 pt-4">
                        <AnimatePresence mode="wait">
                          <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={fadeIn}
                            className="space-y-6"
                          >
                            <Alert className="bg-amber-50 border-amber-200">
                              <Settings className="h-4 w-4 text-amber-600" />
                              <AlertTitle className="text-amber-800">
                                Règles de la compétition
                              </AlertTitle>
                              <AlertDescription className="text-amber-700">
                                Sélectionnez les règles qui s'appliquent à votre
                                compétition. Ces règles seront visibles par tous
                                les participants.
                              </AlertDescription>
                            </Alert>

                            <FormField
                              control={form.control as any}
                              name="initialStatus"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-lg font-semibold flex items-center gap-2 text-blue-700">
                                    <Sparkles className="h-5 w-5" />
                                    Statut initial de la compétition
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-blue-200 focus-visible:ring-blue-500">
                                        <SelectValue placeholder="Choisissez le statut initial" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="DRAFT">
                                        <div className="flex flex-col">
                                          <span className="font-medium">
                                            Brouillon
                                          </span>{" "}
                                          <span className="text-sm text-gray-500">
                                            La compétition ne sera pas visible
                                            par les participants
                                          </span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="OPEN">
                                        <div className="flex flex-col">
                                          <span className="font-medium">
                                            Publier immédiatement
                                          </span>
                                          <span className="text-sm text-gray-500">
                                            La compétition sera visible et les
                                            inscriptions s'ouvriront
                                            automatiquement
                                          </span>
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Vous pourrez modifier ce statut à tout
                                    moment après la création
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control as any}
                              name="rules"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="mb-4">
                                    <FormLabel className="text-lg font-semibold flex items-center gap-2 text-purple-700">
                                      <Award className="h-5 w-5" />
                                      Règles de la compétition
                                    </FormLabel>
                                    <FormDescription>
                                      Sélectionnez les règles qui s'appliquent à
                                      votre compétition.
                                    </FormDescription>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {COMPETITION_RULES.map((rule) => (
                                      <FormField
                                        key={rule.value}
                                        control={form.control as any}
                                        name="rules"
                                        render={({ field }) => {
                                          return (
                                            <FormItem
                                              key={rule.value}
                                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-slate-50 transition-colors"
                                            >
                                              <FormControl>
                                                <Checkbox
                                                  checked={field.value?.includes(
                                                    rule.value
                                                  )}
                                                  onCheckedChange={(
                                                    checked
                                                  ) => {
                                                    return checked
                                                      ? field.onChange([
                                                          ...(field.value ||
                                                            []),
                                                          rule.value,
                                                        ])
                                                      : field.onChange(
                                                          field.value?.filter(
                                                            (value: string) =>
                                                              value !==
                                                              rule.value
                                                          )
                                                        );
                                                  }}
                                                />
                                              </FormControl>
                                              <div className="space-y-1 leading-none">
                                                <FormLabel className="text-sm font-medium">
                                                  {rule.label}
                                                </FormLabel>
                                                <FormDescription className="text-xs">
                                                  {rule.description}
                                                </FormDescription>
                                              </div>
                                            </FormItem>
                                          );
                                        }}
                                      />
                                    ))}
                                  </div>
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
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Précédent
                              </Button>
                              <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 transition-all"
                              >
                                {isSubmitting ? (
                                  <>
                                    <span className="animate-pulse">
                                      Création en cours...
                                    </span>
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                  </>
                                ) : (
                                  <>
                                    Créer la compétition
                                    <Sparkles className="ml-2 h-4 w-4" />
                                  </>
                                )}
                              </Button>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </TabsContent>

                      <TabsContent value="preview" className="space-y-4 pt-4">
                        <AnimatePresence mode="wait">
                          <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={fadeIn}
                            className="space-y-6"
                          >
                            <div className="text-center space-y-4">
                              <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                              </div>
                              <h2 className="text-2xl font-bold">
                                Compétition créée avec succès!
                              </h2>
                              <p className="text-gray-500">
                                Votre compétition a été créée et est prête à
                                être partagée. Utilisez la carte ci-dessous pour
                                promouvoir votre événement sur les réseaux
                                sociaux.
                              </p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border">
                              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                <Share2 className="h-5 w-5 text-blue-600" />
                                Carte pour les réseaux sociaux
                              </h3>
                              <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-lg shadow-md mb-4">
                                {socialCardPreview ? (
                                  <Image
                                    src={
                                      socialCardPreview ||
                                      "/placeholder.svg?height=200&width=200&query=placeholder"
                                    }
                                    alt="Carte sociale pour les réseaux sociaux"
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                    <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                                  </div>
                                )}
                              </div>
                              <canvas
                                ref={socialCardCanvasRef}
                                className="hidden"
                              />

                              <div className="flex flex-wrap gap-2 justify-center">
                                <Button
                                  variant="outline"
                                  className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                                  onClick={() => shareOnSocial("facebook")}
                                >
                                  <Facebook className="mr-2 h-4 w-4" />
                                  Partager sur Facebook
                                </Button>
                                <Button
                                  variant="outline"
                                  className="bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100"
                                  onClick={() => shareOnSocial("twitter")}
                                >
                                  <Twitter className="mr-2 h-4 w-4" />
                                  Partager sur Twitter
                                </Button>
                                <Button
                                  variant="outline"
                                  className="bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100"
                                  onClick={() => shareOnSocial("instagram")}
                                >
                                  <Instagram className="mr-2 h-4 w-4" />
                                  Partager sur Instagram
                                </Button>
                                <Button
                                  variant="outline"
                                  className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                                  onClick={downloadSocialCard}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Télécharger l'image
                                </Button>
                              </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-blue-700">
                                <Info className="h-5 w-5" />
                                Code unique de la compétition
                              </h3>
                              <div className="flex items-center justify-center p-3 bg-white rounded-md border border-blue-200 mb-2">
                                <span className="text-2xl font-mono font-bold text-blue-700">
                                  {uniqueCode}
                                </span>
                              </div>
                              <p className="text-sm text-blue-600 text-center">
                                Partagez ce code avec les participants pour
                                qu'ils puissent rejoindre votre compétition.
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                              <Button
                                onClick={handleViewDetails}
                                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Voir les détails de la compétition
                              </Button>
                              <Button
                                variant="outline"
                                onClick={handleDashboard}
                              >
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Retour au tableau de bord
                              </Button>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </TabsContent>
                    </Tabs>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="hidden lg:block">
          <Card className="w-full sticky top-4 shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Guide de création
              </CardTitle>
              <CardDescription className="text-gray-100">
                Suivez ces étapes pour créer votre compétition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="relative h-40 w-full overflow-hidden rounded-lg mb-4">
                <Image
                  src="/placeholder.svg?height=400&width=800&query=sports tournament organization guide"
                  alt="Organisation de compétition sportive"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <div className="bg-emerald-100 text-emerald-700 rounded-full p-1 mt-0.5">
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
                  <div className="bg-blue-100 text-blue-700 rounded-full p-1 mt-0.5">
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
                  <div className="bg-purple-100 text-purple-700 rounded-full p-1 mt-0.5">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Format du tournoi</h3>
                    <p className="text-xs text-gray-500">
                      Choisissez le format qui convient le mieux à votre
                      compétition.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start space-x-2">
                  <div className="bg-pink-100 text-pink-700 rounded-full p-1 mt-0.5">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Médias et visuels</h3>
                    <p className="text-xs text-gray-500">
                      Ajoutez des images attrayantes pour promouvoir votre
                      compétition.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start space-x-2">
                  <div className="bg-amber-100 text-amber-700 rounded-full p-1 mt-0.5">
                    <Settings className="h-4 w-4" />
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

              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Progression</h3>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${formProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {formProgress}% complété
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Composants manquants pour la prévisualisation
const Download: React.FC<{ className?: string }> = ({ className }) => {
  return <Upload className={className} />;
};

const Eye: React.FC<{ className?: string }> = ({ className }) => {
  return <Info className={className} />;
};

const LayoutDashboard: React.FC<{ className?: string }> = ({ className }) => {
  return <Layers className={className} />;
};
