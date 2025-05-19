"use client";

import type React from "react";

import { useState } from "react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PAYS } from "@/constants/pays";
import { VILLES } from "@/constants/villes";
import { COMMUNES } from "@/constants/communes";
import { COMPETITION_CATEGORIES } from "@/constants/categories";
import { uploadImage } from "@/lib/blob";
import { toast } from "@/components/ui/use-toast";

const signupSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  dateOfBirth: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 13;
  }, "Vous devez avoir au moins 13 ans"),
  country: z.string().min(1, "Veuillez sélectionner un pays"),
  city: z.string().min(1, "Veuillez sélectionner une ville"),
  commune: z.string().optional(),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  photo: z.any().optional(),
  role: z.enum(["ORGANIZER", "PARTICIPANT"]),
  competitionCategory: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole =
    searchParams.get("role") === "organizer" ? "ORGANIZER" : "PARTICIPANT";

  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<"email" | "phone" | "google">(
    "email"
  );

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
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
      role: defaultRole,
      competitionCategory: defaultRole === "ORGANIZER" ? "FOOTBALL" : undefined,
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
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

      // Create user
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          photoUrl,
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
  const country = form.watch("country");
  const city = form.watch("city");

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[550px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Créer un compte
          </h1>
          <p className="text-sm text-muted-foreground">
            Inscrivez-vous pour commencer à utiliser e-compétition
          </p>
        </div>

        <Tabs
          defaultValue="email"
          onValueChange={(value) => setAuthMethod(value as any)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Téléphone</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
          </TabsList>
          <TabsContent value="email">
            <div className="grid gap-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
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
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="john.doe@example.com"
                            type="email"
                            {...field}
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
                        <FormLabel>Mot de passe</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="********"
                            type="password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de naissance</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pays</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedCountry(value);
                              form.setValue("city", "");
                              form.setValue("commune", "");
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un pays" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PAYS.map((pays) => (
                                <SelectItem key={pays.value} value={pays.value}>
                                  {pays.label}
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
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ville</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedCity(value);
                              form.setValue("commune", "");
                            }}
                            defaultValue={field.value}
                            disabled={!country}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une ville" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {country &&
                                VILLES[country as keyof typeof VILLES]?.map(
                                  (ville) => (
                                    <SelectItem
                                      key={ville.value}
                                      value={ville.value}
                                    >
                                      {ville.label}
                                    </SelectItem>
                                  )
                                )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {city && COMMUNES[city as keyof typeof COMMUNES] && (
                    <FormField
                      control={form.control}
                      name="commune"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commune</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={!city}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une commune" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {city &&
                                COMMUNES[city as keyof typeof COMMUNES]?.map(
                                  (commune) => (
                                    <SelectItem
                                      key={commune.value}
                                      value={commune.value}
                                    >
                                      {commune.label}
                                    </SelectItem>
                                  )
                                )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Rue Example" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="photo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photo</FormLabel>
                        <FormControl>
                          <div className="flex flex-col items-center gap-4">
                            {photoPreview && (
                              <div className="relative h-24 w-24 overflow-hidden rounded-full">
                                <img
                                  src={photoPreview || "/placeholder.svg"}
                                  alt="Preview"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoChange}
                              className="cursor-pointer"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de compte</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un type de compte" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ORGANIZER">
                              Organisateur
                            </SelectItem>
                            <SelectItem value="PARTICIPANT">
                              Participant
                            </SelectItem>
                          </SelectContent>
                        </Select>
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
                          <FormLabel>Catégorie de compétition</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
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
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Inscription en cours..." : "S'inscrire"}
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent>

          <TabsContent value="phone">
            <div className="flex flex-col space-y-4">
              <p className="text-sm text-muted-foreground">
                L'inscription par téléphone sera disponible prochainement.
              </p>
              <Button variant="outline" onClick={() => setAuthMethod("email")}>
                Utiliser l'email à la place
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="google">
            <div className="flex flex-col space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Redirection vers l'authentification Google
                  window.location.href = "/api/auth/signin/google";
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 8v8"></path>
                  <path d="M8 12h8"></path>
                </svg>
                Continuer avec Google
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <p className="px-8 text-center text-sm text-muted-foreground">
          Vous avez déjà un compte?{" "}
          <Link
            href="/signin"
            className="underline underline-offset-4 hover:text-primary"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
