"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, Info, X } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
}

export function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { isConnected } = useWebSocket();

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 5));

    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    const handleStatusUpdate = (event: CustomEvent<any>) => {
      const { competitionId, oldStatus, newStatus, reason } = event.detail;

      addNotification({
        id: `status-${competitionId}-${Date.now()}`,
        title: "Statut mis à jour",
        message: `${reason}: ${oldStatus} → ${newStatus}`,
        type: "info",
        timestamp: new Date(),
      });
    };

    const handleNotification = (event: CustomEvent<any>) => {
      const { title, message, type = "info" } = event.detail;

      addNotification({
        id: `notification-${Date.now()}`,
        title,
        message,
        type,
        timestamp: new Date(),
      });
    };

    window.addEventListener(
      "competition-status-updated",
      handleStatusUpdate as EventListener
    );
    window.addEventListener(
      "websocket-notification",
      handleNotification as EventListener
    );

    return () => {
      window.removeEventListener(
        "competition-status-updated",
        handleStatusUpdate as EventListener
      );
      window.removeEventListener(
        "websocket-notification",
        handleNotification as EventListener
      );
    };
  }, [addNotification]);

  // Ajouter une notification de connexion WebSocket uniquement lors du changement d'état
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isConnected) {
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
  }, [isConnected, addNotification]);

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <Check className="h-5 w-5 text-green-500" />;
      case "warning":
      case "error":
        return <Bell className="h-5 w-5 text-amber-500" />;
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
              getColor(notification.type)
            )}
          >
            <div className="mt-0.5">{getIcon(notification.type)}</div>
            <div className="flex-1">
              <h4 className="font-medium">{notification.title}</h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {notification.message}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
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
