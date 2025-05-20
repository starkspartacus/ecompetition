import { type NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  createUserWithoutTransaction,
  emailExists,
  phoneNumberExists,
} from "@/lib/db-helpers";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Valider les données requises
    if (!data.email || !data.password || !data.name) {
      return NextResponse.json(
        { success: false, message: "Données manquantes" },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const emailAlreadyExists = await emailExists(data.email);
    if (emailAlreadyExists) {
      return NextResponse.json(
        { success: false, message: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Vérifier si le numéro de téléphone existe déjà (s'il est fourni)
    if (data.phoneNumber) {
      const phoneNumberAlreadyExists = await phoneNumberExists(
        data.phoneNumber
      );
      if (phoneNumberAlreadyExists) {
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

    // Données à enregistrer
    const userData = {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      phoneNumber: data.phoneNumber || null,
      role: data.role || "PARTICIPANT",
    };

    // Créer l'utilisateur sans transaction
    const user = await createUserWithoutTransaction(userData);

    return NextResponse.json({
      success: true,
      message: "Compte créé avec succès",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}
