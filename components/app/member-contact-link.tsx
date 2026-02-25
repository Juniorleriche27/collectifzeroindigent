"use client";

import type { ReactNode } from "react";

type ContactChannel = "email" | "phone";
type ContactSource = "members_list" | "member_detail";

type MemberContactLinkProps = {
  channel: ContactChannel;
  children: ReactNode;
  className?: string;
  href: string;
  memberId: string;
  source: ContactSource;
};

export function MemberContactLink({
  channel,
  children,
  className,
  href,
  memberId,
  source,
}: MemberContactLinkProps) {
  function handleClick() {
    void fetch("/api/member-contact-actions", {
      body: JSON.stringify({
        channel,
        member_id: memberId,
        source,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      method: "POST",
    }).catch(() => undefined);
  }

  return (
    <a className={className} href={href} onClick={handleClick}>
      {children}
    </a>
  );
}
