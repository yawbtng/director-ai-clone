
'use client';

import { useState } from 'react';
import AgentFeed from '@/components/agent-feed';
import BrowserLoading from '@/components/browser-loading';
import { useSearchParams, useParams } from 'next/navigation';

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const sessionId = searchParams.get('sessionId');
  const sessionUrl = searchParams.get('sessionUrl');
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  
  // Get the chat ID from the URL params
  const chatId = params?.id as string;

  if (!sessionId || !sessionUrl || !chatId) {
    return <div>Loading session...</div>;
  }

  // Use empty arrays to avoid any potential issues
  const messages: any[] = [];
  const isLoading = false;
  const initialMessage = undefined;

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-1/3 border-r overflow-y-auto">
        <AgentFeed
          messages={messages}
          isLoading={isLoading}
          initialMessage={initialMessage}
        />
      </div>
      <div className="w-2/3 relative">
        {isIframeLoading && <BrowserLoading />}
        <iframe 
          src={sessionUrl} 
          className="w-full h-full border-0"
          onLoad={() => setIsIframeLoading(false)} 
        />
      </div>
    </div>
  );
}
