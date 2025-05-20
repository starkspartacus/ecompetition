"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { CheckCircle, Copy, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import ConfettiExplosion from "./confetti-explosion";

interface AnimatedSuccessProps {
  uniqueCode: string;
  onViewDetails: () => void;
  onDashboard: () => void;
}

export const AnimatedSuccess: React.FC<AnimatedSuccessProps> = ({
  uniqueCode,
  onViewDetails,
  onDashboard,
}) => {
  const [showUniqueCode, setShowUniqueCode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Déclencher l'animation après le montage du composant
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const copyUniqueCode = () => {
    if (uniqueCode) {
      navigator.clipboard.writeText(uniqueCode);
      toast({
        title: "Code copié!",
        description: "Le code unique a été copié dans le presse-papier",
      });
    }
  };

  return (
    <div className="relative">
      {showConfetti && (
        <ConfettiExplosion onComplete={() => setShowConfetti(false)} />
      )}

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="space-y-6"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.3,
            type: "spring",
            stiffness: 200,
            damping: 10,
          }}
        >
          <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800 text-lg font-bold">
              Félicitations!
            </AlertTitle>
            <AlertDescription className="text-green-700">
              Votre compétition a été créée avec succès. Vous pouvez maintenant
              partager le code unique avec les participants.
            </AlertDescription>
          </Alert>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-lg"
        >
          <h3 className="text-xl font-semibold mb-4 text-blue-800">
            Code unique de la compétition
          </h3>
          <div className="relative">
            <motion.div
              className="p-4 bg-white rounded-md border border-blue-300 flex justify-between items-center"
              whileHover={{ boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)" }}
            >
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUniqueCode(!showUniqueCode)}
                  className="mr-2 text-blue-600"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showUniqueCode ? "Masquer" : "Afficher"}
                </Button>
                {showUniqueCode ? (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-mono text-lg font-bold text-blue-800"
                  >
                    {uniqueCode}
                  </motion.span>
                ) : (
                  <span className="font-mono text-lg font-bold text-blue-800">
                    ••••••••••
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyUniqueCode}
                className="border-blue-300 hover:bg-blue-100"
              >
                <Copy className="h-4 w-4 mr-2" /> Copier
              </Button>
            </motion.div>
          </div>
          <p className="text-sm text-blue-700 mt-4">
            Partagez ce code avec les participants pour qu'ils puissent
            s'inscrire à cette compétition. Ce code est unique et ne peut être
            utilisé que pour cette compétition.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-between"
        >
          <Button
            variant="outline"
            onClick={onDashboard}
            className={cn(
              "border-gray-300 text-gray-700 hover:bg-gray-100 transition-all",
              "hover:scale-105"
            )}
          >
            Retour au tableau de bord
          </Button>
          <Button
            onClick={onViewDetails}
            className={cn(
              "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
              "text-white shadow-md transition-all hover:shadow-lg hover:scale-105"
            )}
          >
            Voir les détails de la compétition
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
