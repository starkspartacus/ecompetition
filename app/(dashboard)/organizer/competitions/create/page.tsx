"use client";

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
  AlertCircle,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { COMPETITION_CATEGORIES } from "@/constants/categories";
import { COMPETITION_RULES } from "@/constants/competition-rules";
import { AnimatedSuccess } from "@/components/animated-success";
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
    rules: z.array(z.string()).optional(),
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
  const [activeTab, setActiveTab] = useState("details");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      location: "",
      maxParticipants: 10,
      rules: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/competitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erreur lors de la création de la compétition"
        );
      }

      setUniqueCode(data.competition.uniqueCode);
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

  const goToNextTab = () => {
    if (activeTab === "details") {
      // Valider les champs de l'onglet détails avant de passer à l'onglet suivant
      form.trigger(["name", "description", "category", "location"]);
      const hasErrors =
        !!form.formState.errors.name ||
        !!form.formState.errors.description ||
        !!form.formState.errors.category ||
        !!form.formState.errors.location;

      if (!hasErrors) {
        setActiveTab("dates");
      }
    } else if (activeTab === "dates") {
      form.trigger([
        "startDate",
        "endDate",
        "registrationStartDate",
        "registrationEndDate",
      ]);
      const hasErrors =
        !!form.formState.errors.startDate ||
        !!form.formState.errors.endDate ||
        !!form.formState.errors.registrationStartDate ||
        !!form.formState.errors.registrationEndDate;

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

  const handleViewDetails = () => {
    if (uniqueCode) {
      router.push(`/organizer/competitions/${uniqueCode}`);
    }
  };

  const handleDashboard = () => {
    router.push("/organizer/dashboard");
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
                <AnimatedSuccess
                  uniqueCode={uniqueCode}
                  onViewDetails={handleViewDetails}
                  onDashboard={handleDashboard}
                />
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

                        <div className="flex justify-end">
                          <Button
                            type="button"
                            onClick={goToNextTab}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
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
                                <FormLabel>Date de début</FormLabel>
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
                                <FormLabel>Date de fin</FormLabel>
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
                          <Button
                            type="button"
                            onClick={goToNextTab}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
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
                            Sélectionnez les règles qui s'appliquent à votre
                            compétition. Ces règles seront visibles par tous les
                            participants.
                          </AlertDescription>
                        </Alert>

                        <FormField
                          control={form.control}
                          name="rules"
                          render={() => (
                            <FormItem>
                              <div className="mb-4">
                                <FormLabel className="text-base">
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
                                    control={form.control}
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
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([
                                                      ...(field.value || []),
                                                      rule.value,
                                                    ])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) =>
                                                          value !== rule.value
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
                            Précédent
                          </Button>
                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all"
                          >
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
