import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      password,
      dateOfBirth,
      country,
      city,
      commune,
      address,
      photoUrl,
      role,
      competitionCategory,
      phoneNumber,
    } = body;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Vérifier si le numéro de téléphone existe déjà (s'il est fourni)
    if (phoneNumber) {
      const existingPhoneUser = await prisma.user.findUnique({
        where: {
          phoneNumber,
        },
      });

      if (existingPhoneUser) {
        return NextResponse.json(
          { message: "Ce numéro de téléphone est déjà utilisé" },
          { status: 400 }
        );
      }
    }

    // Hacher le mot de passe
    const hashedPassword = await hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phoneNumber,
        dateOfBirth: new Date(dateOfBirth),
        country,
        city,
        commune,
        address,
        photoUrl,
        role,
        competitionCategory: role === "ORGANIZER" ? competitionCategory : null,
      },
    });

    return NextResponse.json(
      {
        message: "Utilisateur créé avec succès",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de l'inscription" },
      { status: 500 }
    );
  }
}
