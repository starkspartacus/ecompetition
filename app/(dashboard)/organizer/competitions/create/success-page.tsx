"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfettiCelebration } from "@/components/confetti-celebration";
import { Check, Copy, Trophy } from "lucide-react";

interface SuccessPageProps {
  competitionName: string;
  uniqueCode: string;
}

export default function SuccessPage({
  competitionName,
  uniqueCode,
}: SuccessPageProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Déclencher les confettis après un court délai pour une meilleure expérience
    const timer = setTimeout(() => {
      setShowConfetti(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(uniqueCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <ConfettiCelebration trigger={showConfetti} />

      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-2 border-green-500 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="mx-auto mb-4"
              >
                <Trophy size={60} className="mx-auto" />
              </motion.div>
              <CardTitle className="text-2xl font-bold">
                Félicitations !
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-6 text-center">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg mb-6"
              >
                Votre compétition{" "}
                <span className="font-bold">{competitionName}</span> a été créée
                avec succès !
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-6"
              >
                <p className="text-sm text-gray-500 mb-2">
                  Code unique de la compétition :
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="bg-gray-100 px-4 py-2 rounded-md font-mono text-lg">
                    {uniqueCode}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    className="transition-all duration-200 hover:bg-green-100 hover:text-green-700"
                  >
                    {copied ? (
                      <Check size={18} className="text-green-600" />
                    ) : (
                      <Copy size={18} />
                    )}
                  </Button>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-sm text-gray-500"
              >
                Partagez ce code avec les participants pour qu&apos;ils puissent
                rejoindre votre compétition.
              </motion.p>
            </CardContent>

            <CardFooter className="flex justify-center gap-4 pt-2 pb-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <Button
                  onClick={() => router.push("/organizer/competitions")}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  Voir mes compétitions
                </Button>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
