"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

const joinSchema = z.object({
  code: z.string().min(1, "Le code est requis").max(8, "Le code ne peut pas dépasser 8 caractères"),
})

export default function JoinCompetitionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [competition, setCompetition] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)

  const form = useForm<z.infer<typeof joinSchema>>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      code: "",
    },
  })

  const searchCompetition = async (code: string) => {
    try {
      setIsSearching(true)
      const response = await fetch(`/api/competitions?code=${code}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Compétition non trouvée")
      }

      const data = await response.json()
      setCompetition(data.competition)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la recherche",
        variant: "destructive",
      })
      setCompetition(null)
    } finally {
      setIsSearching(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof joinSchema>) => {
    try {
      if (!competition) {
        await searchCompetition(values.code)
        return
      }

      setIsLoading(true)

      // Rejoindre la compétition
      const response = await fetch("/api/competitions/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          competitionId: competition.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Une erreur est survenue lors de la demande de participation")
      }

      toast({
        title: "Demande envoyée",
        description: "Votre demande de participation a été envoyée à l'organisateur",
      })

      router.push("/participant/competitions")
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la demande de participation",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rejoindre une compétition</h1>
        <p className="text-muted-foreground">
          Entrez le code unique fourni par l'organisateur pour rejoindre une compétition
        </p>
      </div>
      <Separator />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code de la compétition</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC123" {...field} />
                    </FormControl>
                    <FormDescription>Entrez le code à 8 caractères fourni par l'organisateur</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSearching || isLoading}>
                {!competition
                  ? isSearching
                    ? "Recherche..."
                    : "Rechercher"
                  : isLoading
                    ? "Envoi de la demande..."
                    : "Rejoindre la compétition"}
              </Button>
            </form>
          </Form>
        </div>

        <div>
          {competition ? (
            <Card>
              <CardHeader>
                <CardTitle>{competition.title}</CardTitle>
                <CardDescription>
                  Organisé par {competition.organizer.firstName} {competition.organizer.lastName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Lieu</p>
                  <p className="text-sm text-muted-foreground">
                    {competition.venue}, {competition.address}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Catégorie</p>
                  <p className="text-sm text-muted-foreground">{competition.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Date limite d'inscription</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(competition.registrationDeadline).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Participants maximum</p>
                  <p className="text-sm text-muted-foreground">{competition.maxParticipants} équipes</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Les détails de la compétition s'afficheront ici</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
