
import { google } from "@ai-sdk/google";
import { CoreMessage, generateObject, LanguageModel, UserContent, UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { ObserveResult, Stagehand } from "@browserbasehq/stagehand";
import { BrowserStep } from "@/types/agent";
import { ChatMessage } from "@/lib/types";

// Use Google model via Vercel AI SDK
const LLMClient = google("gemini-1.5-flash");

async function runStagehand({
  sessionID,
  method,
  instruction,
}: {
  sessionID: string;
  method:
    | "GOTO"
    | "ACT"
    | "EXTRACT"
    | "CLOSE"
    | "SCREENSHOT"
    | "OBSERVE"
    | "WAIT"
    | "NAVBACK";
  instruction?: string;
}) {
  const stagehand = new Stagehand({
    browserbaseSessionID: sessionID,
    env: "BROWSERBASE",
    modelName: "google/gemini-1.5-flash",
    disablePino: true,
  });
  
  // Add timeout to prevent hanging
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Stagehand operation timed out')), 30000); // 30 second timeout
  });

  try {
    await Promise.race([
      stagehand.init(),
      timeoutPromise
    ]);

    const page = stagehand.page;

    switch (method) {
      case "GOTO":
        await Promise.race([
          page.goto(instruction!, {
            waitUntil: "commit",
            timeout: 60000,
          }),
          timeoutPromise
        ]);
        break;

      case "ACT":
        await Promise.race([
          page.act(instruction!),
          timeoutPromise
        ]);
        break;

      case "EXTRACT": {
        const { extraction } = await Promise.race([
          page.extract(instruction!),
          timeoutPromise
        ]);
        return extraction;
      }

      case "OBSERVE":
        return await Promise.race([
          page.observe(instruction!),
          timeoutPromise
        ]);

      case "CLOSE":
        await Promise.race([
          stagehand.close(),
          timeoutPromise
        ]);
        break;

      case "SCREENSHOT": {
        const cdpSession = await page.context().newCDPSession(page);
        const { data } = await Promise.race([
          cdpSession.send("Page.captureScreenshot"),
          timeoutPromise
        ]);
        return data;
      }

      case "WAIT":
        await new Promise((resolve) =>
          setTimeout(resolve, Number(instruction))
        );
        break;

      case "NAVBACK":
        await Promise.race([
          page.goBack(),
          timeoutPromise
        ]);
        break;
    }
  } catch (error) {
    try {
      await stagehand.close();
    } catch (closeError) {
      console.error("Error closing stagehand:", closeError);
    }
    throw error;
  }
}

async function sendPrompt({
  goal,
  sessionID,
  previousSteps = [],
  previousExtraction,
}: {
  goal: string;
  sessionID: string;
  previousSteps?: BrowserStep[];
  previousExtraction?: string | ObserveResult[];
}) {
  let currentUrl = "";

  try {
    const stagehand = new Stagehand({
      browserbaseSessionID: sessionID,
      env: "BROWSERBASE",
      disablePino: true,
      modelName: "google/gemini-1.5-flash",
    });
    await stagehand.init();
    currentUrl = await stagehand.page.url();
    await stagehand.close();
  } catch (error) {
    console.error("Error getting page info:", error);
  }

  const content: UserContent = [
    {
      type: "text",
      text: `Consider the following screenshot of a web page${
        currentUrl ? ` (URL: ${currentUrl})` : ""
      }, with the goal being "${goal}".
${
  previousSteps.length > 0
    ? `Previous steps taken:
${previousSteps
  .map(
    (step, index) => `
Step ${index + 1}:
- Action: ${step.text}
- Reasoning: ${step.reasoning}
- Tool Used: ${step.tool}
- Instruction: ${step.instruction}
`
  )
  .join("\n")}`
    : ""
}
Determine the immediate next step to take to achieve the goal. 

Important guidelines:
1. Break down complex actions into individual atomic steps
2. For ACT commands, use only one action at a time, such as:
   - Single click on a specific element
   - Type into a single input field
   - Select a single option
3. Avoid combining multiple actions in one instruction
4. If multiple actions are needed, they should be separate steps

If the goal has been achieved, return "close".`,
    },
  ];

  // Add screenshot if navigated to a page previously
  if (
    previousSteps.length > 0 &&
    previousSteps.some((step) => step.tool === "GOTO")
  ) {
    content.push({
      type: "image",
      image: (await runStagehand({
        sessionID,
        method: "SCREENSHOT",
      })) as string,
    });
  }

  if (previousExtraction) {
    content.push({
      type: "text",
      text: `The result of the previous ${
        Array.isArray(previousExtraction) ? "observation" : "extraction"
      } is: ${previousExtraction}.`,
    });
  }

  const message: CoreMessage = {
    role: "user",
    content,
  };

  const result = await generateObject({
    model: LLMClient as unknown as LanguageModel,
    schema: z.object({
      text: z.string(),
      reasoning: z.string(),
      tool: z.enum([
        "GOTO",
        "ACT",
        "EXTRACT",
        "OBSERVE",
        "CLOSE",
        "WAIT",
        "NAVBACK",
      ]),
      instruction: z.string(),
    }),
    messages: [message],
  });

  return {
    result: result.object,
    previousSteps: [...previousSteps, result.object],
  };
}

