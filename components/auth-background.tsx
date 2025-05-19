"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Users,
  ClubIcon as Football,
  ShoppingBasketIcon as Basketball,
  VibrateIcon as Volleyball,
  TurtleIcon as Tennis,
  Timer,
  Medal,
  Flag,
} from "lucide-react";

interface AuthBackgroundProps {
  variant?: "signup" | "signin";
  children: React.ReactNode;
}

export function AuthBackground({
  variant = "signup",
  children,
}: AuthBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {children}
      </div>
    );
  }

  const icons = [
    Trophy,
    Users,
    Football,
    Basketball,
    Volleyball,
    Tennis,
    Timer,
    Medal,
    Flag,
  ];

  const generateRandomPosition = () => {
    return {
      x: Math.random() * 100,
      y: Math.random() * 100,
      scale: 0.5 + Math.random() * 1.5,
      rotation: Math.random() * 360,
    };
  };

  const iconElements = icons.map((Icon, index) => {
    const position = generateRandomPosition();

    return (
      <motion.div
        key={index}
        className="absolute text-primary/10 dark:text-primary/5"
        initial={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          scale: position.scale,
          rotate: position.rotation,
          opacity: 0,
        }}
        animate={{
          opacity: 0.7,
          y: [0, -10, 0],
          rotate: [
            position.rotation,
            position.rotation + 10,
            position.rotation,
          ],
        }}
        transition={{
          duration: 5 + Math.random() * 5,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          delay: index * 0.2,
        }}
      >
        <Icon size={30 + Math.random() * 20} />
      </motion.div>
    );
  });

  const ballElements = Array.from({ length: 5 }).map((_, index) => {
    const position = generateRandomPosition();
    const ballTypes = ["⚽", "🏀", "🏐", "🎾", "⚾"];
    const ball = ballTypes[index % ballTypes.length];

    return (
      <motion.div
        key={`ball-${index}`}
        className="absolute text-4xl"
        initial={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          scale: position.scale,
          opacity: 0,
        }}
        animate={{
          opacity: 0.8,
          y: [0, -15, 0],
          x: [0, 5, 0, -5, 0],
          rotate: [0, 360],
        }}
        transition={{
          duration: 8 + Math.random() * 7,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          delay: index * 0.5,
        }}
      >
        {ball}
      </motion.div>
    );
  });

  const gradientColors =
    variant === "signup"
      ? "from-blue-600/20 via-indigo-500/10 to-purple-500/20 dark:from-blue-900/30 dark:via-indigo-800/20 dark:to-purple-900/30"
      : "from-emerald-600/20 via-blue-500/10 to-indigo-500/20 dark:from-emerald-900/30 dark:via-blue-800/20 dark:to-indigo-900/30";

  return (
    <div
      className={`min-h-screen relative overflow-hidden bg-gradient-to-br ${gradientColors}`}
    >
      <div className="absolute inset-0 overflow-hidden">
        {iconElements}
        {ballElements}
      </div>
      <div className="absolute inset-0 backdrop-blur-[100px]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
