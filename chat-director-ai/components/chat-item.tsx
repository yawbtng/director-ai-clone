import type { Chat } from '@/lib/db/schema';
import { SidebarMenuButton } from './ui/sidebar';
import Link from 'next/link';

export function ChatItem({ chat }: { chat: Chat }) {
  return (
    <SidebarMenuButton asChild>
      <Link href={`/chat/${chat.id}`}>
        <span className="truncate">{chat.title}</span>
      </Link>
    </SidebarMenuButton>
  );
}
