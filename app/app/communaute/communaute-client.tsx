"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { Heart, MessageCircleReply, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CommunityKind, ConversationItem, ConversationMessage, MemberRecord } from "@/lib/backend/api";

import {
  createConversationAction,
  deleteConversationAction,
  deleteConversationMessageAction,
  editConversationMessageAction,
  postConversationMessageAction,
  toggleConversationMessageLikeAction,
} from "./actions";
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

const ROOT_ORDER: CommunityKind[] = ["czi", "engaged", "entrepreneur", "org_leader"];
const ROOT_LABEL: Record<CommunityKind, string> = {
  czi: "Communaute CZI",
  engaged: "Cellule des jeunes engages",
  entrepreneur: "Cellule des jeunes entrepreneurs",
  org_leader: "Cellule des responsables d'associations et mouvements de jeunes",
};

function isRoot(item: ConversationItem) {
  return item.conversation_type === "community" && item.parent_conversation_id === null;
}
function memberName(member: MemberRecord | ConversationMessage["sender"] | null) {
  if (!member) return "Membre";
  return `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim() || member.email || "Membre";
}
function conversationLabel(item: ConversationItem, currentMemberId: string | null) {
  if (item.conversation_type === "community") return item.title?.trim() || "Communaute";
  const peers = item.participants
    .filter((p) => p.member_id !== currentMemberId)
    .map((p) => `${p.member?.first_name ?? ""} ${p.member?.last_name ?? ""}`.trim())
    .filter(Boolean);
  return peers[0] || "Discussion privee";
}
function mentionQuery(text: string) {
  const m = text.match(/(?:^|\s)@([a-zA-Z0-9._-]{1,30})$/);
  return m ? m[1].toLowerCase() : "";
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
  const baseState: ConversationActionState = { error: null, success: null };
  const [createState, createAction, createPending] = useActionState(createConversationAction, baseState);
  const [deleteConversationState, deleteConversationFormAction, deleteConversationPending] = useActionState(deleteConversationAction, baseState);
  const [deleteMessageState, deleteMessageAction, deleteMessagePending] = useActionState(deleteConversationMessageAction, baseState);
  const [postState, postAction, postPending] = useActionState(postConversationMessageAction, baseState);
  const [editState, editAction, editPending] = useActionState(editConversationMessageAction, baseState);

  const [open, setOpen] = useState(false);
  const [createType, setCreateType] = useState<"community" | "direct">("community");
  const [body, setBody] = useState("");
  const [mentionIds, setMentionIds] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [editingMentions, setEditingMentions] = useState<string[]>([]);

  const selectedConversation = items.find((item) => item.id === selectedConversationId) ?? null;
  const msgById = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  const rootByKind = useMemo(() => {
    const map = new Map<CommunityKind, ConversationItem | null>();
    ROOT_ORDER.forEach((kind) => {
      map.set(kind, items.find((i) => isRoot(i) && i.community_kind === kind) ?? null);
    });
    return map;
  }, [items]);

  const childrenByRoot = useMemo(() => {
    const map = new Map<string, ConversationItem[]>();
    items.forEach((item) => {
      if (item.conversation_type !== "community" || !item.parent_conversation_id) return;
      const list = map.get(item.parent_conversation_id) ?? [];
      list.push(item);
      map.set(item.parent_conversation_id, list);
    });
    return map;
  }, [items]);

  const directList = useMemo(() => items.filter((i) => i.conversation_type === "direct"), [items]);
  const cellRootOptions = useMemo(
    () =>
      ROOT_ORDER.filter((kind) => kind !== "czi")
        .map((kind) => rootByKind.get(kind))
        .filter((item): item is ConversationItem => Boolean(item)),
    [rootByKind],
  );

  const sortedMessages = useMemo(
    () => messages.slice().sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [messages],
  );
  const messageChildren = useMemo(() => {
    const map = new Map<string, ConversationMessage[]>();
    sortedMessages.forEach((m) => {
      if (!m.parent_message_id) return;
      const list = map.get(m.parent_message_id) ?? [];
      list.push(m);
      map.set(m.parent_message_id, list);
    });
    return map;
  }, [sortedMessages]);
  const rootMessages = useMemo(() => sortedMessages.filter((m) => !m.parent_message_id), [sortedMessages]);

  const query = mentionQuery(body);
  const mentionSuggestions = useMemo(() => {
    if (!query) return [];
    return members
      .filter((m) => !mentionIds.includes(m.id))
      .map((m) => ({ id: m.id, label: memberName(m), search: `${memberName(m)} ${m.email ?? ""}`.toLowerCase() }))
      .filter((m) => m.search.includes(query))
      .slice(0, 6);
  }, [members, mentionIds, query]);

  useEffect(() => {
    if (!postState.success) return;
    const timer = window.setTimeout(() => {
      setBody("");
      setMentionIds([]);
      setReplyTo(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [postState.success]);

  useEffect(() => {
    if (!editState.success) return;
    const timer = window.setTimeout(() => {
      setEditingId(null);
      setEditingBody("");
      setEditingMentions([]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [editState.success]);

  function link(id: string) {
    return `/app/communaute?q=${encodeURIComponent(initialQuery)}&conversation_type=${encodeURIComponent(initialConversationType)}&conversation=${id}`;
  }

  function addMention(id: string, label: string) {
    setBody((prev) => prev.replace(/(?:^|\s)@([a-zA-Z0-9._-]{0,30})$/, ` @${label.replace(/\s+/g, "_")} `));
    setMentionIds((prev) => Array.from(new Set([...prev, id])));
  }

  function renderNode(message: ConversationMessage, depth = 0): React.ReactNode {
    const own = message.sender_member_id === currentMemberId;
    const children = messageChildren.get(message.id) ?? [];
    const editing = editingId === message.id;
    return (
      <div className={cn("space-y-2", depth > 0 && "ml-6")} key={message.id}>
        <div className={cn("max-w-[92%] rounded-xl border p-3", own ? "ml-auto border-primary/30 bg-primary/10" : "mr-auto bg-surface")}>
          <div className="flex items-center justify-between gap-2 text-xs text-muted">
            <span className="font-semibold">{memberName(message.sender ?? null)}</span>
            <span>{new Date(message.created_at).toLocaleString("fr-FR")}</span>
          </div>
          {editing ? (
            <form action={editAction} className="mt-2 space-y-2">
              <input name="conversation_id" type="hidden" value={selectedConversation?.id ?? ""} />
              <input name="message_id" type="hidden" value={message.id} />
              <input name="mention_member_ids" type="hidden" value={editingMentions.join(",")} />
              <textarea className="min-h-[90px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm" name="body" onChange={(e) => setEditingBody(e.target.value)} required value={editingBody} />
              <div className="flex gap-2">
                <Button disabled={editPending} size="sm" type="submit">{editPending ? "Sauvegarde..." : "Sauvegarder"}</Button>
                <Button onClick={() => setEditingId(null)} size="sm" type="button" variant="ghost">Annuler</Button>
              </div>
            </form>
          ) : (
            <p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button onClick={() => setReplyTo(message.id)} size="sm" type="button" variant="ghost"><MessageCircleReply size={14} />Repondre</Button>
            <form action={toggleConversationMessageLikeAction}>
              <input name="conversation_id" type="hidden" value={selectedConversation?.id ?? ""} />
              <input name="message_id" type="hidden" value={message.id} />
              <Button size="sm" type="submit" variant={message.liked_by_me ? "secondary" : "ghost"}>
                <Heart className={cn(message.liked_by_me && "fill-current text-red-500")} size={14} />
                {message.like_count}
              </Button>
            </form>
            {own ? (
              <Button onClick={() => { setEditingId(message.id); setEditingBody(message.body); setEditingMentions(message.mention_member_ids ?? []); }} size="sm" type="button" variant="ghost"><Pencil size={14} />Modifier</Button>
            ) : null}
            {message.can_delete ? (
              <form action={deleteMessageAction} onSubmit={(event) => {
                if (!window.confirm("Supprimer ce message ? Cette action est definitive.")) {
                  event.preventDefault();
                }
              }}>
                <input name="conversation_id" type="hidden" value={selectedConversation?.id ?? ""} />
                <input name="message_id" type="hidden" value={message.id} />
                <Button disabled={deleteMessagePending} size="sm" type="submit" variant="danger">
                  <Trash2 size={14} />
                  Supprimer
                </Button>
              </form>
            ) : null}
            {message.edited_at ? <Badge variant="default">modifie</Badge> : null}
          </div>
        </div>
        {children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Communaute CZI</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Discussions</h2>
          <CardDescription className="mt-2">Espace discussion style reseau social: reponses, likes, edition, tags.</CardDescription>
        </div>
        <Button onClick={() => setOpen(true)}>Nouvelle discussion</Button>
      </div>

      <Card className="space-y-3">
        <CardTitle className="text-base">Recherche</CardTitle>
        <form className="grid gap-3 md:grid-cols-3" method="get">
          <Input defaultValue={initialQuery} name="q" placeholder="Titre de communaute..." />
          <Select defaultValue={initialConversationType} name="conversation_type">
            <option value="">Toutes discussions</option><option value="community">Communaute</option><option value="direct">Prive</option>
          </Select>
          <div className="flex gap-2"><Button type="submit" variant="secondary">Filtrer</Button><Link href="/app/communaute"><Button type="button" variant="ghost">Reinitialiser</Button></Link></div>
        </form>
      </Card>

      {loadError ? <Card><CardDescription className="text-red-600">{loadError}</CardDescription></Card> : (
        <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
          <Card className="space-y-4 bg-gradient-to-b from-surface to-surface/80">
            <CardTitle className="text-base">Communautes</CardTitle>
            <div className="space-y-4">
              {ROOT_ORDER.map((kind) => {
                const root = rootByKind.get(kind); const children = root ? childrenByRoot.get(root.id) ?? [] : [];
                return (
                  <div className="rounded-xl border border-border/80 bg-background/70 p-3" key={kind}>
                    <div className="flex items-center justify-between"><p className="text-sm font-semibold">{ROOT_LABEL[kind]}</p><Badge variant={kind === "czi" ? "default" : "success"}>{kind === "czi" ? "national" : "cellule"}</Badge></div>
                    {!root ? <p className="mt-2 text-xs text-red-600">Communaute racine non disponible.</p> : <div className="mt-2 space-y-2">
                      <Link className={cn("block rounded-md border px-3 py-2 text-sm", root.id === selectedConversationId ? "border-primary/30 bg-primary/10" : "border-border bg-muted-surface/50")} href={link(root.id)}>{root.title?.trim() || ROOT_LABEL[kind]}</Link>
                      {children.map((child) => <Link className={cn("ml-3 block rounded-md border px-3 py-2 text-sm", child.id === selectedConversationId ? "border-primary/30 bg-primary/10" : "border-border bg-surface")} href={link(child.id)} key={child.id}>{child.title?.trim() || "Sous-communaute"}</Link>)}
                    </div>}
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl border border-border bg-background/70 p-3">
              <p className="text-sm font-semibold">Discussions privees</p>
              <div className="mt-2 space-y-2">
                {directList.map((item) => {
                  const unreadCount = item.id === selectedConversationId ? 0 : item.unread_count;
                  return (
                    <Link className={cn("block rounded-md border px-3 py-2 text-sm", item.id === selectedConversationId ? "border-primary/30 bg-primary/10" : "border-border bg-muted-surface/50")} href={link(item.id)} key={item.id}>
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate">{conversationLabel(item, currentMemberId)}</span>
                        {unreadCount > 0 ? <Badge variant="warning">{unreadCount}</Badge> : null}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{selectedConversation ? conversationLabel(selectedConversation, currentMemberId) : "Selectionnez une conversation"}</CardTitle>
                <CardDescription className="mt-1">{selectedConversation ? "Fil social de la conversation." : "Choisissez une communaute ou discussion privee."}</CardDescription>
              </div>
              {selectedConversation?.can_delete ? (
                <form action={deleteConversationFormAction} onSubmit={(event) => {
                  if (!window.confirm("Supprimer cette sous-communaute ? Cette action est definitive.")) {
                    event.preventDefault();
                  }
                }}>
                  <input name="conversation_id" type="hidden" value={selectedConversation.id} />
                  <Button disabled={deleteConversationPending} size="sm" type="submit" variant="danger">
                    <Trash2 size={14} />
                    Supprimer la sous-communaute
                  </Button>
                </form>
              ) : null}
            </div>
            <div className="max-h-[460px] space-y-3 overflow-y-auto rounded-xl border border-border bg-background/60 p-3">
              {!selectedConversation ? <CardDescription>Aucune conversation selectionnee.</CardDescription> : rootMessages.length === 0 ? <CardDescription>Aucun message.</CardDescription> : rootMessages.map((m) => renderNode(m))}
            </div>
            {selectedConversation ? (
              <form action={postAction} className="space-y-3 rounded-xl border border-border bg-background/60 p-3">
                <input name="conversation_id" type="hidden" value={selectedConversation.id} />
                <input name="parent_message_id" type="hidden" value={replyTo ?? ""} />
                <input name="mention_member_ids" type="hidden" value={mentionIds.join(",")} />
                {replyTo ? <div className="flex items-center justify-between rounded-md border border-border bg-muted-surface px-3 py-2"><p className="text-xs">Reponse a {memberName(msgById.get(replyTo)?.sender ?? null)}</p><Button onClick={() => setReplyTo(null)} size="sm" type="button" variant="ghost">Annuler</Button></div> : null}
                <textarea className="min-h-[108px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" name="body" onChange={(e) => setBody(e.target.value)} placeholder="Ecrivez votre message... Utilisez @ pour taguer un membre." required value={body} />
                {mentionSuggestions.length > 0 ? <div className="rounded-md border border-border bg-surface p-2"><p className="mb-1 text-xs font-semibold text-muted">Tags</p><div className="flex flex-wrap gap-2">{mentionSuggestions.map((s) => <button className="rounded-full border border-border px-2 py-1 text-xs hover:border-primary" key={s.id} onClick={(e) => { e.preventDefault(); addMention(s.id, s.label); }} type="button">@{s.label}</button>)}</div></div> : null}
                {postState.error ? <p className="text-sm text-red-600">{postState.error}</p> : null}
                {postState.success ? <p className="text-sm text-emerald-700">{postState.success}</p> : null}
                {editState.error ? <p className="text-sm text-red-600">{editState.error}</p> : null}
                {editState.success ? <p className="text-sm text-emerald-700">{editState.success}</p> : null}
                {deleteMessageState.error ? <p className="text-sm text-red-600">{deleteMessageState.error}</p> : null}
                {deleteMessageState.success ? <p className="text-sm text-emerald-700">{deleteMessageState.success}</p> : null}
                {deleteConversationState.error ? <p className="text-sm text-red-600">{deleteConversationState.error}</p> : null}
                {deleteConversationState.success ? <p className="text-sm text-emerald-700">{deleteConversationState.success}</p> : null}
                <Button disabled={postPending} type="submit">{postPending ? "Envoi..." : replyTo ? "Repondre" : "Publier"}</Button>
              </form>
            ) : null}
          </Card>
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-2xl space-y-4">
            <div className="flex items-center justify-between"><CardTitle>Nouvelle discussion</CardTitle><Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>Fermer</Button></div>
            <form action={createAction} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><label className="text-sm font-medium" htmlFor="create-conversation-type">Type</label><Select value={createType} id="create-conversation-type" name="conversation_type" onChange={(e) => setCreateType(e.target.value === "direct" ? "direct" : "community")}><option value="community">Sous-communaute de cellule</option><option value="direct">Message prive</option></Select></div>
              {createType === "community" ? (<><div className="space-y-2"><label className="text-sm font-medium" htmlFor="create-community-parent">Communaute de cellule</label><Select id="create-community-parent" name="parent_conversation_id" required disabled={cellRootOptions.length === 0}><option value="">Selectionner une communaute</option>{cellRootOptions.map((root) => <option key={root.id} value={root.id}>{root.title?.trim() || (root.community_kind ? ROOT_LABEL[root.community_kind] : "Communaute cellule")}</option>)}</Select></div><div className="space-y-2"><label className="text-sm font-medium" htmlFor="create-community-title">Titre de la sous-communaute</label><Input id="create-community-title" name="title" placeholder="Ex: Discussion locale cellule" required /></div></>) : (<><div className="space-y-2 md:col-span-2"><label className="text-sm font-medium" htmlFor="create-direct-member">Membre cible</label><Select id="create-direct-member" name="participant_member_id" required><option value="">Selectionner un membre</option>{members.filter((m) => m.id !== currentMemberId).map((m) => <option key={m.id} value={m.id}>{memberName(m)}</option>)}</Select></div><div className="space-y-2 md:col-span-2"><label className="text-sm font-medium" htmlFor="create-direct-title">Sujet (optionnel)</label><Input id="create-direct-title" name="title" placeholder="Sujet de discussion" /></div></>)}
              {createState.error ? <p className="text-sm text-red-600 md:col-span-2">{createState.error}</p> : null}
              {createState.success ? <p className="text-sm text-emerald-700 md:col-span-2">{createState.success}</p> : null}
              <div className="md:col-span-2"><Button disabled={createPending || (createType === "community" && cellRootOptions.length === 0)} type="submit">{createPending ? "Creation..." : "Creer la discussion"}</Button></div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
