
export type BrowserStep = {
    text: string;
    reasoning: string;
    tool: "GOTO" | "ACT" | "EXTRACT" | "OBSERVE" | "CLOSE" | "WAIT" | "NAVBACK";
    instruction: string;
    stepNumber?: number;
  };
  