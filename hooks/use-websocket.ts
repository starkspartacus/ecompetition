"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { io, type Socket } from "socket.io-client";
import { useToast } from "@/components/ui/use-toast";

interface UseWebSocketOptions {
  debug?: boolean;
}

export function useWebSocket({ debug = false }: UseWebSocketOptions = {}) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { toast } = useToast();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour initialiser la connexion WebSocket
  const initializeSocket = useCallback(() => {
    if (socketRef.current) {
      if (debug)
        console.log(
          "Socket déjà initialisé, fermeture de l'ancienne connexion"
        );
      socketRef.current.disconnect();
    }

    if (debug) console.log("Initialisation de la connexion WebSocket");

    try {
      // Disable WebSocket connection in development if server is not running
      if (process.env.NODE_ENV === "development" && connectionError) {
        if (debug)
          console.log(
            "WebSocket désactivé en développement en raison d'erreurs précédentes"
          );
        return () => {};
      }

      socketRef.current = io({
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        withCredentials: true,
      });

      // Gestionnaires d'événements de base
      socketRef.current.on("connect", handleConnect);
      socketRef.current.on("disconnect", handleDisconnect);
      socketRef.current.on("connect_error", handleConnectError);
      socketRef.current.on("error", handleError);
      socketRef.current.on("reconnect_attempt", handleReconnectAttempt);
      socketRef.current.on("reconnect_failed", handleReconnectFailed);

      // Gestionnaires d'événements spécifiques
      socketRef.current.on("notification", handleNotification);
      socketRef.current.on("status-updated", handleStatusUpdate);
      socketRef.current.on("authenticated", handleAuthenticated);
      socketRef.current.on("pong", handlePong);

      return () => {
        if (socketRef.current) {
          if (debug) console.log("Nettoyage de la connexion WebSocket");
          socketRef.current.off("connect", handleConnect);
          socketRef.current.off("disconnect", handleDisconnect);
          socketRef.current.off("connect_error", handleConnectError);
          socketRef.current.off("error", handleError);
          socketRef.current.off("reconnect_attempt", handleReconnectAttempt);
          socketRef.current.off("reconnect_failed", handleReconnectFailed);
          socketRef.current.off("notification", handleNotification);
          socketRef.current.off("status-updated", handleStatusUpdate);
          socketRef.current.off("authenticated", handleAuthenticated);
          socketRef.current.off("pong", handlePong);
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        if (reconnectIntervalRef.current) {
          clearInterval(reconnectIntervalRef.current);
          reconnectIntervalRef.current = null;
        }
      };
    } catch (error) {
      console.error("Erreur lors de l'initialisation du socket:", error);
      setConnectionError("Erreur d'initialisation");
      return () => {};
    }
  }, [debug, connectionError]);

  // Gestionnaires d'événements
  const handleConnect = useCallback(() => {
    if (debug) console.log("WebSocket connecté!");
    setIsConnected(true);
    setConnectionError(null);
    reconnectAttemptsRef.current = 0;

    // Authentifier l'utilisateur après la connexion
    if (session?.user?.id) {
      authenticateUser();
    }
  }, [session, debug]);

  const handleDisconnect = useCallback(
    (reason: string) => {
      if (debug) console.log(`WebSocket déconnecté: ${reason}`);
      setIsConnected(false);
      setIsAuthenticated(false);

      // Tenter de se reconnecter automatiquement
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        if (!reconnectIntervalRef.current) {
          reconnectIntervalRef.current = setInterval(() => {
            if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
              if (reconnectIntervalRef.current) {
                clearInterval(reconnectIntervalRef.current);
                reconnectIntervalRef.current = null;
              }
              setConnectionError(
                "Nombre maximum de tentatives de reconnexion atteint"
              );
              return;
            }

            reconnectAttemptsRef.current++;
            if (debug)
              console.log(
                `Tentative de reconnexion WebSocket (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
              );

            if (socketRef.current) {
              socketRef.current.connect();
            } else {
              initializeSocket();
            }
          }, 5000); // Essayer toutes les 5 secondes
        }
      } else {
        if (debug)
          console.log("Nombre maximum de tentatives de reconnexion atteint");
        setConnectionError(
          "Nombre maximum de tentatives de reconnexion atteint"
        );
        if (reconnectIntervalRef.current) {
          clearInterval(reconnectIntervalRef.current);
          reconnectIntervalRef.current = null;
        }
      }
    },
    [initializeSocket, debug]
  );

  const handleConnectError = useCallback((error: Error) => {
    console.error("Erreur de connexion WebSocket:", error.message);
    setConnectionError(error.message);

    // In development, show a more helpful message
    if (process.env.NODE_ENV === "development") {
      console.log(
        "⚠️ Conseil de développement: Assurez-vous que le serveur Socket.IO est en cours d'exécution."
      );
      console.log(
        "👉 Exécutez 'node server.js' pour démarrer le serveur WebSocket."
      );
    }
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error("Erreur WebSocket:", error.message);
    setConnectionError(error.message);
  }, []);

  const handleReconnectAttempt = useCallback(
    (attempt: number) => {
      if (debug)
        console.log(`Tentative de reconnexion WebSocket #${attempt}...`);
    },
    [debug]
  );

  const handleReconnectFailed = useCallback(() => {
    console.error(
      "Échec de la reconnexion WebSocket après plusieurs tentatives"
    );
    setConnectionError("Échec de la reconnexion après plusieurs tentatives");

    // Only show toast in production to avoid annoying developers
    if (process.env.NODE_ENV === "production") {
      toast({
        title: "Problème de connexion",
        description:
          "Impossible de se connecter au serveur de notifications. Veuillez rafraîchir la page.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleNotification = useCallback(
    (notification: any) => {
      if (debug) console.log("Notification WebSocket reçue:", notification);

      // Créer un événement personnalisé pour la notification
      const event = new CustomEvent("websocket-notification", {
        detail: notification,
      });

      // Déclencher l'événement
      window.dispatchEvent(event);

      // Afficher un toast pour les notifications importantes
      if (notification.showToast) {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === "error" ? "destructive" : "default",
        });
      }
    },
    [toast, debug]
  );

  const handleStatusUpdate = useCallback(
    (update: any) => {
      if (debug) console.log("Mise à jour de statut WebSocket reçue:", update);

      // Créer un événement personnalisé pour la mise à jour de statut
      const event = new CustomEvent("competition-status-updated", {
        detail: update,
      });

      // Déclencher l'événement
      window.dispatchEvent(event);
    },
    [debug]
  );

  const handleAuthenticated = useCallback(
    (response: { success: boolean; userId?: string; error?: string }) => {
      if (response.success) {
        if (debug)
          console.log(
            `WebSocket authentifié pour l'utilisateur: ${response.userId}`
          );
        setIsAuthenticated(true);

        // Démarrer le ping périodique pour maintenir la connexion
        startPingInterval();
      } else {
        console.error(
          `Échec de l'authentification WebSocket: ${response.error}`
        );
        setIsAuthenticated(false);
        setConnectionError(`Échec de l'authentification: ${response.error}`);
      }
    },
    [debug]
  );

  const handlePong = useCallback((data: { timestamp: Date }) => {
    setLastPing(new Date(data.timestamp));
  }, []);

  // Fonction pour authentifier l'utilisateur
  const authenticateUser = useCallback(() => {
    if (!socketRef.current || !session?.user?.id) return;

    if (debug)
      console.log(
        "Authentification WebSocket pour l'utilisateur:",
        session.user.id
      );
    socketRef.current.emit("authenticate", {
      userId: session.user.id,
      role: session.user.role || "PARTICIPANT",
    });
  }, [session, debug]);

  // Fonction pour rejoindre une room de compétition
  const joinCompetition = useCallback(
    (competitionId: string) => {
      if (!socketRef.current || !isConnected) return;

      if (debug)
        console.log(`Rejoindre la room de la compétition: ${competitionId}`);
      socketRef.current.emit("join-competition", competitionId);
    },
    [isConnected, debug]
  );

  // Fonction pour rejoindre une room d'organisateur
  const joinOrganizerRoom = useCallback(() => {
    if (!socketRef.current || !isConnected || !session?.user?.id) return;

    if (debug)
      console.log(`Rejoindre la room de l'organisateur: ${session.user.id}`);
    socketRef.current.emit("join-organizer", session.user.id);
  }, [isConnected, session, debug]);

  // Fonction pour démarrer le ping périodique
  const startPingInterval = useCallback(() => {
    // Nettoyer l'intervalle existant si présent
    if (reconnectIntervalRef.current) {
      clearInterval(reconnectIntervalRef.current);
    }

    // Créer un nouvel intervalle de ping
    reconnectIntervalRef.current = setInterval(() => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("ping");
      }
    }, 30000); // Ping toutes les 30 secondes
  }, [isConnected]);

  // Initialiser la connexion WebSocket au chargement du composant
  useEffect(() => {
    const cleanup = initializeSocket();
    return cleanup;
  }, [initializeSocket]);

  // Authentifier l'utilisateur lorsque la session change
  useEffect(() => {
    if (isConnected && session?.user?.id) {
      authenticateUser();

      // Si l'utilisateur est un organisateur, rejoindre sa room
      if (session.user.role === "ORGANIZER") {
        joinOrganizerRoom();
      }
    }
  }, [isConnected, session, authenticateUser, joinOrganizerRoom]);

  // Nettoyer l'intervalle de ping à la déconnexion
  useEffect(() => {
    return () => {
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
    };
  }, []);

  // Fonction pour émettre un événement
  const emit = useCallback(
    (event: string, data?: any) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit(event, data);
        return true;
      }
      return false;
    },
    [isConnected]
  );

  // Fonction pour écouter un événement
  const on = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      if (socketRef.current) {
        socketRef.current.on(event, callback);
        return true;
      }
      return false;
    },
    []
  );

  // Fonction pour arrêter d'écouter un événement
  const off = useCallback(
    (event: string, callback?: (...args: any[]) => void) => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
        return true;
      }
      return false;
    },
    []
  );

  return {
    isConnected,
    isAuthenticated,
    lastPing,
    connectionError,
    joinCompetition,
    joinOrganizerRoom,
    emit,
    on,
    off,
  };
}