async function selectStartingUrl(goal: string) {
  const message: CoreMessage = {
    role: "user",
    content: [
      {
        type: "text",
        text: `Given the goal: "${goal}", determine the best URL to start from.
Choose from:
1. A relevant search engine (Google, Bing, etc.)
2. A direct URL if you're confident about the target website
3. Any other appropriate starting point

Return a URL that would be most effective for achieving this goal.`,
      },
    ],
  };

  const result = await generateObject({
    model: LLMClient as unknown as LanguageModel,
    schema: z.object({
      url: z.string().url(),
      reasoning: z.string(),
    }),
    messages: [message],
  });

  return result.object;
}

export async function runAgentLoop({
    goal,
    sessionId,
    dataStream,
  }: {
    goal: string;
    sessionId: string;
    dataStream: UIMessageStreamWriter<ChatMessage>;
  }) {
    let steps: BrowserStep[] = [];
    let isDone = false;
    let stepCounter = 1;
    const MAX_STEPS = 10; // Safety limit to prevent infinite loops
  
    // 1. Determine the starting URL
    const { url, reasoning } = await selectStartingUrl(goal);
    const firstStep: BrowserStep = {
      text: `Navigating to ${url}`,
      reasoning,
      tool: "GOTO" as const,
      instruction: url,
      stepNumber: stepCounter++,
    };

    // Stream the first step
    dataStream.write({ type: "data-agent_step", data: firstStep });
    steps.push(firstStep);
  
    // Execute the first step
    await runStagehand({
      sessionID: sessionId,
      method: "GOTO",
      instruction: url,
    });
  
    // 2. Main agent loop
    while (!isDone && stepCounter <= MAX_STEPS) {
      // Get the next step from the LLM
      const { result, previousSteps: newPreviousSteps } = await sendPrompt({
        goal,
        sessionID: sessionId,
        previousSteps: steps,
      });

      const nextStep: BrowserStep = {
        ...result,
        stepNumber: stepCounter++,
      };
  
      // Stream the next step
      dataStream.write({ type: "data-agent_step", data: nextStep });
      steps = newPreviousSteps as BrowserStep[];
  
      if (nextStep.tool === "CLOSE") {
        isDone = true;
        break;
      }
  
      // Execute the step
      await runStagehand({
        sessionID: sessionId,
        method: nextStep.tool,
        instruction: nextStep.instruction,
      });
    }

    // If we hit the max steps limit, add a final CLOSE step
    if (stepCounter > MAX_STEPS) {
      const finalStep: BrowserStep = {
        text: "Reached maximum steps limit, ending session",
        reasoning: "Safety mechanism to prevent infinite loops",
        tool: "CLOSE" as const,
        instruction: "",
        stepNumber: stepCounter,
      };
      dataStream.write({ type: "data-agent_step", data: finalStep });
    }
}
