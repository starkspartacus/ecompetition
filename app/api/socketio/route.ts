import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This route is needed to handle Socket.IO handshake
export async function GET(req: NextRequest) {
  // This is just a placeholder to make the route exist
  // The actual Socket.IO handling is done in server.ts
  return new NextResponse("Socket.IO endpoint", { status: 200 });
}
