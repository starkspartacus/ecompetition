"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
}

interface ConfettiExplosionProps {
  count?: number;
  duration?: number;
  colors?: string[];
  onComplete?: () => void;
}

export const ConfettiExplosion: React.FC<ConfettiExplosionProps> = ({
  count = 100,
  duration = 3000,
  colors = ["#FFC700", "#FF0000", "#2E3191", "#41BBC7", "#9B59B6", "#00BA34"],
  onComplete,
}) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Créer les pièces de confettis
  useEffect(() => {
    const newPieces = Array.from({ length: count }).map((_, index) => ({
      id: index,
      x: 50 + Math.random() * 10 - 5, // Position x centrée
      y: 50, // Position y centrée
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 5, // Taille entre 5 et 15
      rotation: Math.random() * 360, // Rotation aléatoire
    }));
    setPieces(newPieces);

    // Arrêter l'animation après la durée spécifiée
    const timeout = setTimeout(() => {
      setIsActive(false);
      if (onComplete) onComplete();
    }, duration);

    return () => clearTimeout(timeout);
  }, [count, colors, duration, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => {
        // Calculer une destination aléatoire pour chaque pièce
        const targetX = piece.x + (Math.random() * 200 - 100); // -100 à +100 depuis le point central
        const targetY = piece.y - Math.random() * 100 - 50; // Vers le haut, entre -50 et -150

        return (
          <motion.div
            key={piece.id}
            className="absolute"
            style={{
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: Math.random() > 0.5 ? "50%" : "0",
            }}
            initial={{
              x: `${piece.x}%`,
              y: `${piece.y}%`,
              opacity: 1,
              rotate: piece.rotation,
            }}
            animate={{
              x: `${targetX}%`,
              y: `${targetY}%`,
              opacity: 0,
              rotate: piece.rotation + Math.random() * 360,
            }}
            transition={{
              duration: Math.random() * 2 + 1,
              ease: "easeOut",
              delay: Math.random() * 0.5,
            }}
          />
        );
      })}
    </div>
  );
};

export default ConfettiExplosion;
