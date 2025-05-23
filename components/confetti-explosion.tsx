"use client";

import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

export default function ConfettiExplosion() {
  const { width, height } = useWindowSize();
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsActive(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!isActive) return null;

  return (
    <Confetti
      width={width}
      height={height}
      recycle={false}
      numberOfPieces={200}
      gravity={0.2}
      colors={["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"]}
    />
  );
}
