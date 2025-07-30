import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import type { ChatModel } from '@/lib/ai/models';
import type { VisibilityType } from '@/components/visibility-selector';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  // Disable resumable streams for now to avoid Redis dependency
  return null;
  
  // Original code (commented out):
  // if (!globalStreamContext) {
  //   try {
  //     globalStreamContext = createResumableStreamContext({
  //       waitUntil: after,
  //     });
  //   } catch (error: any) {
  //     if (error.message.includes('REDIS_URL')) {
  //       console.log(
  //         ' > Resumable streams are disabled due to missing REDIS_URL',
  //       );
  //     } else {
  //       console.error(error);
  //     }
  //   }
  // }
  // return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel['id'];
      selectedVisibilityType: VisibilityType;
    } = requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        try {
          // For now, use a simple approach to get the AI working
          // We'll implement proper AI SDK v5 streaming later
          const textId = generateUUID();
          
          // Start the text block
          dataStream.write({ 
            type: 'text-start', 
            id: textId 
          });

          // Generate a response using the Google AI SDK directly
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          
          // Convert messages to a simple prompt
          const systemContent = systemPrompt({ selectedChatModel, requestHints });
          const userMessages = uiMessages.filter(msg => msg.role === 'user').map(msg => {
            // Handle UIMessage structure - extract text from parts
            if (msg.parts && Array.isArray(msg.parts)) {
              return msg.parts.map(part => 
                typeof part === 'string' ? part : JSON.stringify(part)
              ).join(' ');
            } else {
              return JSON.stringify(msg);
            }
          }).join('\n');
          
          const prompt = `${systemContent}\n\nUser: ${userMessages}\n\nAssistant:`;
          
          const result = await model.generateContent(prompt);
          const response = result.response.text();
          
          // Write the response as a single delta
          dataStream.write({ 
            type: 'text-delta', 
            delta: response, 
            id: textId 
          });
          
          // End the text block
          dataStream.write({ 
            type: 'text-end', 
            id: textId 
          });
          
        } catch (error) {
          console.error('Chat generation error:', error);
          const errorId = generateUUID();
          dataStream.write({ 
            type: 'text-start', 
            id: errorId 
          });
          dataStream.write({ 
            type: 'text-delta', 
            delta: 'I apologize, but I encountered an error. Please try again.', 
            id: errorId 
          });
          dataStream.write({ 
            type: 'text-end', 
            id: errorId 
          });
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        try {
          await saveMessages({
            messages: messages.map((message) => ({
              id: message.id,
              role: message.role,
              parts: message.parts || [],
              createdAt: new Date(),
              chatId: id,
              attachments: [],
            })),
          });
        } catch (error) {
          console.error('Failed to save messages:', error);
        }
      },
    });

    const streamContext = getStreamContext();

    // Always use the non-resumable stream for now
    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    
    console.error('Unexpected error in chat route:', error);
    return new ChatSDKError('bad_request:api').toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
