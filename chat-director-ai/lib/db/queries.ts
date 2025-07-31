
import { and, desc, eq, gt, gte, lt } from 'drizzle-orm';

import type { ArtifactKind } from '@/components/artifact';

import {
  chat,
  document,
  message,
  suggestion,
  user,
  vote,
  stream,
  type DBMessage,
  type Suggestion,
  type User,
} from './schema';
import { db } from './config';
import type { VisibilityType } from '@/components/visibility-selector';

/*
 * USER
 */

export async function getUser(email: string): Promise<Array<User>> {
  const selectedUser = await db
    .select()
    .from(user)
    .where(eq(user.email, email));
  return selectedUser;
}

export async function createUser(email: string, password: string) {
  const newUser = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      email,
      password,
    })
    .returning();

  return newUser;
}

export async function createGuestUser() {
  const guestUser = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      email: `guest-${Math.random().toString(36).substring(2, 15)}`,
    })
    .returning();

  return guestUser;
}

/*
 * CHAT
 */

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  const newChat = await db
    .insert(chat)
    .values({
      id,
      userId,
      title,
      visibility,
      createdAt: new Date(),
    })
    .returning();
  return newChat;
}

export async function deleteChatById({ id }: { id: string }) {
  // First delete related records to avoid foreign key constraint violations
  await db.delete(vote).where(eq(vote.chatId, id));
  await db.delete(message).where(eq(message.chatId, id));
  await db.delete(stream).where(eq(stream.chatId, id));
  
  // Then delete the chat
  const deletedChat = await db.delete(chat).where(eq(chat.id, id)).returning();
  return deletedChat;
}

export async function updateChatContextId({
  chatId,
  contextId,
}: {
  chatId: string;
  contextId: string;
}) {
  await db
    .update(chat)
    .set({ browserbaseContextId: contextId })
    .where(eq(chat.id, chatId));
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
    const query = (whereCondition?: any) =>
      db
        .select()
        .from(chat)
        .where(and(eq(chat.userId, id), whereCondition))
        .orderBy(desc(chat.createdAt))
        .limit(limit);

    if (startingAfter) {
      const [cursorResult] = await db
        .select({ createdAt: chat.createdAt })
        .from(chat)
        .where(eq(chat.id, startingAfter));

      if (cursorResult) {
        const chats = await query(lt(chat.createdAt, cursorResult.createdAt));
        const hasMore = chats.length > 0;
        return { chats, hasMore };
      }
    }

    if (endingBefore) {
        const [cursorResult] = await db
          .select({ createdAt: chat.createdAt })
          .from(chat)
          .where(eq(chat.id, endingBefore));
  
        if (cursorResult) {
          const chats = await query(gt(chat.createdAt, cursorResult.createdAt));
          const hasMore = chats.length > 0;
          return { chats, hasMore };
        }
      }

    const chats = await query();
    const hasMore = chats.length === limit;

    return { chats, hasMore };
}

export async function getChatById({ id }: { id: string }) {
  const selectedChat = await db.select().from(chat).where(eq(chat.id, id));
  return selectedChat[0];
}

/*
 * MESSAGE
 */

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  const newMessages = await db.insert(message).values(messages).returning();
  return newMessages;
}

export async function getMessagesByChatId({ id }: { id: string }) {
  const selectedMessages = await db
    .select()
    .from(message)
    .where(eq(message.chatId, id))
    .orderBy(message.createdAt);
  return selectedMessages;
}

/*
 * VOTE
 */

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  const newVote = await db
    .insert(vote)
    .values({
      chatId,
      messageId,
      type,
    })
    .onConflictDoUpdate({
      target: [vote.chatId, vote.messageId],
      set: { type },
    })
    .returning();

  return newVote;
}

export async function getVotesByChatId({ id }: { id: string }) {
  const selectedVotes = await db
    .select()
    .from(vote)
    .where(eq(vote.chatId, id));
  return selectedVotes;
}

/*
 * DOCUMENT
 */

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  const newDocument = await db
    .insert(document)
    .values({
      id,
      title,
      kind,
      content,
      userId,
      version: 1, // Default to 1 on initial creation
    })
    .onConflictDoUpdate({
      target: [document.id, document.version],
      set: { content },
    })
    .returning();
  return newDocument;
}

export async function getDocumentsById({ id }: { id: string }) {
  const selectedDocuments = await db
    .select()
    .from(document)
    .where(eq(document.id, id))
    .orderBy(document.createdAt);
  return selectedDocuments;
}

export async function getDocumentById({ id }: { id: string }) {
  const selectedDocument = await db
    .select()
    .from(document)
    .where(eq(document.id, id))
    .orderBy(desc(document.createdAt))
    .limit(1);

  return selectedDocument[0];
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  const deletedDocuments = await db
    .delete(document)
    .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
    .returning();

  return deletedDocuments;
}

/*
 * SUGGESTIONS
 */

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  const newSuggestions = await db
    .insert(suggestion)
    .values(suggestions)
    .returning();
  return newSuggestions;
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  const selectedSuggestions = await db
    .select()
    .from(suggestion)
    .where(eq(suggestion.documentId, documentId));
  return selectedSuggestions;
}

/*
 * GENERAL
 */

export async function getMessageById({ id }: { id: string }) {
  const selectedMessage = await db
    .select()
    .from(message)
    .where(eq(message.id, id));
  return selectedMessage;
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  const messagesToDelete = await db
    .select({ id: message.id })
    .from(message)
    .where(
      and(eq(message.chatId, chatId), gt(message.createdAt, timestamp)),
    );

  const messageIds = messagesToDelete.map((msg) => msg.id);

  if (messageIds.length > 0) {
    await db.delete(vote).where(and(eq(vote.chatId, chatId)));
  }

  const deletedMessages = await db
    .delete(message)
    .where(and(eq(message.chatId, chatId), gt(message.createdAt, timestamp)))
    .returning();

  return deletedMessages;
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - differenceInHours);

  const messageCount = await db
    .select({ id: message.id })
    .from(message)
    .innerJoin(chat, eq(message.chatId, chat.id))
    .where(
      and(
        eq(chat.userId, id),
        eq(message.role, 'user'),
        gte(message.createdAt, twentyFourHoursAgo),
      ),
    );

  return messageCount.length;
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  await db.insert(stream).values({
    id: streamId,
    chatId,
    createdAt: new Date(),
  });
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  const streamIds = await db
    .select()
    .from(stream)
    .where(eq(stream.chatId, chatId));

  return streamIds.map((s) => s.id);
}
