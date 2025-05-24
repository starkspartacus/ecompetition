"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, X, AlertCircle } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  link?: string;
  data?: any;
}

export function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { isConnected, isAuthenticated, joinOrganizerRoom, on, off } =
    useWebSocket();
  const { data: session } = useSession();
  const { toast } = useToast();
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const isOrganizerRef = useRef(false);

  // Initialiser le son de notification
  useEffect(() => {
    notificationSoundRef.current = new Audio("/sounds/notification.mp3");
  }, []);

  // Vérifier si l'utilisateur est un organisateur
  useEffect(() => {
    isOrganizerRef.current = session?.user?.role === "ORGANIZER";

    // Si c'est un organisateur, rejoindre sa room spécifique
    if (isOrganizerRef.current && isConnected) {
      joinOrganizerRoom();
    }
  }, [session, isConnected, joinOrganizerRoom]);

  const addNotification = useCallback((notification: Notification) => {
    // Jouer le son de notification
    if (notificationSoundRef.current) {
      notificationSoundRef.current.play().catch((err) => {
        console.log("Impossible de jouer le son de notification:", err);
      });
    }

    setNotifications((prev) => {
      // Vérifier si la notification existe déjà (éviter les doublons)
      const exists = prev.some(
        (n) =>
          n.title === notification.title &&
          n.message === notification.message &&
          // Considérer comme doublon si moins de 5 secondes d'écart
          Math.abs(
            new Date(n.timestamp).getTime() -
              new Date(notification.timestamp).getTime()
          ) < 5000
      );

      if (exists) {
        return prev;
      }

      return [notification, ...prev].slice(0, 5);
    });

    // Supprimer automatiquement après 8 secondes
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 8000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Gérer les notifications de mise à jour de statut
  useEffect(() => {
    const handleStatusUpdate = (event: CustomEvent<any>) => {
      const { competitionId, oldStatus, newStatus, reason, isOrganizer } =
        event.detail;

      // Ne traiter que les notifications destinées aux organisateurs si l'utilisateur est un organisateur
      if (isOrganizer && !isOrganizerRef.current) {
        return;
      }

      addNotification({
        id: `status-${competitionId}-${Date.now()}`,
        title: "Statut mis à jour",
        message: `${
          reason || "La compétition a changé de statut"
        }: ${oldStatus} → ${newStatus}`,
        type: "info",
        timestamp: new Date(),
        data: { competitionId, oldStatus, newStatus },
      });
    };

    window.addEventListener(
      "competition-status-updated",
      handleStatusUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "competition-status-updated",
        handleStatusUpdate as EventListener
      );
    };
  }, [addNotification]);

  // Gérer les notifications WebSocket
  useEffect(() => {
    const handleNotification = (event: CustomEvent<any>) => {
      const {
        title,
        message,
        type = "info",
        timestamp,
        link,
        data,
      } = event.detail;

      addNotification({
        id: `notification-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)}`,
        title,
        message,
        type,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        link,
        data,
      });

      // Si c'est une notification de participation et que l'utilisateur est un organisateur
      if (
        type === "PARTICIPATION_REQUEST" ||
        event.detail.type === "PARTICIPATION_REQUEST"
      ) {
        // Afficher un toast plus visible
        toast({
          title: "Nouvelle demande de participation",
          description: message,
          variant: "default",
        });
      }
    };

    window.addEventListener(
      "websocket-notification",
      handleNotification as EventListener
    );

    return () => {
      window.removeEventListener(
        "websocket-notification",
        handleNotification as EventListener
      );
    };
  }, [addNotification, toast]);

  // Configurer les écouteurs d'événements WebSocket
  useEffect(() => {
    if (isConnected) {
      // Écouter les notifications
      const handleNotificationEvent = (data: any) => {
        const {
          title,
          message,
          type = "info",
          timestamp,
          link,
          data: eventData,
        } = data;

        addNotification({
          id: `notification-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}`,
          title,
          message,
          type,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          link,
          data: eventData,
        });

        // Si c'est une notification de participation et que l'utilisateur est un organisateur
        if (
          type === "PARTICIPATION_REQUEST" ||
          data.type === "PARTICIPATION_REQUEST"
        ) {
          // Afficher un toast plus visible
          toast({
            title: "Nouvelle demande de participation",
            description: message,
            variant: "default",
          });
        }
      };

      // Écouter les mises à jour de statut
      const handleStatusUpdate = (data: any) => {
        const { competitionId, oldStatus, newStatus, reason, isOrganizer } =
          data;

        // Ne traiter que les notifications destinées aux organisateurs si l'utilisateur est un organisateur
        if (isOrganizer && !isOrganizerRef.current) {
          return;
        }

        addNotification({
          id: `status-${competitionId}-${Date.now()}`,
          title: "Statut mis à jour",
          message: `${
            reason || "La compétition a changé de statut"
          }: ${oldStatus} → ${newStatus}`,
          type: "info",
          timestamp: new Date(),
          data: { competitionId, oldStatus, newStatus },
        });
      };

      // Enregistrer les écouteurs
      on("notification", handleNotificationEvent);
      on("status-updated", handleStatusUpdate);

      // Nettoyer les écouteurs
      return () => {
        off("notification", handleNotificationEvent);
        off("status-updated", handleStatusUpdate);
      };
    }
  }, [isConnected, addNotification, on, off, toast]);

  // Ajouter une notification de connexion WebSocket uniquement lors du changement d'état
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isConnected && isAuthenticated) {
      // Délai pour éviter les notifications trop fréquentes
      timeoutId = setTimeout(() => {
        addNotification({
          id: `websocket-connected-${Date.now()}`,
          title: "Connecté",
          message: "Vous recevrez les mises à jour en temps réel",
          type: "success",
          timestamp: new Date(),
        });
      }, 1000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isConnected, isAuthenticated, addNotification]);

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <Check className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getColor = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "border-green-500 bg-green-50 dark:bg-green-900/20";
      case "warning":
        return "border-amber-500 bg-amber-50 dark:bg-amber-900/20";
      case "error":
        return "border-red-500 bg-red-50 dark:bg-red-900/20";
      case "info":
      default:
        return "border-blue-500 bg-blue-50 dark:bg-blue-900/20";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={cn(
              "flex w-80 items-start gap-3 rounded-lg border-l-4 bg-white p-4 shadow-lg dark:bg-gray-800",
              getColor(notification.type),
              notification.link
                ? "cursor-pointer hover:shadow-xl transition-shadow"
                : ""
            )}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="mt-0.5">{getIcon(notification.type)}</div>
            <div className="flex-1">
              <h4 className="font-medium">{notification.title}</h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {notification.message}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </p>
              {notification.link && (
                <p className="mt-1 text-xs text-blue-500 hover:underline">
                  Cliquer pour voir
                </p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
