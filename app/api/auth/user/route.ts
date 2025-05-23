import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserById, updateUser } from "@/lib/auth-service";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.log(
      "Récupération des données pour l'utilisateur:",
      session.user.id
    );

    // Récupérer les données complètes de l'utilisateur depuis MongoDB
    const user = await getUserById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Retirer les informations sensibles
    const { password, ...userWithoutPassword } = user as any;

    console.log("Données utilisateur récupérées:", {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      firstName: userWithoutPassword.firstName,
      lastName: userWithoutPassword.lastName,
      role: userWithoutPassword.role,
      countryCode: userWithoutPassword.countryCode,
      city: userWithoutPassword.city,
      commune: userWithoutPassword.commune,
    });

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données utilisateur:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données utilisateur" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const data = await request.json();
    console.log("Données reçues pour mise à jour:", data);

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
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    console.log("Données filtrées pour mise à jour:", updateData);

    // Mettre à jour l'utilisateur dans MongoDB
    const updatedUser = await updateUser(session.user.id, updateData);

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }

    // Retirer les informations sensibles
    const { password, ...userWithoutPassword } = updatedUser as any;

    console.log("Utilisateur mis à jour avec succès:", {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      countryCode: userWithoutPassword.countryCode,
      city: userWithoutPassword.city,
      commune: userWithoutPassword.commune,
    });

    return NextResponse.json({
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
