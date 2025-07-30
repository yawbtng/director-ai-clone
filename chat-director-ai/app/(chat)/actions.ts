'use server';

import { type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  try {
    // For now, use a simple fallback to avoid AI SDK v5 API complexity
    const messageText = typeof message === 'string' ? message : JSON.stringify(message);
    const words = messageText.split(' ').slice(0, 5).join(' ');
    return words.length > 0 ? words : 'New Chat';
  } catch (error) {
    console.warn('Title generation failed, using fallback:', error);
    // Fallback: extract first few words from the message
    const messageText = typeof message === 'string' ? message : JSON.stringify(message);
    const words = messageText.split(' ').slice(0, 5).join(' ');
    return words.length > 0 ? words : 'New Chat';
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}
