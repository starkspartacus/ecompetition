"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

interface OrganizerNotificationsProps {
  userId: string;
  initialNotifications: Notification[];
  initialCount: number;
}

export function OrganizerNotifications({
  userId,
  initialNotifications,
  initialCount,
}: OrganizerNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>(
    initialNotifications || []
  );
  const [unreadCount, setUnreadCount] = useState<number>(initialCount || 0);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Écouter les nouvelles notifications via WebSocket
  useEffect(() => {
    // Fonction pour gérer les nouvelles notifications
    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    // Configurer le WebSocket (si disponible)
    if (typeof window !== "undefined") {
      // Vérifier si le socket est disponible
      const socket = (window as any).socket;

      if (socket) {
        // S'abonner aux notifications
        socket.on("notification", handleNewNotification);

        // Nettoyer l'abonnement
        return () => {
          socket.off("notification", handleNewNotification);
        };
      }
    }
  }, []);

  // Marquer les notifications comme lues
  const markAsRead = async (notificationId?: string) => {
    try {
      const endpoint = notificationId
        ? `/api/notifications/mark-read?id=${notificationId}`
        : `/api/notifications/mark-read?userId=${userId}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        if (notificationId) {
          // Marquer une seule notification comme lue
          setNotifications((prev) =>
            prev.map((n) =>
              n._id === notificationId ? { ...n, read: true } : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        } else {
          // Marquer toutes les notifications comme lues
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          setUnreadCount(0);
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors du marquage des notifications comme lues:",
        error
      );
    }
  };

  // Gérer le clic sur une notification
  const handleNotificationClick = async (notification: Notification) => {
    // Marquer comme lue
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Rediriger en fonction du type de notification
    if (
      notification.type === "PARTICIPATION_REQUEST" &&
      notification.data?.participationId
    ) {
      router.push(
        `/organizer/participations/${notification.data.participationId}`
      );
    } else if (notification.data?.competitionId) {
      router.push(`/organizer/competitions/${notification.data.competitionId}`);
    }

    // Fermer le popover
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAsRead()}>
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`cursor-pointer p-3 transition-colors hover:bg-muted ${
                    !notification.read ? "bg-muted/50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <h5 className="font-medium">{notification.title}</h5>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune notification
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
