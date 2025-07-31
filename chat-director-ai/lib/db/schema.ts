
import {
    pgTable,
    text,
    timestamp,
    varchar,
    index,
    primaryKey,
    AnyPgColumn,
    integer,
    json,
  } from 'drizzle-orm/pg-core';
  import { relations, InferSelectModel } from 'drizzle-orm';
  
  export const user = pgTable('User', {
    id: varchar('id', { length: 36 }).primaryKey(),
    email: text('email').unique().notNull(),
    password: text('password'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  });
  
  export type User = InferSelectModel<typeof user>;
  
  export const chat = pgTable(
    'Chat',
    {
      id: varchar('id', { length: 36 }).primaryKey(),
      userId: varchar('userId', { length: 36 })
        .references(() => user.id, { onDelete: 'cascade' })
        .notNull(),
      title: text('title').notNull(),
      visibility: text('visibility').default('private'),
      createdAt: timestamp('createdAt').defaultNow().notNull(),
      browserbaseContextId: text('browserbaseContextId'),
    },
    (table) => {
      return {
        userIdx: index('userId_idx').on(table.userId),
      };
    },
  );
  
  export type Chat = InferSelectModel<typeof chat>;
  
  export const messageDeprecated = pgTable('Message', {
    id: varchar('id', { length: 36 }).primaryKey(),
    chatId: varchar('chatId', { length: 36 })
      .references(() => chat.id, { onDelete: 'cascade' })
      .notNull(),
    role: text('role').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  });
  
  export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;
  
  export const message = pgTable(
    'Message_v2',
    {
      id: varchar('id', { length: 36 }).primaryKey(),
      chatId: varchar('chatId', { length: 36 })
        .references(() => chat.id, { onDelete: 'cascade' })
        .notNull(),
      role: text('role').notNull(),
      parts: json('parts'),
      attachments: json('attachments').notNull().default('[]'),
      createdAt: timestamp('createdAt').defaultNow().notNull(),
    },
    (table) => {
      return {
        chatId_idx: index('chatId_idx').on(table.chatId),
        createdAt_idx: index('createdAt_idx').on(table.createdAt),
      };
    },
  );
  
  export type DBMessage = InferSelectModel<typeof message>;
  
  export const voteDeprecated = pgTable(
    'Vote',
    {
      id: varchar('id', { length: 36 }).primaryKey(),
      chatId: varchar('chatId', { length: 36 })
        .references(() => chat.id, { onDelete: 'cascade' })
        .notNull(),
      messageId: varchar('messageId', { length: 36 })
        .references(() => message.id, { onDelete: 'cascade' })
        .notNull(),
      type: text('type').notNull(),
    },
    (table) => {
      return {
        messageId_idx: index('messageId_idx').on(table.messageId),
      };
    },
  );
  
  export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;
  
  export const vote = pgTable(
    'Vote_v2',
    {
      chatId: varchar('chatId', { length: 36 })
        .references(() => chat.id, { onDelete: 'cascade' })
        .notNull(),
      messageId: varchar('messageId', { length: 36 })
        .references(() => message.id, { onDelete: 'cascade' })
        .notNull(),
      type: text('type', { enum: ['up', 'down'] }).notNull(),
    },
    (table) => {
      return {
        pk: primaryKey({ columns: [table.chatId, table.messageId] }),
        messageId_idx: index('messageId_v2_idx').on(table.messageId),
        chatId_idx: index('chatId_v2_idx').on(table.chatId),
      };
    },
  );
  
  export type Vote = InferSelectModel<typeof vote>;
  
  export const document = pgTable(
    'Document',
    {
      id: varchar('id', { length: 36 }).notNull(),
      version: integer('version').notNull(),
      title: text('title').notNull(),
      kind: text('kind').notNull(),
      content: text('content').notNull(),
      userId: varchar('userId', { length: 36 })
        .references(() => user.id, { onDelete: 'cascade' })
        .notNull(),
      createdAt: timestamp('createdAt').defaultNow().notNull(),
    },
    (table) => {
      return {
        pk: primaryKey({ columns: [table.id, table.version] }),
        userId_idx: index('document_userId_idx').on(table.userId),
        id_idx: index('document_id_idx').on(table.id),
      };
    },
  );
  
  export type Document = InferSelectModel<typeof document>;
  
  export const suggestion = pgTable(
    'Suggestion',
    {
      id: varchar('id', { length: 36 }).primaryKey(),
      documentId: varchar('documentId', { length: 36 }).notNull(),
      title: text('title').notNull(),
      from: text('from').notNull(),
      to: text('to').notNull(),
      createdAt: timestamp('createdAt').defaultNow().notNull(),
    },
    (table) => {
      return {
        documentId_idx: index('suggestion_documentId_idx').on(table.documentId),
      };
    },
  );
  
  export type Suggestion = InferSelectModel<typeof suggestion>;
  
  export const stream = pgTable(
    'Stream',
    {
      id: varchar('id', { length: 36 }).primaryKey(),
      chatId: varchar('chatId', { length: 36 })
        .references(() => chat.id, { onDelete: 'cascade' })
        .notNull(),
      createdAt: timestamp('createdAt').defaultNow().notNull(),
    },
    (table) => {
      return {
        chatId_idx: index('stream_chatId_idx').on(table.chatId),
      };
    },
  );
  
  export type Stream = InferSelectModel<typeof stream>;
  