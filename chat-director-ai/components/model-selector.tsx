'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { chatModels } from '@/lib/ai/models';
import { Button } from './ui/button';
import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { useOptimistic } from 'react';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import type { Session } from 'next-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ChevronDownIcon } from './icons';

export function ModelSelector({
  session,
  selectedModelId,
  className,
}: {
  session: Session;
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [optimisticModel, setOptimisticModel] = useOptimistic(selectedModelId);

  const userType = session?.user?.type || 'guest';
  const { availableChatModelIds } = entitlementsByUserType[userType];

  const availableChatModels = chatModels.filter((chatModel) =>
    availableChatModelIds.includes(chatModel.id),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full md:w-auto flex flex-row gap-2"
        >
          <span>
            {
              chatModels.find((chatModel) => chatModel.id === optimisticModel)
                ?.name
            }
          </span>
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup
          value={optimisticModel}
          onValueChange={async (value) => {
            setOptimisticModel(value);
            await saveChatModelAsCookie(value);
          }}
        >
          {availableChatModels.map((chatModel) => (
            <DropdownMenuRadioItem
              key={chatModel.id}
              value={chatModel.id}
              className="cursor-pointer"
            >
              {chatModel.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
