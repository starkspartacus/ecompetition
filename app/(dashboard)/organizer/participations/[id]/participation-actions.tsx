"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface ParticipationActionsProps {
  participationId: string;
  competitionId: string;
  participantId: string;
  participantName: string;
}

export function ParticipationActions({
  participationId,
  competitionId,
  participantId,
  participantName,
}: ParticipationActionsProps) {
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/participations/${participationId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            competitionId,
            participantId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Une erreur est survenue lors de l'approbation"
        );
      }

      toast({
        title: "Demande approuvée",
        description: `${participantName} a été ajouté à la compétition`,
        variant: "default",
      });

      // Rediriger vers la liste des participations
      router.refresh();
      router.push("/organizer/participations");
    } catch (error: any) {
      console.error("Erreur lors de l'approbation:", error);
      toast({
        title: "Erreur",
        description:
          error.message || "Une erreur est survenue lors de l'approbation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsApproveDialogOpen(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/participations/${participationId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            competitionId,
            participantId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Une erreur est survenue lors du refus"
        );
      }

      toast({
        title: "Demande refusée",
        description: `La demande de ${participantName} a été refusée`,
        variant: "default",
      });

      // Rediriger vers la liste des participations
      router.refresh();
      router.push("/organizer/participations");
    } catch (error: any) {
      console.error("Erreur lors du refus:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du refus",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRejectDialogOpen(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setIsRejectDialogOpen(true)}
          disabled={isLoading}
          className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
        >
          Refuser
        </Button>
        <Button
          onClick={() => setIsApproveDialogOpen(true)}
          disabled={isLoading}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          Approuver
        </Button>
      </div>

      <AlertDialog
        open={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approuver la demande</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir approuver la demande de participation de{" "}
              {participantName} ? Cette action ajoutera le participant à votre
              compétition.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleApprove();
              }}
              disabled={isLoading}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isLoading ? "Approbation..." : "Approuver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refuser la demande</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir refuser la demande de participation de{" "}
              {participantName} ? Cette action ne pourra pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleReject();
              }}
              disabled={isLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isLoading ? "Refus..." : "Refuser"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
