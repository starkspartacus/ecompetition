"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

interface UseWebSocketOptions {
  onNotification?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    // URL du serveur WebSocket
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

    // Créer la connexion Socket.IO
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
    });

    socketRef.current = socket;

    // Gérer la connexion
    socket.on("connect", () => {
      console.log("✅ Connecté au serveur WebSocket");
      setIsConnected(true);
      setConnectionError(null);

      // Rejoindre la room de l'utilisateur
      socket.emit("join-user-room", session.user.id);

      options.onConnect?.();
    });

    // Gérer les erreurs de connexion
    socket.on("connect_error", (error) => {
      console.error("❌ Erreur de connexion WebSocket:", error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Gérer la déconnexion
    socket.on("disconnect", (reason) => {
      console.log("❌ Déconnecté du serveur WebSocket:", reason);
      setIsConnected(false);
      options.onDisconnect?.();
    });

    // Écouter les notifications
    socket.on("notification", (data) => {
      console.log("📨 Notification reçue:", data);
      options.onNotification?.(data);
    });

    // Écouter les demandes de participation
    socket.on("participation-request", (data) => {
      console.log("👥 Demande de participation reçue:", data);
      options.onNotification?.(data);
    });

    // Nettoyage lors du démontage
    return () => {
      console.log("🧹 Nettoyage de la connexion WebSocket");
      socket.disconnect();
    };
  }, [
    session?.user?.id,
    options.onNotification,
    options.onConnect,
    options.onDisconnect,
  ]);

  // Fonction pour envoyer un message
  const sendMessage = (event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn("⚠️ Socket non connecté, impossible d'envoyer le message");
    }
  };

  return {
    isConnected,
    connectionError,
    sendMessage,
    socket: socketRef.current,
  };
}
