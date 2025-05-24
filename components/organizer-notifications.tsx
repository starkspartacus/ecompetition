"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellRing, Check, X } from "lucide-react";
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

interface ParticipationRequest {
  participationId: string;
  competitionId: string;
  competitionTitle: string;
  participantId: string;
  participantName: string;
  timestamp: string;
}

export function OrganizerNotifications() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [participationRequests, setParticipationRequests] = useState<
    ParticipationRequest[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Initialiser la connexion WebSocket
  useEffect(() => {
    if (!session?.user?.id || session?.user?.role !== "ORGANIZER") return;

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
        role: "ORGANIZER",
      });
    });

    socketInstance.on("authenticated", (response) => {
      if (response.success) {
        console.log("🔐 Authentifié avec succès sur le WebSocket");

        // Rejoindre les rooms spécifiques
        socketInstance.emit("join-room", `user-${session.user.id}`);
        socketInstance.emit("join-room", "organizers");
        socketInstance.emit("join-room", `organizer-${session.user.id}`);

        // Charger les notifications
        fetchNotifications();
        fetchParticipationRequests();
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

      // Ajouter à la liste des demandes de participation
      setParticipationRequests((prev) => [
        {
          participationId: data.participationId,
          competitionId: data.competitionId,
          competitionTitle: data.competitionTitle,
          participantId: data.participantId,
          participantName: data.participantName,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);

      // Afficher un toast avec des boutons d'action
      toast({
        title: "Nouvelle demande de participation",
        description: `${data.participantName} souhaite participer à "${data.competitionTitle}"`,
        duration: 10000,
        action: (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                approveParticipation(data.participationId);
              }}
            >
              <Check className="h-4 w-4 mr-1" />
              Approuver
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = `/organizer/participations/${data.participationId}`;
              }}
            >
              Voir
            </Button>
          </div>
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

  // Charger les demandes de participation en attente
  const fetchParticipationRequests = async () => {
    try {
      const response = await fetch("/api/participations/pending");
      if (response.ok) {
        const data = await response.json();
        setParticipationRequests(data.participations || []);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des demandes de participation:",
        error
      );
    }
  };

  // Approuver une participation
  const approveParticipation = async (participationId: string) => {
    try {
      const response = await fetch(
        `/api/participations/${participationId}/approve`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        // Mettre à jour la liste des demandes
        setParticipationRequests((prev) =>
          prev.filter((req) => req.participationId !== participationId)
        );

        toast({
          title: "Participation approuvée",
          description: "Le participant a été ajouté à la compétition",
          duration: 3000,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Une erreur est survenue",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'approbation de la participation:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'approbation",
        variant: "destructive",
      });
    }
  };

  // Rejeter une participation
  const rejectParticipation = async (participationId: string) => {
    try {
      const response = await fetch(
        `/api/participations/${participationId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: "Rejeté par l'organisateur" }),
        }
      );

      if (response.ok) {
        // Mettre à jour la liste des demandes
        setParticipationRequests((prev) =>
          prev.filter((req) => req.participationId !== participationId)
        );

        toast({
          title: "Participation rejetée",
          description: "La demande a été rejetée",
          duration: 3000,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Une erreur est survenue",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors du rejet de la participation:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du rejet",
        variant: "destructive",
      });
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

  if (!session?.user || session.user.role !== "ORGANIZER") return null;

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
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel>Demandes de participation</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {participationRequests.length === 0 ? (
          <div className="py-2 px-2 text-center text-muted-foreground">
            Aucune demande en attente
          </div>
        ) : (
          participationRequests.slice(0, 3).map((request) => (
            <DropdownMenuItem
              key={request.participationId}
              className="flex flex-col items-start p-3"
              onSelect={(e) => e.preventDefault()}
            >
              <div className="flex justify-between w-full">
                <span className="font-medium">{request.participantName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(request.timestamp)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Souhaite participer à "{request.competitionTitle}"
              </p>
              <div className="flex space-x-2 mt-2 w-full justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => approveParticipation(request.participationId)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approuver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rejectParticipation(request.participationId)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Rejeter
                </Button>
              </div>
            </DropdownMenuItem>
          ))
        )}
        {participationRequests.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center font-medium"
              onClick={() =>
                (window.location.href = "/organizer/participations")
              }
            >
              Voir toutes les demandes ({participationRequests.length})
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Notifications récentes</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-2 px-2 text-center text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          notifications.slice(0, 3).map((notification) => (
            <DropdownMenuItem
              key={notification._id}
              className={`flex flex-col items-start p-3 ${
                !notification.read ? "bg-muted/50" : ""
              }`}
              onClick={() => markAsRead(notification._id)}
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
          onClick={() => (window.location.href = "/organizer/notifications")}
        >
          Voir toutes les notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
