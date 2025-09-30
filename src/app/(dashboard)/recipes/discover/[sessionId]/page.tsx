import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ChatConversationView } from "@/components/chat/chat-conversation-view";
import { RecipeDiscoveryChatSkeleton } from "@/components/skeletons/recipe-discovery-chat-skeleton";
import { auth } from "@/lib/auth/auth";

interface ChatConversationPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function generateMetadata({ params }: ChatConversationPageProps) {
  const { sessionId } = await params;
  return {
    title: `Recipe Discovery Chat - Session ${sessionId.slice(0, 8)} | Tastebase`,
    description: "Continue your recipe discovery conversation",
  };
}

export default async function ChatConversationPage({
  params,
}: ChatConversationPageProps) {
  const { sessionId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/auth/sign-in");

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<RecipeDiscoveryChatSkeleton />}>
          <ChatConversationView
            userId={session.user.id}
            sessionId={sessionId}
          />
        </Suspense>
      </div>
    </div>
  );
}
