
"use client";

import { FC } from "react";

interface AgentFeedProps {
  initialMessage?: any;
  messages: any[];
  isLoading: boolean;
}

const AgentFeed: FC<AgentFeedProps> = ({
  initialMessage,
  messages,
  isLoading,
}) => {
  return (
    <div className="flex flex-col h-full bg-white shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Tasks</h2>
        {initialMessage && (
          <p className="text-sm text-gray-600 mt-1">
            {initialMessage?.parts?.[0]?.toString() || 'Loading...'}
          </p>
        )}
      </div>
      <div className="flex-grow overflow-y-auto p-4">
        <p className="text-gray-500">No tasks yet</p>
      </div>
    </div>
  );
};

export default AgentFeed;
