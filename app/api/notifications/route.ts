import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    console.log("📬 Récupération des notifications...");

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.log("❌ Session non trouvée ou utilisateur manquant");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.log(`👤 Utilisateur: ${session.user.email} (${session.user.id})`);

    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") || "20");
    const skip = Number.parseInt(searchParams.get("skip") || "0");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    console.log(
      `📊 Paramètres: limit=${limit}, skip=${skip}, unreadOnly=${unreadOnly}`
    );

    // Validation de l'ObjectId
    if (!ObjectId.isValid(session.user.id)) {
      console.log("❌ ID utilisateur invalide");
      return NextResponse.json(
        { error: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    const userObjectId = new ObjectId(session.user.id);

    // Récupérer toutes les notifications de l'utilisateur
    console.log("🔍 Recherche des notifications...");
    const allNotifications = await db.notifications.findByUser(
      userObjectId.toString(),
      unreadOnly
    );

    console.log(`📋 ${allNotifications.length} notifications trouvées`);

    // Appliquer la pagination manuellement
    const paginatedNotifications = allNotifications.slice(skip, skip + limit);

    // Compter les notifications non lues
    console.log("🔢 Comptage des notifications non lues...");
    const unreadNotifications = await db.notifications.findByUser(
      userObjectId.toString(),
      true
    ); // true = unreadOnly
    const unreadCount = unreadNotifications.length;

    console.log(`🔔 ${unreadCount} notifications non lues`);

    // Formater les notifications pour la réponse
    const formattedNotifications = paginatedNotifications
      .filter((notification: any) => notification._id) // Supprimer les notifications sans ID
      .map((notification: any) => ({
        id: notification._id.toString(),
        userId: notification.userId.toString(),
        type: notification.type,
        category: notification.category,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata || {}, // Utiliser metadata au lieu de data
        isRead: notification.isRead || false, // Utiliser isRead au lieu de read
        readAt: notification.readAt,
        expiresAt: notification.expiresAt,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      }));

    console.log(`✅ ${formattedNotifications.length} notifications formatées`);

    const response = {
      notifications: formattedNotifications,
      unreadCount,
      hasMore: skip + formattedNotifications.length < allNotifications.length,
      total: allNotifications.length,
      pagination: {
        limit,
        skip,
        current: formattedNotifications.length,
      },
      filters: {
        unreadOnly,
      },
    };

    console.log("📤 Envoi de la réponse");
    return NextResponse.json(response);
  } catch (error) {
    console.error(
      "💥 Erreur lors de la récupération des notifications:",
      error
    );

    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    const errorResponse = {
      error: "Erreur lors de la récupération des notifications",
      details:
        process.env.NODE_ENV === "development" ? errorMessage : undefined,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Méthode POST pour créer une nouvelle notification (optionnel)
export async function POST(request: NextRequest) {
  try {
    console.log("📝 Création d'une nouvelle notification...");

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.log("❌ Session non trouvée");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier si l'utilisateur est admin (optionnel)
    if (session.user.role !== "ADMIN") {
      console.log("❌ Permissions insuffisantes");
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, type, category, title, message, metadata, expiresAt } =
      body;

    // Validation des données
    if (!userId || !type || !title || !message) {
      console.log("❌ Données manquantes");
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(userId)) {
      console.log("❌ ID utilisateur invalide");
      return NextResponse.json(
        { error: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    // Créer la notification
    const notificationData = {
      userId: new ObjectId(userId),
      type: type as any,
      category: category as any,
      title,
      message,
      metadata: metadata || {}, // Utiliser metadata
      isRead: false, // Utiliser isRead
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    };

    console.log("💾 Sauvegarde de la notification...");
    const notification = await db.notifications.create(notificationData);

    if (!notification) {
      console.log("❌ Échec de la création");
      return NextResponse.json(
        { error: "Erreur lors de la création de la notification" },
        { status: 500 }
      );
    }

    console.log(`✅ Notification créée: ${notification._id}`);

    const response = {
      id: notification._id!.toString(),
      userId: notification.userId.toString(),
      type: notification.type,
      category: notification.category,
      title: notification.title,
      message: notification.message,

      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("💥 Erreur lors de la création de la notification:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    const errorResponse = {
      error: "Erreur lors de la création de la notification",
      details:
        process.env.NODE_ENV === "development" ? errorMessage : undefined,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
