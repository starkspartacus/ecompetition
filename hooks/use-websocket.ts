"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { io, type Socket } from "socket.io-client";

interface UseWebSocketOptions {
  autoReconnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  debug?: boolean;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (event: string, data: any) => boolean;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket(
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    autoReconnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 2000,
    debug = false,
  } = options;

  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  // Utiliser useRef pour éviter les re-renders
  const reconnectCountRef = useRef(0);
  const isConnectingRef = useRef(false);

  const log = useCallback(
    (message: string, ...args: any[]) => {
      if (debug) {
        console.log(`[WebSocket] ${message}`, ...args);
      }
    },
    [debug]
  );

  const disconnect = useCallback(() => {
    if (socket) {
      log("🔌 Déconnexion du serveur WebSocket");
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, [socket, log]);

  const connect = useCallback(() => {
    // Éviter les connexions multiples
    if (socket || isConnectingRef.current) {
      log("⚠️ Une connexion WebSocket existe déjà ou est en cours");
      return;
    }

    // Vérifier si la session et l'utilisateur existent
    if (!session?.user?.id || !session?.user?.role) {
      log("⚠️ Session ou propriétés utilisateur manquantes pour WebSocket");
      return;
    }

    isConnectingRef.current = true;

    // Récupérer l'URL du socket depuis les variables d'environnement ou utiliser l'origine actuelle
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;

    log(`🔄 Tentative de connexion WebSocket à ${socketUrl}`);
    log(`👤 Utilisateur: ${session.user.id}, Rôle: ${session.user.role}`);

    try {
      // Créer une nouvelle connexion socket
      const newSocket = io(socketUrl, {
        query: {
          userId: session.user.id,
          userRole: session.user.role,
        },
        transports: ["websocket", "polling"],
        reconnectionAttempts: 0, // Désactiver la reconnexion automatique de socket.io
        timeout: 10000, // 10 secondes de timeout
      });

      // Gérer les événements de connexion
      newSocket.on("connect", () => {
        log("✅ Connecté au serveur WebSocket");
        setIsConnected(true);
        reconnectCountRef.current = 0; // Réinitialiser le compteur de reconnexion
        isConnectingRef.current = false;
      });

      newSocket.on("disconnect", (reason) => {
        log(`❌ Déconnecté du serveur WebSocket: ${reason}`);
        setIsConnected(false);
        isConnectingRef.current = false;

        // Tenter de se reconnecter automatiquement si activé
        if (autoReconnect && reconnectCountRef.current < reconnectAttempts) {
          const delay = reconnectDelay * (reconnectCountRef.current + 1);
          log(
            `🔄 Tentative de reconnexion dans ${delay}ms (${
              reconnectCountRef.current + 1
            }/${reconnectAttempts})`
          );

          setTimeout(() => {
            reconnectCountRef.current += 1;
            connect();
          }, delay);
        }
      });

      newSocket.on("connect_error", (error) => {
        log(
          `❌ Erreur de connexion WebSocket: ${
            error.message || "Erreur inconnue"
          }`
        );
        isConnectingRef.current = false;

        // Tenter de se reconnecter automatiquement si activé
        if (autoReconnect && reconnectCountRef.current < reconnectAttempts) {
          const delay = reconnectDelay * (reconnectCountRef.current + 1);
          log(
            `🔄 Tentative de reconnexion dans ${delay}ms (${
              reconnectCountRef.current + 1
            }/${reconnectAttempts})`
          );

          setTimeout(() => {
            reconnectCountRef.current += 1;
            connect();
          }, delay);
        }
      });

      // Gérer les messages entrants
      newSocket.on("message", (data) => {
        log("📩 Message WebSocket reçu:", data);
        setLastMessage(data);
      });

      // Stocker la référence du socket
      setSocket(newSocket);
    } catch (error) {
      log("❌ Erreur lors de la création de la connexion WebSocket:", error);
      isConnectingRef.current = false;
    }
  }, [
    session?.user?.id,
    session?.user?.role,
    autoReconnect,
    reconnectAttempts,
    reconnectDelay,
    log,
  ]);

  // Établir la connexion WebSocket lorsque la session est disponible
  useEffect(() => {
    // Ne se connecter que si on a une session valide et qu'on n'est pas déjà connecté
    if (
      session?.user?.id &&
      session?.user?.role &&
      !socket &&
      !isConnectingRef.current
    ) {
      connect();
    }

    // Nettoyer la connexion lors du démontage
    return () => {
      if (socket) {
        log("🧹 Nettoyage de la connexion WebSocket");
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        isConnectingRef.current = false;
      }
    };
  }, [session?.user?.id, session?.user?.role]); // Dépendances stables

  // Fonction pour envoyer un message
  const sendMessage = useCallback(
    (event: string, data: any) => {
      if (socket && isConnected) {
        log(`📤 Envoi d'un message WebSocket: ${event}`, data);
        socket.emit(event, data);
        return true;
      } else {
        log("⚠️ Impossible d'envoyer le message: non connecté");
        return false;
      }
    },
    [socket, isConnected, log]
  );

  return {
    socket,
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
  };
}
