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
  CommuneOption,
  ConversationItem,
  ConversationMessage,
  MemberRecord,
  PrefectureOption,
  RegionOption,
  ScopeLevel,
} from "@/lib/backend/api";

import { createConversationAction, postConversationMessageAction } from "./actions";
import type { ConversationActionState } from "./actions";

type CommunauteClientProps = {
  communes: CommuneOption[];
  currentMemberId: string | null;
  initialConversationType: string;
  initialQuery: string;
  items: ConversationItem[];
  loadError: string | null;
  members: MemberRecord[];
  messages: ConversationMessage[];
  prefectures: PrefectureOption[];
  regions: RegionOption[];
  selectedConversationId: string | null;
};

function conversationLabel(item: ConversationItem, currentMemberId: string | null): string {
  if (item.title) return item.title;
  if (item.conversation_type === "community") return "Canal communaute";

  const peers = item.participants
    .filter((participant) => participant.member_id !== currentMemberId)
    .map((participant) =>
      `${participant.member?.first_name ?? ""} ${participant.member?.last_name ?? ""}`.trim(),
    )
    .filter(Boolean);

  if (peers.length > 0) return peers.join(", ");
  return "Discussion privee";
}

function scopeText(
  item: ConversationItem,
  maps: {
    communes: Map<string, string>;
    prefectures: Map<string, string>;
    regions: Map<string, string>;
  },
) {
  if (item.scope_type === "all") return "National";
  if (item.scope_type === "region") return `Region ${maps.regions.get(String(item.region_id)) ?? "-"}`;
  if (item.scope_type === "prefecture") {
    return `Prefecture ${maps.prefectures.get(String(item.prefecture_id)) ?? "-"}`;
  }
  return `Commune ${maps.communes.get(String(item.commune_id)) ?? "-"}`;
}

