"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { COMPETITION_CATEGORIES } from "@/constants/categories"
import { uploadImage } from "@/lib/blob"
import { toast } from "@/components/ui/use-toast"

const competitionSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  venue: z.string().min(2, "Le nom du stade/quartier est requis"),
  maxParticipants: z.coerce.number().min(2, "Minimum 2 participants requis"),
  category: z.string().min(1, "La catégorie est requise"),
  registrationDeadline: z.string().refine((date) => {
    const selectedDate = new Date(date)
    const today = new Date()
    return selectedDate > today
  }, "La date limite doit être dans le futur"),
  image: z.any().optional(),
})

export default function CreateCompetitionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const form = useForm<z.infer<typeof competitionSchema>>({
    resolver: zodResolver(competitionSchema),
    defaultValues: {
      title: "",
      address: "",
      venue: "",
      maxParticipants: 10,
      category: "",
      registrationDeadline: "",
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (values: z.infer<typeof competitionSchema>) => {
    try {
      setIsLoading(true)

      // Upload image if provided
      let imageUrl = null
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
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
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Une erreur est survenue lors de la création de la compétition")
      }

      const data = await response.json()

      toast({
        title: "Compétition créée",
        description: `Code unique: ${data.competition.uniqueCode}`,
      })

      router.push(`/organizer/competitions/${data.competition.id}`)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de la compétition",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Créer une compétition</h1>
        <p className="text-muted-foreground">Remplissez le formulaire ci-dessous pour créer une nouvelle compétition</p>
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titre de la compétition</FormLabel>
                <FormControl>
                  <Input placeholder="Tournoi de football inter-quartiers" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Rue du Stade" {...field} />
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
                  <FormLabel>Quartier / Stade</FormLabel>
                  <FormControl>
                    <Input placeholder="Stade Municipal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="maxParticipants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre maximum de participants</FormLabel>
                  <FormControl>
                    <Input type="number" min="2" {...field} />
                  </FormControl>
                  <FormDescription>Nombre maximum d'équipes pouvant participer</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COMPETITION_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="registrationDeadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date limite d'inscription</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>Les inscriptions seront automatiquement fermées après cette date</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image / Logo de la compétition</FormLabel>
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
                    <Input type="file" accept="image/*" onChange={handleImageChange} className="cursor-pointer" />
                  </div>
                </FormControl>
                <FormDescription>Ajoutez une image ou un logo pour votre compétition (optionnel)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Création en cours..." : "Créer la compétition"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
