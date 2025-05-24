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

    // URL du serveur WebSocket - utilise le port 3001 pour le serveur Socket.IO
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

    console.log("🔌 Tentative de connexion WebSocket à:", socketUrl);

    // Créer la connexion Socket.IO
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Gérer la connexion
    socket.on("connect", () => {
      console.log("✅ Connecté au serveur WebSocket");
      setIsConnected(true);
      setConnectionError(null);

      // Authentifier l'utilisateur
      socket.emit("authenticate", {
        userId: session.user.id,
        role: session.user.role,
      });

      options.onConnect?.();
    });

    // Gérer l'authentification
    socket.on("authenticated", (response) => {
      if (response.success) {
        console.log("🔐 Authentifié avec succès sur le WebSocket");

        // Rejoindre la room de l'utilisateur
        socket.emit("join-room", `user-${session.user.id}`);

        // Si c'est un organisateur, rejoindre la room des organisateurs
        if (session.user.role === "ORGANIZER") {
          socket.emit("join-room", "organizers");
          socket.emit("join-room", `organizer-${session.user.id}`);
        }
      } else {
        console.error(
          "❌ Échec de l'authentification WebSocket:",
          response.error
        );
      }
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
      return true;
    } else {
      console.warn("⚠️ Socket non connecté, impossible d'envoyer le message");
      return false;
    }
  };

  return {
    isConnected,
    connectionError,
    sendMessage,
    socket: socketRef.current,
  };
}
