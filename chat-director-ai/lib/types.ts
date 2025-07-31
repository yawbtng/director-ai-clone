
import { type UIMessage } from 'ai/react';
import { type InferUITool, type LanguageModelV2 } from 'ai';
import { z } from 'zod';
import { getWeather } from './ai/tools/get-weather';
import { createDocument } from './ai/tools/create-document';
import { updateDocument } from './ai/tools/update-document';
import { requestSuggestions } from './ai/tools/request-suggestions';
import { Suggestion } from './db/schema';
import { ArtifactKind } from '@/components/artifact';
import { BrowserStep } from '@/types/agent';

export type DataPart = { type: 'append-message'; message: string };

const messageMetadataSchema = z.object({
  tools: z.array(z.string()).optional(),
});
export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  browser_session_started: {
    sessionId: string;
    sessionUrl: string;
  };
  agent_step: BrowserStep;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}
