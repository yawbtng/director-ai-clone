ALTER TABLE "Chat" DROP CONSTRAINT "Chat_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Document" DROP CONSTRAINT "Document_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Message_v2" DROP CONSTRAINT "Message_v2_chatId_Chat_id_fk";
--> statement-breakpoint
ALTER TABLE "Message" DROP CONSTRAINT "Message_chatId_Chat_id_fk";
--> statement-breakpoint
ALTER TABLE "Stream" DROP CONSTRAINT "Stream_chatId_Chat_id_fk";
--> statement-breakpoint
ALTER TABLE "Suggestion" DROP CONSTRAINT "Suggestion_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Suggestion" DROP CONSTRAINT "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_fk";
--> statement-breakpoint
ALTER TABLE "Vote_v2" DROP CONSTRAINT "Vote_v2_chatId_Chat_id_fk";
--> statement-breakpoint
ALTER TABLE "Vote_v2" DROP CONSTRAINT "Vote_v2_messageId_Message_v2_id_fk";
--> statement-breakpoint
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_messageId_Message_id_fk";
--> statement-breakpoint
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_chatId_Chat_id_fk";
--> statement-breakpoint
ALTER TABLE "Document" DROP CONSTRAINT "Document_id_createdAt_pk";--> statement-breakpoint
ALTER TABLE "Stream" DROP CONSTRAINT "Stream_id_pk";--> statement-breakpoint
ALTER TABLE "Suggestion" DROP CONSTRAINT "Suggestion_id_pk";--> statement-breakpoint
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_chatId_messageId_pk";--> statement-breakpoint
ALTER TABLE "Chat" ALTER COLUMN "id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "Chat" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Chat" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Chat" ALTER COLUMN "userId" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "Chat" ALTER COLUMN "visibility" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "Chat" ALTER COLUMN "visibility" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Document" ALTER COLUMN "id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "Document" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Document" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Document" ALTER COLUMN "content" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Document" ALTER COLUMN "userId" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "Message_v2" ALTER COLUMN "id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "Message_v2" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Message_v2" ALTER COLUMN "chatId" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "Message_v2" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "Message_v2" ALTER COLUMN "parts" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Message_v2" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Message" ALTER COLUMN "id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "Message" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Message" ALTER COLUMN "chatId" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "Message" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "Message" ALTER COLUMN "content" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "Message" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Stream" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "Stream" ALTER COLUMN "id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "Stream" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Stream" ALTER COLUMN "chatId" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "Suggestion" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "Suggestion" ALTER COLUMN "id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "Suggestion" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Suggestion" ALTER COLUMN "documentId" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "Suggestion" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "email" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "password" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "Vote_v2" ALTER COLUMN "chatId" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "Vote_v2" ALTER COLUMN "messageId" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "Vote" ALTER COLUMN "chatId" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "Vote" ALTER COLUMN "messageId" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "Document" ADD CONSTRAINT "Document_id_version_pk" PRIMARY KEY("id","version");--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "browserbaseContextId" text;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "version" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "kind" text NOT NULL;--> statement-breakpoint
ALTER TABLE "Suggestion" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "Suggestion" ADD COLUMN "from" text NOT NULL;--> statement-breakpoint
ALTER TABLE "Suggestion" ADD COLUMN "to" text NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "Vote_v2" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "Vote" ADD COLUMN "id" varchar(36) PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "Vote" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Message_v2" ADD CONSTRAINT "Message_v2_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Stream" ADD CONSTRAINT "Stream_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote_v2" ADD CONSTRAINT "Vote_v2_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote_v2" ADD CONSTRAINT "Vote_v2_messageId_Message_v2_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message_v2"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote" ADD CONSTRAINT "Vote_messageId_Message_v2_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message_v2"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote" ADD CONSTRAINT "Vote_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "userId_idx" ON "Chat" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_userId_idx" ON "Document" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_id_idx" ON "Document" USING btree ("id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chatId_idx" ON "Message_v2" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "createdAt_idx" ON "Message_v2" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stream_chatId_idx" ON "Stream" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "suggestion_documentId_idx" ON "Suggestion" USING btree ("documentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messageId_v2_idx" ON "Vote_v2" USING btree ("messageId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chatId_v2_idx" ON "Vote_v2" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messageId_idx" ON "Vote" USING btree ("messageId");--> statement-breakpoint
ALTER TABLE "Document" DROP COLUMN IF EXISTS "text";--> statement-breakpoint
ALTER TABLE "Message_v2" DROP COLUMN IF EXISTS "attachments";--> statement-breakpoint
ALTER TABLE "Stream" DROP COLUMN IF EXISTS "createdAt";--> statement-breakpoint
ALTER TABLE "Suggestion" DROP COLUMN IF EXISTS "documentCreatedAt";--> statement-breakpoint
ALTER TABLE "Suggestion" DROP COLUMN IF EXISTS "originalText";--> statement-breakpoint
ALTER TABLE "Suggestion" DROP COLUMN IF EXISTS "suggestedText";--> statement-breakpoint
ALTER TABLE "Suggestion" DROP COLUMN IF EXISTS "description";--> statement-breakpoint
ALTER TABLE "Suggestion" DROP COLUMN IF EXISTS "isResolved";--> statement-breakpoint
ALTER TABLE "Suggestion" DROP COLUMN IF EXISTS "userId";--> statement-breakpoint
ALTER TABLE "Vote_v2" DROP COLUMN IF EXISTS "isUpvoted";--> statement-breakpoint
ALTER TABLE "Vote" DROP COLUMN IF EXISTS "isUpvoted";--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_email_unique" UNIQUE("email");