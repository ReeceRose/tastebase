"use client";

import { formatDistanceToNow } from "date-fns";
import {
  ChefHat,
  Clock,
  MessageSquare,
  MoreHorizontal,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-search";
import {
  deleteConversationSession,
  getConversationHistory,
  getUserConversationSessions,
} from "@/lib/server-actions/conversation-actions";
import { HighlightedText } from "@/lib/utils/search-highlighting";

interface ConversationSession {
  id: string;
  title: string;
  updatedAt: Date;
  createdAt: Date;
  isActive: boolean;
  context?: string;
  messageCount?: number;
  lastMessage?: string;
  conversationTopic?: string;
}

interface ChatHistoryListProps {
  userId: string;
}

export function ChatHistoryList({ userId }: ChatHistoryListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    hasMore: false,
    offset: 0,
    limit: 10,
  });

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sortBySelectId = useId();
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "mostMessages">(
    "recent",
  );

  useEffect(() => {
    const queryFromUrl = searchParams.get("search") || "";
    if (queryFromUrl !== searchQuery) {
      setSearchQuery(queryFromUrl);
    }
  }, [searchParams, searchQuery]);

  // Generate smart titles from conversation content
  const generateSmartTitle = useCallback((firstMessage: string): string => {
    const message = firstMessage.toLowerCase();

    // Recipe discovery patterns
    if (message.includes("chicken") && message.includes("rice")) {
      return "Chicken & Rice Ideas";
    }
    if (message.includes("vegetarian") || message.includes("vegan")) {
      return "Vegetarian Recipe Search";
    }
    if (
      message.includes("quick") ||
      message.includes("fast") ||
      message.includes("30 minutes")
    ) {
      return "Quick Meal Ideas";
    }
    if (message.includes("healthy") || message.includes("diet")) {
      return "Healthy Recipe Discovery";
    }
    if (message.includes("dessert") || message.includes("sweet")) {
      return "Dessert Exploration";
    }
    if (message.includes("comfort food") || message.includes("cozy")) {
      return "Comfort Food Chat";
    }
    if (message.includes("italian") || message.includes("pasta")) {
      return "Italian Cuisine";
    }
    if (
      message.includes("asian") ||
      message.includes("chinese") ||
      message.includes("japanese")
    ) {
      return "Asian Recipe Ideas";
    }
    if (message.includes("breakfast") || message.includes("morning")) {
      return "Breakfast Planning";
    }
    if (message.includes("dinner") || message.includes("evening")) {
      return "Dinner Ideas";
    }
    if (message.includes("lunch")) {
      return "Lunch Suggestions";
    }
    if (message.includes("meal prep") || message.includes("batch")) {
      return "Meal Prep Planning";
    }

    // Fallback: use first few words
    const words = firstMessage.split(" ").slice(0, 4).join(" ");
    return words.length > 25 ? `${words.slice(0, 25)}...` : words;
  }, []);

  const enhanceSessionsWithData = useCallback(
    async (
      sessionData: Array<{
        id: string;
        title: string | null;
        updatedAt: Date;
        createdAt: Date;
        isActive: boolean;
        context: string | null;
      }>,
    ) => {
      // Enhance sessions with conversation data
      const enhancedSessions = await Promise.all(
        sessionData.map(async (session) => {
          // Get conversation history for preview
          const historyResult = await getConversationHistory(
            session.id,
            userId,
          );
          let lastMessage = "";
          let messageCount = 0;
          let smartTitle = session.title || "Recipe Chat";

          if (historyResult.success && historyResult.data) {
            const messages = historyResult.data;
            messageCount = messages.length;

            // If we have a search query, try to find a message that contains it for preview
            if (debouncedSearchQuery) {
              const searchLower = debouncedSearchQuery.toLowerCase();
              const matchingMessage = messages.find((m) =>
                m.content.toLowerCase().includes(searchLower),
              );

              if (matchingMessage) {
                const content = matchingMessage.content;
                const index = content.toLowerCase().indexOf(searchLower);
                const start = Math.max(0, index - 50);
                const end = Math.min(content.length, index + 50);
                lastMessage = content.slice(start, end);
                if (start > 0) lastMessage = `...${lastMessage}`;
                if (end < content.length) lastMessage = `${lastMessage}...`;
              }
            }

            // If no search or no matching message found, use last user message
            if (!lastMessage) {
              const lastUserMessage = messages
                .filter((m) => m.role === "user")
                .pop();

              if (lastUserMessage) {
                lastMessage = lastUserMessage.content.slice(0, 100);
              }
            }

            // Generate smart title from first user message
            const firstUserMessage = messages.filter(
              (m) => m.role === "user",
            )[0];

            if (firstUserMessage && smartTitle.includes("Session")) {
              smartTitle = generateSmartTitle(firstUserMessage.content);
            }
          }

          return {
            id: session.id,
            title: smartTitle,
            updatedAt: new Date(session.updatedAt),
            createdAt: new Date(session.createdAt),
            isActive: session.isActive,
            context: session.context || undefined,
            messageCount,
            lastMessage,
          };
        }),
      );

      return enhancedSessions.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
      );
    },
    [userId, debouncedSearchQuery, generateSmartTitle],
  );

  const loadSessionsForSearch = useCallback(async () => {
    // Don't show loading state for search to preserve input focus
    const result = await getUserConversationSessions(userId, {
      limit: 10,
      offset: 0,
      search: debouncedSearchQuery || undefined,
    });

    if (result.success && result.data && result.pagination) {
      const enhancedSessions = await enhanceSessionsWithData(result.data);
      setSessions(enhancedSessions);
      setPagination(result.pagination);
    }
  }, [userId, debouncedSearchQuery, enhanceSessionsWithData]);

  const loadInitialSessions = useCallback(async () => {
    setIsLoading(true);
    const result = await getUserConversationSessions(userId, {
      limit: 10,
      offset: 0,
      search: debouncedSearchQuery || undefined,
    });

    if (result.success && result.data && result.pagination) {
      const enhancedSessions = await enhanceSessionsWithData(result.data);
      setSessions(enhancedSessions);
      setPagination(result.pagination);
    }
    setIsLoading(false);
  }, [userId, debouncedSearchQuery, enhanceSessionsWithData]);

  useEffect(() => {
    loadInitialSessions();
  }, [loadInitialSessions]);

  useEffect(() => {
    // Reload sessions when debounced search query changes
    // Don't show loading state for search to preserve focus
    loadSessionsForSearch();
  }, [loadSessionsForSearch]);

  async function loadMoreSessions() {
    if (!pagination.hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    const result = await getUserConversationSessions(userId, {
      limit: pagination.limit,
      offset: pagination.offset + pagination.limit,
      search: debouncedSearchQuery || undefined,
    });

    if (result.success && result.data && result.pagination) {
      const enhancedSessions = await enhanceSessionsWithData(result.data);
      setSessions((prev) => [...prev, ...enhancedSessions]);
      setPagination(result.pagination);
    }
    setIsLoadingMore(false);
  }

  async function handleDeleteSession() {
    if (!sessionToDelete) return;

    setIsDeleting(true);
    const result = await deleteConversationSession(sessionToDelete, userId);

    if (result.success) {
      // Remove from local state
      setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete));
      setPagination((prev) => ({
        ...prev,
        total: prev.total - 1,
      }));
    }

    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  }

  function confirmDeleteSession(sessionId: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  }

  function updateSearchQuery(query: string) {
    setSearchQuery(query);

    // Update URL with search parameter
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("search", query);
    } else {
      params.delete("search");
    }

    const newUrl = params.toString()
      ? `/recipes/discover/history?${params.toString()}`
      : `/recipes/discover/history`;

    router.replace(newUrl);
  }

  function clearSearch() {
    setSearchQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    const newUrl = params.toString()
      ? `/recipes/discover/history?${params.toString()}`
      : `/recipes/discover/history`;
    router.replace(newUrl);
  }

  function applySorting(sessions: ConversationSession[]) {
    const sorted = [...sessions];
    switch (sortBy) {
      case "oldest":
        return sorted.sort(
          (a, b) => a.updatedAt.getTime() - b.updatedAt.getTime(),
        );
      case "mostMessages":
        return sorted.sort(
          (a, b) => (b.messageCount || 0) - (a.messageCount || 0),
        );
      default:
        return sorted.sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
        );
    }
  }

  // Sessions are filtered on the server side, but we apply client-side sorting
  const filteredSessions = applySorting(sessions);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2, 3, 4].map((index) => (
          <Card key={`skeleton-${index}`} className="p-6 animate-pulse">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-20" />
              </div>
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="flex gap-2">
                <div className="h-6 bg-muted rounded w-16" />
                <div className="h-6 bg-muted rounded w-20" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => updateSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={loadSessionsForSearch} variant="default">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>

            {searchQuery && (
              <Button onClick={clearSearch} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}

            <Button asChild variant="default">
              <Link href="/recipes/discover">
                <MessageSquare className="h-4 w-4 mr-2" />
                New Chat
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label
              htmlFor={sortBySelectId}
              className="text-sm font-medium text-muted-foreground"
            >
              Sort by:
            </label>
            <Select
              value={sortBy}
              onValueChange={(value: typeof sortBy) => setSortBy(value)}
            >
              <SelectTrigger id={sortBySelectId} className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="mostMessages">Most Messages</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      {filteredSessions.length > 0 ? (
        <div className="space-y-2">
          {filteredSessions.map((session) => (
            <Card
              key={session.id}
              className="group hover:shadow-md transition-all duration-200 hover:bg-accent/50"
            >
              <Link href={`/recipes/discover/${session.id}`} className="block">
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <ChefHat className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          <HighlightedText
                            text={session.title}
                            searchQuery={searchQuery}
                          />
                        </h3>
                        <div className="flex items-center gap-3 mt-0.5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(session.updatedAt, {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          {(session.messageCount ?? 0) > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageSquare className="h-3 w-3" />
                              <span>{session.messageCount ?? 0}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {session.isActive && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-green-100 text-green-700 px-2 py-0.5"
                        >
                          Recent
                        </Badge>
                      )}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) =>
                                confirmDeleteSession(session.id, e)
                              }
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  {/* Last Message Preview */}
                  {session.lastMessage && (
                    <div className="mt-2 pl-11">
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        "
                        <HighlightedText
                          text={session.lastMessage}
                          searchQuery={searchQuery}
                        />
                        ..."
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            </Card>
          ))}

          {/* Load More Button */}
          {pagination.hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMoreSessions}
                disabled={isLoadingMore}
                className="min-w-32"
              >
                {isLoadingMore ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({pagination.total - sessions.length} remaining)
                    </span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Pagination Info */}
          {sessions.length > 0 && (
            <div className="text-center pt-4 text-sm text-muted-foreground">
              {debouncedSearchQuery ? (
                <>
                  Showing {sessions.length} of {pagination.total} search results
                </>
              ) : (
                <>
                  Showing {sessions.length} of {pagination.total} conversations
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {searchQuery ? "No conversations found" : "No chat history yet"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "Try adjusting your search terms"
              : "Start your first recipe discovery conversation"}
          </p>
          <Button asChild>
            <Link href="/recipes/discover">
              <MessageSquare className="h-4 w-4 mr-2" />
              Start Chatting
            </Link>
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action
              cannot be undone and will permanently remove all messages from
              this chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
