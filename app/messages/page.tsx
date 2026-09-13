import type { Metadata } from "next";
import { Suspense } from "react";
import { MessagesInbox } from "@/components/messages/MessagesInbox";

export const metadata: Metadata = {
  title: "Messages",
  description: "Your direct messages and conversations on Weca — connect with fellow anomaly explorers.",
};

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesInbox />
    </Suspense>
  );
}
