"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { CountrySelector } from "@/components/country-selector";
import { PhoneInput } from "@/components/phone-input";
import { AuthBackground } from "@/components/auth-background";
import type { Country } from "@/constants/countries";
import {
  Trophy,
  Mail,
  Phone,
  ArrowRight,
  Lock,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Schéma de validation amélioré pour le formulaire de connexion par email
const emailSigninSchema = z.object({
  email: z.string().email("Format d'email invalide. Exemple: nom@domaine.com"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

// Schéma de validation amélioré pour le formulaire de connexion par téléphone
const phoneSigninSchema = z.object({
  countryCode: z.string().min(1, "Veuillez sélectionner un pays"),
  phoneNumber: z
    .string()
    .min(1, "Le numéro de téléphone est requis")
    .refine((val) => /^[0-9]{6,15}$/.test(val.replace(/\s+/g, "")), {
      message: "Format de numéro de téléphone invalide",
    }),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export default function SigninPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<"email" | "phone" | "google">(
    "email"
  );
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>();
  const [dialCode, setDialCode] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const emailForm = useForm<z.infer<typeof emailSigninSchema>>({
    resolver: zodResolver(emailSigninSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange", // Active la validation en temps réel
  });

  const phoneForm = useForm<z.infer<typeof phoneSigninSchema>>({
    resolver: zodResolver(phoneSigninSchema),
    defaultValues: {
      countryCode: "",
      phoneNumber: "",
      password: "",
    },
    mode: "onChange", // Active la validation en temps réel
  });

  // Réinitialiser l'erreur de connexion lorsque l'utilisateur modifie un champ
  useEffect(() => {
    if (loginError) {
      const subscription = emailForm.watch(() => setLoginError(null));
      return () => subscription.unsubscribe();
    }
  }, [loginError, emailForm]);

  useEffect(() => {
    if (loginError) {
      const subscription = phoneForm.watch(() => setLoginError(null));
      return () => subscription.unsubscribe();
    }
  }, [loginError, phoneForm]);

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setDialCode(country.dialCode);
  };

  const onEmailSubmit = async (values: z.infer<typeof emailSigninSchema>) => {
    try {
      setIsLoading(true);
      setLoginError(null);

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setLoginError(result.error);
        toast({
          title: "Erreur de connexion",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      // Récupérer les informations de l'utilisateur pour déterminer le rôle
      const userResponse = await fetch("/api/auth/user");
      const userData = await userResponse.json();

      if (userData.user) {
        // Rediriger en fonction du rôle
        if (userData.user.role === "ORGANIZER") {
          router.push("/organizer/dashboard");
        } else {
          router.push("/participant/dashboard");
        }
      } else {
        // Fallback si on ne peut pas déterminer le rôle
        router.push("/");
      }

      router.refresh();
    } catch (error: any) {
      console.error("SignIn error:", error);
      setLoginError(
        error.message || "Une erreur est survenue lors de la connexion"
      );
      toast({
        title: "Erreur",
        description:
          error.message || "Une erreur est survenue lors de la connexion",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onPhoneSubmit = async (values: z.infer<typeof phoneSigninSchema>) => {
    try {
      setIsLoading(true);
      setLoginError(null);

      // Format phone number with country code
      const formattedPhoneNumber = `${dialCode}${values.phoneNumber.replace(
        /^0+/,
        ""
      )}`;

      const result = await signIn("credentials", {
        phoneNumber: formattedPhoneNumber,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setLoginError(result.error);
        toast({
          title: "Erreur de connexion",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      // Récupérer les informations de l'utilisateur pour déterminer le rôle
      const userResponse = await fetch("/api/auth/user");
      const userData = await userResponse.json();

      if (userData.user) {
        // Rediriger en fonction du rôle
        if (userData.user.role === "ORGANIZER") {
          router.push("/organizer/dashboard");
        } else {
          router.push("/participant/dashboard");
        }
      } else {
        // Fallback si on ne peut pas déterminer le rôle
        router.push("/");
      }

      router.refresh();
    } catch (error: any) {
      console.error("SignIn error:", error);
      setLoginError(
        error.message || "Une erreur est survenue lors de la connexion"
      );
      toast({
        title: "Erreur",
        description:
          error.message || "Une erreur est survenue lors de la connexion",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Fonction pour vérifier si un champ est valide
  const isEmailFieldValid = (
    fieldName: keyof z.infer<typeof emailSigninSchema>
  ) => {
    const value = emailForm.getValues(fieldName);
    return value && !emailForm.formState.errors[fieldName];
  };

  const isPhoneFieldValid = (
    fieldName: keyof z.infer<typeof phoneSigninSchema>
  ) => {
    const value = phoneForm.getValues(fieldName);
    return value && !phoneForm.formState.errors[fieldName];
  };

  // Composant pour afficher l'état de validation d'un champ
  const EmailValidationStatus = ({
    fieldName,
  }: {
    fieldName: keyof z.infer<typeof emailSigninSchema>;
  }) => {
    const value = emailForm.getValues(fieldName);
    const error = emailForm.formState.errors[fieldName];
    const touched = emailForm.formState.touchedFields[fieldName];

    if (!value || !touched) return null;

    return error ? (
      <AlertCircle className="h-5 w-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
    ) : (
      <CheckCircle2 className="h-5 w-5 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />
    );
  };

  const PhoneValidationStatus = ({
    fieldName,
  }: {
    fieldName: keyof z.infer<typeof phoneSigninSchema>;
  }) => {
    const value = phoneForm.getValues(fieldName);
    const error = phoneForm.formState.errors[fieldName];
    const touched = phoneForm.formState.touchedFields[fieldName];

    if (!value || !touched) return null;

    return error ? (
      <AlertCircle className="h-5 w-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
    ) : (
      <CheckCircle2 className="h-5 w-5 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />
    );
  };

  return (
    <AuthBackground variant="signin">
      <div className="container max-w-md flex-1 flex items-center justify-center py-12">
        <Card className="w-full shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-primary/10">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center mb-6">
              <div className="flex items-center gap-2 text-2xl font-bold mb-2">
                <Trophy className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
                e-compétition
              </div>
              <h1 className="text-xl font-semibold tracking-tight">
                Connexion
              </h1>
              <p className="text-sm text-muted-foreground">
                Connectez-vous à votre compte
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Erreur de connexion</p>
                  <p className="text-sm">{loginError}</p>
                </div>
              </div>
            )}

            <Tabs
              defaultValue="email"
              onValueChange={(value) => setAuthMethod(value as any)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <TabsTrigger
                  value="email"
                  className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Email</span>
                </TabsTrigger>
                <TabsTrigger
                  value="phone"
                  className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                >
                  <Phone className="h-4 w-4" />
                  <span className="hidden sm:inline">Téléphone</span>
                </TabsTrigger>
                <TabsTrigger
                  value="google"
                  className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Google</span>
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="email" className="mt-0">
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={tabVariants}
                  >
                    <Form {...emailForm}>
                      <form
                        onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={emailForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1.5">
                                <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                                Email
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    placeholder="john.doe@example.com"
                                    type="email"
                                    {...field}
                                    className={`bg-white/80 backdrop-blur-sm transition-all ${
                                      emailForm.formState.errors.email
                                        ? "border-red-500 focus-visible:ring-red-500"
                                        : isEmailFieldValid("email")
                                        ? "border-green-500 focus-visible:ring-green-500"
                                        : "border-emerald-600/20 hover:border-emerald-600/40"
                                    }`}
                                  />
                                  <EmailValidationStatus fieldName="email" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={emailForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1.5">
                                <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                                Mot de passe
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    placeholder="********"
                                    type="password"
                                    {...field}
                                    className={`bg-white/80 backdrop-blur-sm transition-all ${
                                      emailForm.formState.errors.password
                                        ? "border-red-500 focus-visible:ring-red-500"
                                        : isEmailFieldValid("password")
                                        ? "border-green-500 focus-visible:ring-green-500"
                                        : "border-emerald-600/20 hover:border-emerald-600/40"
                                    }`}
                                  />
                                  <EmailValidationStatus fieldName="password" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                          disabled={isLoading || !emailForm.formState.isValid}
                        >
                          {isLoading ? "Connexion en cours..." : "Se connecter"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </form>
                    </Form>
                  </motion.div>
                </TabsContent>

                <TabsContent value="phone" className="mt-0">
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={tabVariants}
                  >
                    <Form {...phoneForm}>
                      <form
                        onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={phoneForm.control}
                          name="countryCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
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

                        <FormField
                          control={phoneForm.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1.5">
                                <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                                Numéro de téléphone
                              </FormLabel>
                              <FormControl>
                                <PhoneInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  countryCode={phoneForm.watch("countryCode")}
                                  onCountryCodeChange={(code) =>
                                    phoneForm.setValue("countryCode", code)
                                  }
                                  onDialCodeChange={setDialCode}
                                  placeholder="Numéro de téléphone"
                                  className={`${
                                    phoneForm.formState.errors.phoneNumber
                                      ? "border-red-500 focus-visible:ring-red-500"
                                      : isPhoneFieldValid("phoneNumber")
                                      ? "border-green-500 focus-visible:ring-green-500"
                                      : ""
                                  }`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={phoneForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1.5">
                                <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                                Mot de passe
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    placeholder="********"
                                    type="password"
                                    {...field}
                                    className={`bg-white/80 backdrop-blur-sm transition-all ${
                                      phoneForm.formState.errors.password
                                        ? "border-red-500 focus-visible:ring-red-500"
                                        : isPhoneFieldValid("password")
                                        ? "border-green-500 focus-visible:ring-green-500"
                                        : "border-emerald-600/20 hover:border-emerald-600/40"
                                    }`}
                                  />
                                  <PhoneValidationStatus fieldName="password" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                          disabled={isLoading || !phoneForm.formState.isValid}
                        >
                          {isLoading ? "Connexion en cours..." : "Se connecter"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </form>
                    </Form>
                  </motion.div>
                </TabsContent>

                <TabsContent value="google" className="mt-0">
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={tabVariants}
                    className="flex flex-col space-y-4"
                  >
                    <Button
                      variant="outline"
                      className="w-full bg-white/80 backdrop-blur-sm border-emerald-600/20 hover:border-emerald-600/40 transition-all"
                      onClick={() => {
                        signIn("google", { callbackUrl: "/" });
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
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Vous n'avez pas de compte?{" "}
                <Link
                  href="/signup"
                  className="text-emerald-600 dark:text-emerald-500 hover:underline font-medium"
                >
                  S'inscrire
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthBackground>
  );
}
