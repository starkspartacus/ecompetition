import { type NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/database-service";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log("Données reçues:", JSON.stringify(data, null, 2));

    // Valider les données requises
    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      console.error("Données manquantes:", {
        email: !!data.email,
        password: !!data.password,
        firstName: !!data.firstName,
        lastName: !!data.lastName,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Données manquantes",
          missingFields: {
            email: !data.email,
            password: !data.password,
            firstName: !data.firstName,
            lastName: !data.lastName,
          },
        },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const emailAlreadyExists = await db.users.findByEmail(data.email);
    if (emailAlreadyExists) {
      console.error("Email déjà utilisé:", data.email);
      return NextResponse.json(
        { success: false, message: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Vérifier si le numéro de téléphone existe déjà (s'il est fourni)
    if (data.phoneNumber) {
      const phoneNumberAlreadyExists = await db.users.findByPhoneNumber(
        data.phoneNumber
      );
      if (phoneNumberAlreadyExists) {
        console.error("Numéro de téléphone déjà utilisé:", data.phoneNumber);
        return NextResponse.json(
          {
            success: false,
            message: "Ce numéro de téléphone est déjà utilisé",
          },
          { status: 400 }
        );
      }
    }

    // Hacher le mot de passe
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(data.password, salt);

    // Créer l'utilisateur
    const user = await db.users.create({
      ...data,
      password: hashedPassword,
    });

    console.log("Utilisateur créé avec succès:", user?.id);
    return NextResponse.json({
      success: true,
      message: "Compte créé avec succès",
      user: {
        id: user?.id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        role: user?.role,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de l'inscription",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