export function CommunauteClient({
  communes,
  currentMemberId,
  initialConversationType,
  initialQuery,
  items,
  loadError,
  members,
  messages,
  prefectures,
  regions,
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
  const [scopeType, setScopeType] = useState<ScopeLevel>("all");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedPrefecture, setSelectedPrefecture] = useState("");

  const selectedConversation =
    items.find((item) => item.id === selectedConversationId) ?? null;
  const participantChoices = members.filter((member) => member.id !== currentMemberId);

  const maps = useMemo(
    () => ({
      communes: new Map(communes.map((item) => [String(item.id), item.name])),
      prefectures: new Map(prefectures.map((item) => [String(item.id), item.name])),
      regions: new Map(regions.map((item) => [String(item.id), item.name])),
    }),
    [communes, prefectures, regions],
  );
  const prefectureToRegion = useMemo(
    () => new Map(prefectures.map((item) => [String(item.id), String(item.region_id)])),
    [prefectures],
  );
  const communeToPrefecture = useMemo(
    () => new Map(communes.map((item) => [String(item.id), String(item.prefecture_id)])),
    [communes],
  );

  const availablePrefectures = selectedRegion
    ? prefectures.filter((item) => String(item.region_id) === selectedRegion)
    : prefectures;
  const availableCommunes = selectedPrefecture
    ? communes.filter((item) => String(item.prefecture_id) === selectedPrefecture)
    : selectedRegion
      ? communes.filter(
          (item) => prefectureToRegion.get(String(item.prefecture_id)) === selectedRegion,
        )
      : communes;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Communaute CZI</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Discussions</h2>
          <CardDescription className="mt-2">
            Canaux communautaires et messagerie privee entre membres.
          </CardDescription>
        </div>
        <Button onClick={() => setOpen(true)}>Nouvelle discussion</Button>
      </div>

      <Card className="space-y-3">
        <CardTitle className="text-base">Recherche</CardTitle>
        <form className="grid gap-3 md:grid-cols-3" method="get">
          <Input defaultValue={initialQuery} name="q" placeholder="Titre du canal..." />
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
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="space-y-4">
            <CardTitle className="text-base">Conversations ({items.length})</CardTitle>
            <div className="space-y-2">
              {items.length === 0 ? (
                <CardDescription>Aucune discussion visible.</CardDescription>
              ) : (
                items.map((item) => (
                  <Link
                    className={cn(
                      "block rounded-lg border border-border px-3 py-3 transition-colors",
                      item.id === selectedConversationId
                        ? "bg-primary/10 border-primary/30"
                        : "bg-surface hover:bg-muted-surface",
                    )}
                    href={`/app/communaute?q=${encodeURIComponent(initialQuery)}&conversation_type=${encodeURIComponent(initialConversationType)}&conversation=${item.id}`}
                    key={item.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-foreground">
                        {conversationLabel(item, currentMemberId)}
                      </p>
                      <Badge variant={item.conversation_type === "community" ? "success" : "default"}>
                        {item.conversation_type === "community" ? "communaute" : "prive"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">{scopeText(item, maps)}</p>
                    <p className="mt-2 text-sm text-muted line-clamp-2">
                      {item.latest_message?.body ?? "Aucun message pour le moment."}
                    </p>
                  </Link>
                ))
              )}
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
                  ? `Portee: ${scopeText(selectedConversation, maps)}`
                  : "Choisissez un canal a gauche pour lire et envoyer des messages."}
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
                        {(message.sender?.first_name ?? "") + " " + (message.sender?.last_name ?? "")}
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
                  defaultValue="community"
                  id="create-conversation-type"
                  name="conversation_type"
                  onChange={(event) =>
                    setCreateType(event.target.value === "direct" ? "direct" : "community")
                  }
                >
                  <option value="community">Canal communaute</option>
                  <option value="direct">Message prive</option>
                </Select>
              </div>

              {createType === "community" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="create-community-title">
                      Titre du canal
                    </label>
                    <Input
                      id="create-community-title"
                      name="title"
                      placeholder="Ex: Communaute Kara"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="create-community-scope">
                      Portee
                    </label>
                    <Select
                      value={scopeType}
                      id="create-community-scope"
                      name="scope_type"
                      onChange={(event) => {
                        const nextScope = event.target.value as ScopeLevel;
                        setScopeType(nextScope);
                        if (nextScope === "all") {
                          setSelectedRegion("");
                          setSelectedPrefecture("");
                        } else if (nextScope === "region") {
                          setSelectedPrefecture("");
                        }
                      }}
                    >
                      <option value="all">National</option>
                      <option value="region">Par region</option>
                      <option value="prefecture">Par prefecture</option>
                      <option value="commune">Par commune</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="create-community-region">
                      Region
                    </label>
                    <Select
                      disabled={scopeType === "all"}
                      id="create-community-region"
                      name="region_id"
                      onChange={(event) => {
                        setSelectedRegion(event.target.value);
                        setSelectedPrefecture("");
                      }}
                    >
                      <option value="">Selectionner une region</option>
                      {regions.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="create-community-prefecture">
                      Prefecture
                    </label>
                    <Select
                      disabled={scopeType === "all"}
                      id="create-community-prefecture"
                      name="prefecture_id"
                      onChange={(event) => {
                        const value = event.target.value;
                        setSelectedPrefecture(value);
                        if (value && scopeType === "region") {
                          setScopeType("prefecture");
                        }
                      }}
                    >
                      <option value="">Selectionner une prefecture</option>
                      {availablePrefectures.map((prefecture) => (
                        <option key={prefecture.id} value={prefecture.id}>
                          {prefecture.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium" htmlFor="create-community-commune">
                      Commune
                    </label>
                    <Select
                      disabled={scopeType === "all"}
                      id="create-community-commune"
                      name="commune_id"
                      onChange={(event) => {
                        const value = event.target.value;
                        if (!value) return;
                        const parentPrefecture = communeToPrefecture.get(value);
                        if (parentPrefecture) {
                          setSelectedPrefecture(parentPrefecture);
                          const parentRegion = prefectureToRegion.get(parentPrefecture);
                          if (parentRegion) {
                            setSelectedRegion(parentRegion);
                          }
                        }
                        if (scopeType !== "commune") {
                          setScopeType("commune");
                        }
                      }}
                    >
                      <option value="">Selectionner une commune</option>
                      {availableCommunes.map((commune) => (
                        <option key={commune.id} value={commune.id}>
                          {commune.name}
                        </option>
                      ))}
                    </Select>
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
                <Button disabled={createPending} type="submit">
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
