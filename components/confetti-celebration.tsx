"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

interface ConfettiCelebrationProps {
  trigger?: boolean;
  duration?: number;
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
}

export function ConfettiCelebration({
  trigger = true,
  duration = 3000,
  particleCount = 100,
  spread = 70,
  origin = { x: 0.5, y: 0.5 },
  colors = [
    "#26ccff",
    "#a25afd",
    "#ff5e7e",
    "#88ff5a",
    "#fcff42",
    "#ffa62d",
    "#ff36ff",
  ],
}: ConfettiCelebrationProps) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger && !isActive) {
      setIsActive(true);

      // Lancer les confettis
      const myConfetti = confetti.create(undefined, {
        resize: true,
        useWorker: true,
      });

      const end = Date.now() + duration;

      const launchConfetti = () => {
        myConfetti({
          particleCount: particleCount / 3,
          angle: 60,
          spread,
          origin: { x: origin.x - 0.2, y: origin.y },
          colors,
        });

        myConfetti({
          particleCount: particleCount / 3,
          angle: 120,
          spread,
          origin: { x: origin.x + 0.2, y: origin.y },
          colors,
        });

        myConfetti({
          particleCount: particleCount / 3,
          angle: 90,
          spread: spread / 2,
          origin,
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(launchConfetti);
        } else {
          setIsActive(false);
        }
      };

      launchConfetti();
    }
  }, [trigger, isActive, duration, particleCount, spread, origin, colors]);

  return null;
}
