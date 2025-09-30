import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ChatHistoryList } from "@/components/lists/chat-history-list";
import { ChatHistoryListSkeleton } from "@/components/skeletons/chat-history-list-skeleton";
import { auth } from "@/lib/auth/auth";

export const metadata = {
  title: "Chat History - Recipe Discovery | Tastebase",
  description: "Browse your previous recipe discovery conversations",
};

export default async function ChatHistoryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/auth/sign-in");

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Chat History</h1>
          <p className="text-muted-foreground">
            Browse and resume your previous recipe discovery conversations
          </p>
        </div>

        <Suspense fallback={<ChatHistoryListSkeleton />}>
          <ChatHistoryList userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
}
