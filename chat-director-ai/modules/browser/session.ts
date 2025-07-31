
import Browserbase from "@browserbasehq/sdk";

export async function createBrowserbaseSession(contextId: string) {
  const bb = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY!,
  });

  const session = await bb.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    browserSettings: {
      context: {
        id: contextId,
        persist: true,
      },
    },
    keepAlive: true,
  });
  return session;
}

export async function endBrowserbaseSession(sessionId: string) {
  const bb = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY!,
  });
  await bb.sessions.update(sessionId, {
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    status: "REQUEST_RELEASE",
  });
}

export async function getBrowserbaseDebugUrl(sessionId: string) {
  const bb = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY!,
  });
  const session = await bb.sessions.debug(sessionId);
  return session.debuggerFullscreenUrl;
}

export async function createBrowserbaseContext() {
    const bb = new Browserbase({
        apiKey: process.env.BROWSERBASE_API_KEY!,
    });
    const context = await bb.contexts.create({
        projectId: process.env.BROWSERBASE_PROJECT_ID!,
    });
    return context;
}
