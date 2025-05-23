"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Copy, Eye, Home, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import ConfettiExplosion from "@/components/confetti-explosion";

interface AnimatedSuccessProps {
  uniqueCode: string;
  onViewDetails: () => void;
  onDashboard: () => void;
}

export function AnimatedSuccess({
  uniqueCode,
  onViewDetails,
  onDashboard,
}: AnimatedSuccessProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Déclencher l'animation de confetti après un court délai
    const timer = setTimeout(() => {
      setShowConfetti(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(uniqueCode);
    toast({
      title: "Code copié!",
      description: "Le code unique a été copié dans le presse-papier.",
    });
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-10 px-4">
      {showConfetti && <ConfettiExplosion />}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="rounded-full bg-green-100 p-3 w-24 h-24 flex items-center justify-center mx-auto">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-2xl md:text-3xl font-bold text-center mb-2"
      >
        Compétition créée avec succès!
      </motion.h2>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-gray-600 text-center mb-8 max-w-md"
      >
        Votre compétition a été créée et est prête à être partagée avec les
        participants.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-green-200 bg-green-50 mb-6">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-2">
              Code unique de votre compétition:
            </p>
            <div className="flex items-center">
              <div className="bg-white rounded-l-md border border-r-0 border-gray-300 px-4 py-2 font-mono text-lg font-bold flex-1 overflow-x-auto">
                {uniqueCode}
              </div>
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="rounded-l-none border border-gray-300 bg-gray-50 hover:bg-gray-100"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Partagez ce code avec les participants pour qu'ils puissent
              rejoindre votre compétition.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
      >
        <Button
          onClick={onViewDetails}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
        >
          <Eye className="mr-2 h-4 w-4" />
          Voir les détails
        </Button>
        <Button onClick={onDashboard} variant="outline" className="flex-1">
          <Home className="mr-2 h-4 w-4" />
          Tableau de bord
        </Button>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="mt-8 text-center"
      >
        <Button
          variant="ghost"
          className="text-sm text-gray-500 flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Partager sur les réseaux sociaux
        </Button>
      </motion.div>
    </div>
  );
}
