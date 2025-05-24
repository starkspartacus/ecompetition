"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { io, type Socket } from "socket.io-client";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export function RealTimeNotifications() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Initialiser la connexion WebSocket
  useEffect(() => {
    if (!session?.user?.id) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
    const socketInstance = io(socketUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      withCredentials: true,
    });

    socketInstance.on("connect", () => {
      console.log("🔌 Connecté au serveur WebSocket");
      setIsConnected(true);

      // Authentifier l'utilisateur
      socketInstance.emit("authenticate", {
        userId: session.user.id,
        role: session.user.role,
      });
    });

    socketInstance.on("authenticated", (response) => {
      if (response.success) {
        console.log("🔐 Authentifié avec succès sur le WebSocket");

        // Rejoindre la room de l'utilisateur
        socketInstance.emit("join-room", `user-${session.user.id}`);

        // Si c'est un organisateur, rejoindre la room des organisateurs
        if (session.user.role === "ORGANIZER") {
          socketInstance.emit("join-room", "organizers");
          socketInstance.emit("join-room", `organizer-${session.user.id}`);
        }

        // Charger les notifications
        fetchNotifications();
      } else {
        console.error(
          "❌ Échec de l'authentification WebSocket:",
          response.error
        );
      }
    });

    socketInstance.on("disconnect", (reason) => {
      console.log(`🔌 Déconnecté du serveur WebSocket: ${reason}`);
      setIsConnected(false);
    });

    socketInstance.on("notification", (notification) => {
      console.log("📬 Nouvelle notification reçue:", notification);

      // Ajouter la notification à la liste
      setNotifications((prev) => [
        {
          _id: notification._id || `temp-${Date.now()}`,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      // Incrémenter le compteur de notifications non lues
      setUnreadCount((prev) => prev + 1);

      // Afficher un toast
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });
    });

    socketInstance.on("new-participation-request", (data) => {
      console.log("🏆 Nouvelle demande de participation reçue:", data);

      // Afficher un toast avec un bouton d'action
      toast({
        title: "Nouvelle demande de participation",
        description: `${data.participantName} souhaite participer à "${data.competitionTitle}"`,
        duration: 8000,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = `/organizer/participations/${data.participationId}`;
            }}
          >
            Voir
          </Button>
        ),
      });
    });

    socketInstance.on("connect_error", (error) => {
      console.error("❌ Erreur de connexion WebSocket:", error);
    });

    setSocket(socketInstance);

    // Nettoyage à la déconnexion
    return () => {
      socketInstance.disconnect();
    };
  }, [session?.user?.id, session?.user?.role, toast]);

  // Charger les notifications depuis l'API
  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
    }
  };

  // Marquer une notification comme lue
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/mark-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        // Mettre à jour l'état local
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error(
        "Erreur lors du marquage de la notification comme lue:",
        error
      );
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`/api/notifications/mark-all-read`, {
        method: "POST",
      });

      if (response.ok) {
        // Mettre à jour l'état local
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error(
        "Erreur lors du marquage de toutes les notifications comme lues:",
        error
      );
    }
  };

  // Gérer le clic sur une notification
  const handleNotificationClick = (notification: Notification) => {
    // Marquer comme lue
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Rediriger en fonction du type de notification
    if (
      notification.type === "PARTICIPATION_REQUEST" &&
      notification.data?.participationId
    ) {
      window.location.href = `/organizer/participations/${notification.data.participationId}`;
    } else if (notification.data?.competitionId) {
      window.location.href = `/${session?.user?.role?.toLowerCase()}/competitions/${
        notification.data.competitionId
      }`;
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (!session?.user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {isConnected ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Tout marquer comme lu
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-4 px-2 text-center text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <DropdownMenuItem
              key={notification._id}
              className={`flex flex-col items-start p-3 cursor-pointer ${
                !notification.read ? "bg-muted/50" : ""
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex justify-between w-full">
                <span className="font-medium">{notification.title}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(notification.createdAt)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {notification.message}
              </p>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center font-medium"
          onClick={() => (window.location.href = "/notifications")}
        >
          Voir toutes les notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
