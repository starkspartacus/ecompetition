import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const data = await request.json();
    console.log("Données reçues pour mise à jour du profil:", data);

    // Valider les données
    const allowedFields = [
      "firstName",
      "lastName",
      "phoneNumber",
      "countryCode",
      "address",
      "city",
      "commune",
      "bio",
      "competitionCategory",
      "photoUrl",
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined && data[field] !== null) {
        updateData[field] = data[field];
      }
    }

    console.log("Données filtrées pour mise à jour:", updateData);

    // Mettre à jour l'utilisateur
    const updatedUser = await db.users.updateById(session.user.id, updateData);

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }

    // Retirer les informations sensibles
    const { password, ...userWithoutPassword } = updatedUser as any;

    console.log("Profil mis à jour avec succès");

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: "Profil mis à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Rediriger vers la route /api/auth/user
    return NextResponse.redirect(new URL("/api/auth/user", request.url));
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du profil" },
      { status: 500 }
    );
  }
}
