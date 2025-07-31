
import {
    createUIMessageStream,
    JsonToSseTransformStream,
  } from 'ai';
  import { auth, type UserType } from '@/app/(auth)/auth';
  import {
    createStreamId,
    deleteChatById,
    getChatById,
    getMessageCountByUserId,
    getMessagesByChatId,
    saveChat,
    saveMessages,
    updateChatContextId,
  } from '@/lib/db/queries';
  import { convertToUIMessages, generateUUID } from '@/lib/utils';
  import { generateTitleFromUserMessage } from '../../actions';
  import { entitlementsByUserType } from '@/lib/ai/entitlements';
  import { postRequestBodySchema, type PostRequestBody } from './schema';
  import { ChatSDKError } from '@/lib/errors';
  import type { ChatMessage } from '@/lib/types';
  import type { ChatModel } from '@/lib/ai/models';
  import type { VisibilityType } from '@/components/visibility-selector';
  import { createBrowserbaseSession, endBrowserbaseSession, getBrowserbaseDebugUrl, createBrowserbaseContext } from '@/modules/browser/session';
  import { runAgentLoop } from '@/modules/execution/agent';
  
  export const maxDuration = 60;
  
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
  
      let chat = await getChatById({ id });
  
      if (!chat) {
        const title = await generateTitleFromUserMessage({
          message,
        });
  
        [chat] = await saveChat({
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
            let contextId = chat.browserbaseContextId;

            if (!contextId) {
                const newContext = await createBrowserbaseContext();
                contextId = newContext.id;
                await updateChatContextId({ chatId: id, contextId });
            }

            const browserSession = await createBrowserbaseSession(contextId);
            const sessionUrl = await getBrowserbaseDebugUrl(browserSession.id);
            
            dataStream.write({ type: 'data-browser_session_started', data: { sessionId: browserSession.id, sessionUrl } });
            
            const goal = message.parts.find(part => part.type === 'text')?.text || '';
            await runAgentLoop({ goal, sessionId: browserSession.id, dataStream });
            
            await endBrowserbaseSession(browserSession.id);
        },
        generateId: generateUUID,
      });
  
      return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
    } catch (error) {
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
  