"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  CommunityKind,
  ConversationItem,
  ConversationMessage,
  MemberRecord,
} from "@/lib/backend/api";

import { createConversationAction, postConversationMessageAction } from "./actions";
import type { ConversationActionState } from "./actions";

type CommunauteClientProps = {
  currentMemberId: string | null;
  initialConversationType: string;
  initialQuery: string;
  items: ConversationItem[];
  loadError: string | null;
  members: MemberRecord[];
  messages: ConversationMessage[];
  selectedConversationId: string | null;
};

const ROOT_COMMUNITY_ORDER: CommunityKind[] = ["czi", "engaged", "entrepreneur", "org_leader"];

const ROOT_COMMUNITY_LABELS: Record<CommunityKind, string> = {
  czi: "Communaute CZI",
  engaged: "Cellule des jeunes engages",
  entrepreneur: "Cellule des jeunes entrepreneurs",
  org_leader: "Cellule des responsables d'associations et mouvements de jeunes",
};

const ROOT_COMMUNITY_HINTS: Record<CommunityKind, string> = {
  czi: "Espace national CZI. Creation de sous-communaute interdite.",
  engaged: "Sous-communautes autorisees pour les membres de la cellule engages.",
  entrepreneur: "Sous-communautes autorisees pour les membres de la cellule entrepreneurs.",
  org_leader:
    "Sous-communautes autorisees pour les membres de la cellule responsables d'associations/mouvements.",
};

function isCommunityRoot(item: ConversationItem): boolean {
  return item.conversation_type === "community" && item.parent_conversation_id === null;
}

function isCommunityChild(item: ConversationItem): boolean {
  return item.conversation_type === "community" && item.parent_conversation_id !== null;
}

function conversationLabel(item: ConversationItem, currentMemberId: string | null): string {
  if (item.conversation_type === "community") {
    return item.title?.trim() || "Communaute";
  }

  const peers = item.participants
    .filter((participant) => participant.member_id !== currentMemberId)
    .map((participant) =>
      `${participant.member?.first_name ?? ""} ${participant.member?.last_name ?? ""}`.trim(),
    )
    .filter(Boolean);

  if (peers.length > 0) return peers.join(", ");
  return "Discussion privee";
}

function conversationContextText(
  item: ConversationItem,
  conversationById: Map<string, ConversationItem>,
): string {
  if (item.conversation_type === "direct") {
    return "Messagerie privee 1:1.";
  }

  if (item.parent_conversation_id === null) {
    const kind = item.community_kind ?? "czi";
    return ROOT_COMMUNITY_HINTS[kind];
  }

  const parent = conversationById.get(item.parent_conversation_id);
  const parentTitle =
    parent?.title?.trim() ||
    (parent?.community_kind ? ROOT_COMMUNITY_LABELS[parent.community_kind] : "Cellule");
  return `Sous-communaute de ${parentTitle}.`;
}

function messagePreview(item: ConversationItem): string {
  return item.latest_message?.body ?? "Aucun message pour le moment.";
}

