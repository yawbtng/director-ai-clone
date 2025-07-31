
import { NextResponse } from "next/server";
import { createBrowserbaseSession, endBrowserbaseSession, getBrowserbaseDebugUrl } from "@/modules/browser/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const timezone = body.timezone as string;
    const providedContextId = body.contextId as string;
    const { session, contextId } = await createBrowserbaseSession(
      timezone,
      providedContextId
    );
    const liveUrl = await getBrowserbaseDebugUrl(session.id);
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      sessionUrl: liveUrl,
      contextId,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create session" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const sessionId = body.sessionId as string;
  await endBrowserbaseSession(sessionId);
  return NextResponse.json({ success: true });
}
