import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ConversationThread } from "@/components/messages/ConversationThread";

export const metadata: Metadata = {
  title: "Conversation",
  description: "Direct message conversation on Weca.",
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Protect against accidental "/messages/user" or invalid route visits - directly route to message inbox
  if (!id || id === "user" || id === "weca_explorer" || id === "undefined" || id === "null") {
    redirect("/messages");
  }

  return <ConversationThread conversationId={id} />;
}

