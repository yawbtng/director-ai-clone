
import { NextResponse } from "next/server";
import { endBrowserbaseSession } from "@/modules/browser/session";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: "Missing sessionId" },
      { status: 400 }
    );
  }

  try {
    await endBrowserbaseSession(sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error stopping session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to stop session" },
      { status: 500 }
    );
  }
}
