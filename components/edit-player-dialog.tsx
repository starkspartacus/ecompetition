"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Edit } from "lucide-react";

const playerSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  age: z.string().min(1, "L'âge est requis"),
  position: z.string().optional(),
  number: z.string().optional(),
  photoUrl: z.string().url("URL invalide").optional().or(z.literal("")),
});

interface Player {
  id: string;
  name: string;
  age: number;
  position: string;
  number: number | null;
  photoUrl: string | null;
}

interface EditPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: Player;
  onPlayerUpdated: () => void;
}

const positions = [
  "Gardien",
  "Défenseur central",
  "Défenseur latéral",
  "Milieu défensif",
  "Milieu central",
  "Milieu offensif",
  "Ailier",
  "Attaquant",
  "Avant-centre",
];

export function EditPlayerDialog({
  open,
  onOpenChange,
  player,
  onPlayerUpdated,
}: EditPlayerDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof playerSchema>>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: "",
      age: "",
      position: "",
      number: "",
      photoUrl: "",
    },
  });

  useEffect(() => {
    if (player) {
      form.reset({
        name: player.name,
        age: player.age.toString(),
        position: player.position || "",
        number: player.number?.toString() || "",
        photoUrl: player.photoUrl || "",
      });
    }
  }, [player, form]);

  const onSubmit = async (values: z.infer<typeof playerSchema>) => {
    try {
      setIsLoading(true);

      const playerData = {
        name: values.name,
        age: values.age,
        position: values.position || "",
        number: values.number || null,
        photoUrl: values.photoUrl || null,
      };

      const response = await fetch(`/api/players/${player.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(playerData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Joueur modifié !",
          description: `${values.name} a été modifié avec succès`,
        });

        onPlayerUpdated();
      } else {
        toast({
          title: "Erreur",
          description:
            data.error ||
            "Une erreur est survenue lors de la modification du joueur",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la modification du joueur:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modifier le joueur
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations du joueur. Les champs marqués d'un * sont
            obligatoires.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du joueur *</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean Dupont" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Âge *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="25" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une position" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Aucune position</SelectItem>
                      {positions.map((position) => (
                        <SelectItem key={position} value={position}>
                          {position}
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
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://exemple.com/photo.jpg"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>URL de la photo du joueur</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Modification...
                  </>
                ) : (
                  "Modifier le joueur"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
