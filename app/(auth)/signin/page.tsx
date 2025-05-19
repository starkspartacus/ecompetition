"use client";

import { useState } from "react";
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
import { toast } from "@/components/ui/use-toast";

const signinSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export default function SigninPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<"email" | "phone" | "google">(
    "email"
  );

  const form = useForm<z.infer<typeof signinSchema>>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof signinSchema>) => {
    try {
      setIsLoading(true);
      console.log("Submitting credentials:", { email: values.email });

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      console.log("SignIn result:", result);

      if (result?.error) {
        toast({
          title: "Erreur de connexion",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      if (result?.url) {
        router.push(result.url);
      } else {
        router.push("/");
      }

      router.refresh();
    } catch (error: any) {
      console.error("SignIn error:", error);
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

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
          <p className="text-sm text-muted-foreground">
            Connectez-vous à votre compte e-compétition
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
                  className="space-y-4"
                >
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

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Connexion en cours..." : "Se connecter"}
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent>

          <TabsContent value="phone">
            <div className="flex flex-col space-y-4">
              <p className="text-sm text-muted-foreground">
                La connexion par téléphone sera disponible prochainement.
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
            </div>
          </TabsContent>
        </Tabs>

        <p className="px-8 text-center text-sm text-muted-foreground">
          Vous n'avez pas de compte?{" "}
          <Link
            href="/signup"
            className="underline underline-offset-4 hover:text-primary"
          >
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
