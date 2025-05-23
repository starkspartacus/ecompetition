import { NextResponse } from "next/server";
import { normalizeUserData } from "@/lib/auth-service";

export async function POST() {
  try {
    const result = await normalizeUserData();

    return NextResponse.json({
      success: true,
      message: `${result.count} utilisateurs normalisés avec succès`,
      count: result.count,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la normalisation des données utilisateur:",
      error
    );
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la normalisation des données utilisateur",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
