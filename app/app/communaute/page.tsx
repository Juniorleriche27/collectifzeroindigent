import {
  listConversationMessages,
  listConversations,
  listMembers,
} from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { CommunauteClient } from "./communaute-client";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return fallback;
}

export default async function CommunautePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = paramValue(params.q).trim();
  const conversationType = paramValue(params.conversation_type);
  const selectedConversationParam = paramValue(params.conversation);

  let loadError: string | null = null;
  let currentMemberId: string | null = null;
  let items: Awaited<ReturnType<typeof listConversations>>["items"] = [];
  let messages: Awaited<ReturnType<typeof listConversationMessages>>["items"] = [];
  let members: Awaited<ReturnType<typeof listMembers>>["rows"] = [];
  let selectedConversationId: string | null = null;

  if (isSupabaseConfigured) {
    try {
      const [conversationData, memberData] = await Promise.all([
        listConversations({
          conversation_type:
            conversationType === "community" || conversationType === "direct"
              ? conversationType
              : undefined,
          q: query || undefined,
        }),
        listMembers({ page: 1, page_size: 50 }),
      ]);

      currentMemberId = conversationData.current_member_id;
      items = conversationData.items;
      members = memberData.rows;

      if (selectedConversationParam && items.some((item) => item.id === selectedConversationParam)) {
        selectedConversationId = selectedConversationParam;
      } else {
        selectedConversationId = items[0]?.id ?? null;
      }

      if (selectedConversationId) {
        const messageData = await listConversationMessages(selectedConversationId, { limit: 80 });
        messages = messageData.items;
      }
    } catch (error) {
      console.error("Unable to load communaute data", error);
      loadError = loadError ?? toErrorMessage(error, "Impossible de charger les discussions.");
    }
  } else {
    loadError = "Supabase non configure.";
  }

  return (
    <CommunauteClient
      currentMemberId={currentMemberId}
      initialConversationType={conversationType}
      initialQuery={query}
      items={items}
      loadError={loadError}
      members={members}
      messages={messages}
      selectedConversationId={selectedConversationId}
    />
  );
}
