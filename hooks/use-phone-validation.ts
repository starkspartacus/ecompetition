"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface PhoneValidationResult {
  isValid: boolean;
  isChecking: boolean;
  error: string | null;
  checkPhoneUniqueness: (
    phoneNumber: string,
    country: string
  ) => Promise<boolean>;
}

export function usePhoneValidation(): PhoneValidationResult {
  const [isChecking, setIsChecking] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const checkPhoneUniqueness = useCallback(
    async (phoneNumber: string, country: string): Promise<boolean> => {
      if (!phoneNumber || !country) {
        setError("Numéro de téléphone et pays requis");
        setIsValid(false);
        return false;
      }

      setIsChecking(true);
      setError(null);

      try {
        const response = await fetch("/api/auth/validate-phone", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phoneNumber, country }),
        });

        const data = await response.json();

        if (data.success) {
          if (data.exists) {
            setError("Ce numéro est déjà utilisé dans ce pays");
            setIsValid(false);
            toast({
              title: "Numéro déjà utilisé",
              description:
                "Ce numéro de téléphone est déjà utilisé dans ce pays",
              variant: "destructive",
            });
            return false;
          } else {
            setError(null);
            setIsValid(true);
            return true;
          }
        } else {
          setError(data.message || "Erreur de validation");
          setIsValid(false);
          return false;
        }
      } catch (error) {
        console.error("Erreur validation téléphone:", error);
        setError("Erreur lors de la validation");
        setIsValid(false);
        return false;
      } finally {
        setIsChecking(false);
      }
    },
    [toast]
  );

  return {
    isValid,
    isChecking,
    error,
    checkPhoneUniqueness,
  };
}
