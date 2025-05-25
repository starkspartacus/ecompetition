import { type NextRequest, NextResponse } from "next/server";
import { checkPhoneNumberExists } from "@/lib/auth-service";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, country } = await request.json();

    if (!phoneNumber || !country) {
      return NextResponse.json(
        {
          success: false,
          message: "Numéro de téléphone et pays requis",
        },
        { status: 400 }
      );
    }

    const exists = await checkPhoneNumberExists(phoneNumber, country);

    return NextResponse.json({
      success: true,
      exists,
      message: exists
        ? "Ce numéro est déjà utilisé dans ce pays"
        : "Numéro disponible",
    });
  } catch (error) {
    console.error("Erreur validation téléphone:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la validation",
      },
      { status: 500 }
    );
  }
}