export function CommunauteClient({
  currentMemberId,
  initialConversationType,
  initialQuery,
  items,
  loadError,
  members,
  messages,
  selectedConversationId,
}: CommunauteClientProps) {
  const initialState: ConversationActionState = { error: null, success: null };
  const [createState, createAction, createPending] = useActionState(
    createConversationAction,
    initialState,
  );
  const [messageState, messageAction, messagePending] = useActionState(
    postConversationMessageAction,
    initialState,
  );
  const [open, setOpen] = useState(false);
  const [createType, setCreateType] = useState<"community" | "direct">("community");

  const selectedConversation = items.find((item) => item.id === selectedConversationId) ?? null;
  const participantChoices = members.filter((member) => member.id !== currentMemberId);
  const conversationById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const rootCommunities = useMemo(() => {
    const map = new Map<CommunityKind, ConversationItem | null>();
    for (const kind of ROOT_COMMUNITY_ORDER) {
      const root =
        items.find((item) => isCommunityRoot(item) && item.community_kind === kind) ?? null;
      map.set(kind, root);
    }
    return map;
  }, [items]);

  const childrenByRootId = useMemo(() => {
    const map = new Map<string, ConversationItem[]>();
    for (const item of items) {
      if (!isCommunityChild(item) || !item.parent_conversation_id) continue;
      const current = map.get(item.parent_conversation_id) ?? [];
      current.push(item);
      map.set(item.parent_conversation_id, current);
    }

    for (const [rootId, rows] of map.entries()) {
      map.set(
        rootId,
        rows
          .slice()
          .sort((first, second) =>
            (first.title ?? "").localeCompare(second.title ?? "", "fr", { sensitivity: "base" }),
          ),
      );
    }

    return map;
  }, [items]);

  const directConversations = useMemo(
    () =>
      items
        .filter((item) => item.conversation_type === "direct")
        .slice()
        .sort((first, second) => {
          const firstDate = first.latest_message?.created_at ?? first.updated_at ?? first.created_at;
          const secondDate =
            second.latest_message?.created_at ?? second.updated_at ?? second.created_at;
          return secondDate.localeCompare(firstDate);
        }),
    [items],
  );

  const cellRootOptions = useMemo(
    () =>
      ROOT_COMMUNITY_ORDER.filter((kind) => kind !== "czi")
        .map((kind) => rootCommunities.get(kind))
        .filter((item): item is ConversationItem => Boolean(item)),
    [rootCommunities],
  );

  function openCreateDialog() {
    setCreateType("community");
    setOpen(true);
  }

  function conversationLink(conversationId: string): string {
    return `/app/communaute?q=${encodeURIComponent(initialQuery)}&conversation_type=${encodeURIComponent(initialConversationType)}&conversation=${conversationId}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Communaute CZI</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Discussions</h2>
          <CardDescription className="mt-2">
            4 communautes racines: CZI national + 3 cellules avec sous-communautes.
          </CardDescription>
        </div>
        <Button onClick={openCreateDialog}>Nouvelle discussion</Button>
      </div>

      <Card className="space-y-3">
        <CardTitle className="text-base">Recherche</CardTitle>
        <form className="grid gap-3 md:grid-cols-3" method="get">
          <Input defaultValue={initialQuery} name="q" placeholder="Titre de communaute..." />
          <Select defaultValue={initialConversationType} name="conversation_type">
            <option value="">Toutes discussions</option>
            <option value="community">Communaute</option>
            <option value="direct">Prive</option>
          </Select>
          <div className="flex gap-2">
            <Button type="submit" variant="secondary">
              Filtrer
            </Button>
            <Link href="/app/communaute">
              <Button type="button" variant="ghost">
                Reinitialiser
              </Button>
            </Link>
          </div>
        </form>
      </Card>

      {loadError ? (
        <Card>
          <CardDescription className="text-red-600">{loadError}</CardDescription>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <Card className="space-y-4">
            <CardTitle className="text-base">Communautes</CardTitle>
            <div className="space-y-4">
              {ROOT_COMMUNITY_ORDER.map((kind) => {
                const root = rootCommunities.get(kind) ?? null;
                const children = root ? childrenByRootId.get(root.id) ?? [] : [];

                return (
                  <div className="rounded-lg border border-border bg-surface p-3" key={kind}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{ROOT_COMMUNITY_LABELS[kind]}</p>
                      <Badge variant={kind === "czi" ? "default" : "success"}>
                        {kind === "czi" ? "national" : "cellule"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">{ROOT_COMMUNITY_HINTS[kind]}</p>

                    {!root ? (
                      <p className="mt-2 text-xs text-red-600">
                        Communaute racine non disponible (executer le script SQL cellule).
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <Link
                          className={cn(
                            "block rounded-md border border-border px-3 py-2 text-sm transition-colors",
                            root.id === selectedConversationId
                              ? "bg-primary/10 border-primary/30"
                              : "bg-muted-surface/50 hover:bg-muted-surface",
                          )}
                          href={conversationLink(root.id)}
                        >
                          {root.title?.trim() || ROOT_COMMUNITY_LABELS[kind]}
                        </Link>

                        {children.length > 0 ? (
                          children.map((child) => (
                            <Link
                              className={cn(
                                "ml-3 block rounded-md border border-border px-3 py-2 text-sm transition-colors",
                                child.id === selectedConversationId
                                  ? "bg-primary/10 border-primary/30"
                                  : "bg-surface hover:bg-muted-surface",
                              )}
                              href={conversationLink(child.id)}
                              key={child.id}
                            >
                              {child.title?.trim() || "Sous-communaute"}
                            </Link>
                          ))
                        ) : (
                          <p className="ml-3 text-xs text-muted">Aucune sous-communaute.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-sm font-semibold text-foreground">Discussions privees</p>
              <p className="mt-1 text-xs text-muted">Messagerie directe entre membres.</p>
              <div className="mt-3 space-y-2">
                {directConversations.length === 0 ? (
                  <p className="text-xs text-muted">Aucune discussion privee visible.</p>
                ) : (
                  directConversations.map((item) => (
                    <Link
                      className={cn(
                        "block rounded-md border border-border px-3 py-2 text-sm transition-colors",
                        item.id === selectedConversationId
                          ? "bg-primary/10 border-primary/30"
                          : "bg-muted-surface/50 hover:bg-muted-surface",
                      )}
                      href={conversationLink(item.id)}
                      key={item.id}
                    >
                      {conversationLabel(item, currentMemberId)}
                    </Link>
                  ))
                )}
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <CardTitle>
                {selectedConversation
                  ? conversationLabel(selectedConversation, currentMemberId)
                  : "Selectionnez une conversation"}
              </CardTitle>
              <CardDescription className="mt-1">
                {selectedConversation
                  ? conversationContextText(selectedConversation, conversationById)
                  : "Choisissez une communaute ou une discussion privee a gauche."}
              </CardDescription>
            </div>

            <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-lg border border-border bg-muted-surface/40 p-3">
              {!selectedConversation ? (
                <CardDescription>Aucune conversation selectionnee.</CardDescription>
              ) : messages.length === 0 ? (
                <CardDescription>Aucun message dans ce fil.</CardDescription>
              ) : (
                messages
                  .slice()
                  .reverse()
                  .map((message) => (
                    <div className="rounded-md border border-border bg-surface p-3" key={message.id}>
                      <p className="text-xs text-muted">
                        {`${message.sender?.first_name ?? ""} ${message.sender?.last_name ?? ""}`.trim()}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{message.body}</p>
                      <p className="mt-2 text-xs text-muted">
                        {new Date(message.created_at).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  ))
              )}
            </div>

            {selectedConversation ? (
              <form action={messageAction} className="space-y-3">
                <input name="conversation_id" type="hidden" value={selectedConversation.id} />
                <textarea
                  className="min-h-[96px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/20"
                  name="body"
                  placeholder="Ecrivez votre message..."
                  required
                />
                {messageState.error ? (
                  <p className="text-sm text-red-600">{messageState.error}</p>
                ) : null}
                {messageState.success ? (
                  <p className="text-sm text-emerald-700">{messageState.success}</p>
                ) : null}
                <Button disabled={messagePending} type="submit">
                  {messagePending ? "Envoi..." : "Envoyer"}
                </Button>
              </form>
            ) : null}

            {selectedConversation ? (
              <p className="text-xs text-muted">{messagePreview(selectedConversation)}</p>
            ) : null}
          </Card>
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle>Nouvelle discussion</CardTitle>
              <Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>
                Fermer
              </Button>
            </div>
            <form action={createAction} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="create-conversation-type">
                  Type
                </label>
                <Select
                  value={createType}
                  id="create-conversation-type"
                  name="conversation_type"
                  onChange={(event) =>
                    setCreateType(event.target.value === "direct" ? "direct" : "community")
                  }
                >
                  <option value="community">Sous-communaute de cellule</option>
                  <option value="direct">Message prive</option>
                </Select>
              </div>

              {createType === "community" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="create-community-parent">
                      Communaute de cellule
                    </label>
                    <Select
                      id="create-community-parent"
                      name="parent_conversation_id"
                      required
                      disabled={cellRootOptions.length === 0}
                    >
                      <option value="">Selectionner une communaute</option>
                      {cellRootOptions.map((root) => (
                        <option key={root.id} value={root.id}>
                          {root.title?.trim() ||
                            (root.community_kind
                              ? ROOT_COMMUNITY_LABELS[root.community_kind]
                              : "Communaute cellule")}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="create-community-title">
                      Titre de la sous-communaute
                    </label>
                    <Input
                      id="create-community-title"
                      name="title"
                      placeholder="Ex: Discussion locale cellule"
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <p className="rounded-md border border-border bg-muted-surface px-3 py-2 text-sm text-muted">
                      La Communaute CZI nationale n&apos;autorise pas la creation de sous-communautes.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium" htmlFor="create-direct-member">
                      Membre cible
                    </label>
                    <Select id="create-direct-member" name="participant_member_id" required>
                      <option value="">Selectionner un membre</option>
                      {participantChoices.map((member) => (
                        <option key={member.id} value={member.id}>
                          {`${member.first_name ?? ""} ${member.last_name ?? ""}`.trim() || member.id}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium" htmlFor="create-direct-title">
                      Sujet (optionnel)
                    </label>
                    <Input id="create-direct-title" name="title" placeholder="Sujet de discussion" />
                  </div>
                </>
              )}
              {createState.error ? (
                <p className="text-sm text-red-600 md:col-span-2">{createState.error}</p>
              ) : null}
              {createState.success ? (
                <p className="text-sm text-emerald-700 md:col-span-2">{createState.success}</p>
              ) : null}
              <div className="md:col-span-2">
                <Button
                  disabled={createPending || (createType === "community" && cellRootOptions.length === 0)}
                  type="submit"
                >
                  {createPending ? "Creation..." : "Creer la discussion"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
