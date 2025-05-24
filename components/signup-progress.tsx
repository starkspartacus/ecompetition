"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

interface Step {
  id: string;
  title: string;
  description: string;
}

interface SignupProgressProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
}

export function SignupProgress({
  steps,
  currentStep,
  completedSteps,
}: SignupProgressProps) {
  return (
    <div className="mb-8">
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isActive = currentStep === index;
          const isCompleted = completedSteps.includes(index);
          const isLastStep = index === steps.length - 1;

          // Déterminer la couleur en fonction de l'étape
          const getStepColor = (stepIndex: number) => {
            switch (stepIndex) {
              case 0:
                return "primary";
              case 1:
                return "emerald-500";
              case 2:
                return "amber-500";
              case 3:
                return "purple-500";
              case 4:
                return "rose-500";
              default:
                return "primary";
            }
          };

          const color = getStepColor(index);

          return (
            <div
              key={step.id}
              className="flex flex-col items-center relative z-10"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="relative"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isActive
                      ? `border-${color} bg-${color}/10 text-${color}`
                      : isCompleted
                      ? `border-${color} bg-${color} text-white`
                      : "border-muted-foreground/30 text-muted-foreground/50"
                  )}
                >
                  {isCompleted ? (
                    <CheckIcon className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
              </motion.div>
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    "text-xs font-medium transition-colors duration-300",
                    isActive || isCompleted
                      ? `text-${color}`
                      : "text-muted-foreground/70"
                  )}
                >
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}

        {/* Ligne de progression */}
        <div className="absolute top-5 left-0 right-0 h-[2px] -translate-y-1/2 bg-muted-foreground/20 z-0">
          {steps.map((_, index) => {
            if (index === steps.length - 1) return null;

            const isCompleted = completedSteps.includes(index);
            const startColor = getStepColor(index);
            const endColor = getStepColor(index + 1);

            return (
              <motion.div
                key={`progress-${index}`}
                initial={{ width: "0%" }}
                animate={{ width: isCompleted ? "100%" : "0%" }}
                transition={{ duration: 0.5 }}
                className={cn(
                  "absolute h-full left-0 right-0",
                  `bg-gradient-to-r from-${startColor} to-${endColor}`
                )}
                style={{
                  left: `${(index * 100) / (steps.length - 1)}%`,
                  right: `${100 - ((index + 1) * 100) / (steps.length - 1)}%`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Fonction utilitaire pour obtenir la couleur d'une étape
function getStepColor(stepIndex: number) {
  switch (stepIndex) {
    case 0:
      return "primary";
    case 1:
      return "emerald-500";
    case 2:
      return "amber-500";
    case 3:
      return "purple-500";
    case 4:
      return "rose-500";
    default:
      return "primary";
  }
}
