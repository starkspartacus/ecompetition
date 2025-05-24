"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckIcon, XIcon } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0);
  const [checks, setChecks] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });

  useEffect(() => {
    const newChecks = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };

    setChecks(newChecks);

    // Calculer la force du mot de passe (0-4)
    const strengthScore = Object.values(newChecks).filter(Boolean).length;
    setStrength(strengthScore);
  }, [password]);

  const getStrengthText = () => {
    if (strength === 0) return "Très faible";
    if (strength === 1) return "Faible";
    if (strength === 2) return "Moyen";
    if (strength === 3) return "Fort";
    if (strength === 4) return "Très fort";
    return "Excellent";
  };

  const getStrengthColor = () => {
    if (strength === 0) return "bg-red-500";
    if (strength === 1) return "bg-red-500";
    if (strength === 2) return "bg-amber-500";
    if (strength === 3) return "bg-emerald-500";
    if (strength === 4) return "bg-emerald-500";
    return "bg-emerald-500";
  };

  return (
    <div className="mt-2 space-y-3">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Force du mot de passe: {getStrengthText()}
          </p>
          <p className="text-xs text-muted-foreground">{strength}/5</p>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", getStrengthColor())}
            initial={{ width: "0%" }}
            animate={{ width: `${(strength / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
        <div className="flex items-center gap-1">
          {checks.minLength ? (
            <CheckIcon className="h-3 w-3 text-emerald-500" />
          ) : (
            <XIcon className="h-3 w-3 text-muted-foreground" />
          )}
          <span
            className={cn(
              checks.minLength ? "text-emerald-500" : "text-muted-foreground"
            )}
          >
            Au moins 8 caractères
          </span>
        </div>
        <div className="flex items-center gap-1">
          {checks.hasUppercase ? (
            <CheckIcon className="h-3 w-3 text-emerald-500" />
          ) : (
            <XIcon className="h-3 w-3 text-muted-foreground" />
          )}
          <span
            className={cn(
              checks.hasUppercase ? "text-emerald-500" : "text-muted-foreground"
            )}
          >
            Au moins 1 majuscule
          </span>
        </div>
        <div className="flex items-center gap-1">
          {checks.hasLowercase ? (
            <CheckIcon className="h-3 w-3 text-emerald-500" />
          ) : (
            <XIcon className="h-3 w-3 text-muted-foreground" />
          )}
          <span
            className={cn(
              checks.hasLowercase ? "text-emerald-500" : "text-muted-foreground"
            )}
          >
            Au moins 1 minuscule
          </span>
        </div>
        <div className="flex items-center gap-1">
          {checks.hasNumber ? (
            <CheckIcon className="h-3 w-3 text-emerald-500" />
          ) : (
            <XIcon className="h-3 w-3 text-muted-foreground" />
          )}
          <span
            className={cn(
              checks.hasNumber ? "text-emerald-500" : "text-muted-foreground"
            )}
          >
            Au moins 1 chiffre
          </span>
        </div>
        <div className="flex items-center gap-1">
          {checks.hasSpecial ? (
            <CheckIcon className="h-3 w-3 text-emerald-500" />
          ) : (
            <XIcon className="h-3 w-3 text-muted-foreground" />
          )}
          <span
            className={cn(
              checks.hasSpecial ? "text-emerald-500" : "text-muted-foreground"
            )}
          >
            Au moins 1 caractère spécial
          </span>
        </div>
      </div>
    </div>
  );
}
