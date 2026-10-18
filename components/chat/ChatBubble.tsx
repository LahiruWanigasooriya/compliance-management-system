"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/loader/Loader";
import Tooltip from "@/components/ui/Tooltip";
import {
  Maximize2,
  Minimize2,
  X,
  Send,
  MessageCircle,
  Plus,
  Menu,
  Pencil,
  Check,
  Trash2,
} from "lucide-react";
import {
  sendChatQuery,
  getChatSessions,
  createChatSession,
  getSessionQueries,
  updateChatSession,
  deleteChatSession,
} from "@/actions/chat.actions";
import Image from "next/image";
import { ChatSession } from "@/types/gpt-chats/gpt.type";
import { useTenant } from "@/components/providers/tenant.provider";
import { ICONS } from "@/constants/constants";

const Typewriter = ({
  text,
  speed = 5,
  onComplete,
}: {
  text: string;
  speed?: number;
  onComplete?: () => void;
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, speed, onComplete]);

  return (
    <div className="whitespace-pre-wrap break-words">
      {displayedText}
    </div>
  );
};

const SimpleTable = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return null;
  const keys = Object.keys(data[0]);
  return (
    <div className="overflow-x-auto my-4 border border-gray-200/60 dark:border-white/10 rounded-xl bg-white/50 dark:bg-black/20 backdrop-blur-sm custom-scrollbar shadow-sm">
      <table className="w-full text-[11px] text-left border-collapse min-w-max">
        <thead>
          <tr className="bg-gray-100/50 dark:bg-white/5 border-b border-gray-200/60 dark:border-white/10">
            {keys.map((key) => (
              <th
                key={key}
                className="px-4 py-2.5 font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap"
              >
                {key.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
          {data.map((row, i) => (
            <tr
              key={i}
              className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
            >
              {keys.map((key) => (
                <td
                  key={key}
                  className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap"
                >
                  {String(row[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
const formatRetryDuration = (milliseconds: number) => {
  if (milliseconds >= 1000) {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  }
  return `${Math.max(Math.ceil(milliseconds), 0)}ms`;
};

export default function ChatBubble({
  enableGptQuery = true,
}: {
  enableGptQuery?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<
    {
      type: "text" | "table" | "bullets";
      content:
        | string
        | { message: string; data: any[] }
        | { message: string; items: string[] };
      sender: "user" | "bot";
      isNew?: boolean;
      suggestions?: string[];
      isRateLimitMessage?: boolean;
    }[]
  >([]);
  const [input, setInput] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);

  const formatBotMessage = (botResponse: string | { message: string; results?: any[] }) => {
    let messageType: "text" | "table" | "bullets" = "text";
    let messageContent:
      | string
      | { message: string; data: any[] }
      | { message: string; items: string[] };

    // Handle new format with results field
    if (typeof botResponse === 'object' && botResponse.results) {
      const message = botResponse.message;
      const data = botResponse.results;
      
      if (Array.isArray(data) && data.length > 0) {
        const keys = Object.keys(data[0]);
        const allSameKeys = data.every((obj) => {
          const objKeys = Object.keys(obj);
          return (
            objKeys.length === keys.length &&
            objKeys.every((k) => keys.includes(k))
          );
        });
        if (data.length === 1 && keys.length === 1) {
          messageType = "text";
          messageContent = `${message}\n${String(data[0][keys[0]])}`;
        } else if (data.length === 1 && keys.length > 1) {
          messageType = "bullets";
          messageContent = {
            message,
            items: keys.map((key) => `${key}: ${String(data[0][key])}`),
          };
        } else if (data.length > 1 && keys.length === 1 && allSameKeys) {
          messageType = "bullets";
          messageContent = {
            message,
            items: data.map((obj) => String(obj[keys[0]])),
          };
        } else if (data.length > 1 && keys.length > 1 && allSameKeys) {
          messageType = "table";
          messageContent = { message, data };
        } else {
          messageContent = message;
        }
      } else {
        messageContent = message;
      }
    } else {
      // Handle old format or plain text
      const responseText = typeof botResponse === 'string' ? botResponse : botResponse.message;
      messageContent = responseText;

      if (responseText.includes("\n\nResults:\n")) {
        const parts = responseText.split("\n\nResults:\n");
        if (parts.length === 2) {
          const message = parts[0].trim();
          const resultsStr = parts[1].trim();
          try {
            const data = JSON.parse(resultsStr);
            if (Array.isArray(data) && data.length > 0) {
              const keys = Object.keys(data[0]);
              const allSameKeys = data.every((obj) => {
                const objKeys = Object.keys(obj);
                return (
                  objKeys.length === keys.length &&
                  objKeys.every((k) => keys.includes(k))
                );
              });
              if (data.length === 1 && keys.length === 1) {
                messageType = "text";
                messageContent = `${message}\n${String(data[0][keys[0]])}`;
              } else if (data.length === 1 && keys.length > 1) {
                messageType = "bullets";
                messageContent = {
                  message,
                  items: keys.map((key) => `${key}: ${String(data[0][key])}`),
                };
              } else if (data.length > 1 && keys.length === 1 && allSameKeys) {
                messageType = "bullets";
                messageContent = {
                  message,
                  items: data.map((obj) => String(obj[keys[0]])),
                };
              } else if (data.length > 1 && keys.length > 1 && allSameKeys) {
                messageType = "table";
                messageContent = { message, data };
              }
            }
          } catch (e) {
            // keep as text
          }
        }
      }
    }
    return { type: messageType, content: messageContent };
  };
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [retryAvailableAt, setRetryAvailableAt] = useState<number | null>(null);
  const [, setRetryRefresh] = useState(0);
  const { selectedTenantId } = useTenant();
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const SESSION_LIMIT = 20;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const isDeleteModal = (event.target as HTMLElement).closest(
        ".delete-confirmation",
      );
      if (
        chatRef.current &&
        !chatRef.current.contains(event.target as Node) &&
        !isDeleteModal
      ) {
        setIsVisible(false);
        setTimeout(() => setIsOpen(false), 600);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const scrollContainer = scrollAreaRef.current;
    if (!scrollContainer) return;

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
      }
    };

    // Use a MutationObserver to catch any height changes (typewriter, images, etc.)
    const observer = new MutationObserver((mutations) => {
      // For real-time typing updates (characterData), use 'auto' for instant tracking
      // For child completions, use 'smooth'
      const isCharacterData = mutations.some((m) => m.type === "characterData");
      scrollToBottom(isCharacterData ? "auto" : "smooth");
    });

    observer.observe(scrollContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Initial scroll for new messages
    scrollToBottom("smooth");

    return () => observer.disconnect();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen, selectedTenantId]);

  // Reset chat state when tenant changes
  useEffect(() => {
    setMessages([]);
    setCurrentSessionId("");
    setShowWelcome(true);
    setSessions([]);
    setOffset(0);
    setHasMore(true);
    setEditingSessionId(null);
    setDeleteConfirmId(null);
  }, [selectedTenantId]);

  useEffect(() => {
    if (!retryAvailableAt) {
      setRetryRefresh(0);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const interval = window.setInterval(() => {
      const remaining = retryAvailableAt - Date.now();
      if (remaining <= 0) {
        setRetryAvailableAt(null);
        setRetryRefresh((tick) => tick + 1);
        return;
      }
      setRetryRefresh((tick) => tick + 1);
    }, 200);

    return () => window.clearInterval(interval);
  }, [retryAvailableAt]);

  const loadSessions = async (isMore: boolean = false) => {
    if (isMore) {
      if (isFetchingMore || !hasMore) return;
      setIsFetchingMore(true);
    } else {
      setIsLoadingSession(true);
      setOffset(0);
      setHasMore(true);
    }

    const currentOffset = isMore ? offset + SESSION_LIMIT : 0;
    const response = await getChatSessions(SESSION_LIMIT, currentOffset);

    if (response.success) {
      if (isMore) {
        setSessions((prev) => [...prev, ...response.data]);
        setOffset(currentOffset);
      } else {
        setSessions(response.data);
      }
      if (response.data.length < SESSION_LIMIT) {
        setHasMore(false);
      }
    }

    setIsLoadingSession(false);
    setIsFetchingMore(false);
  };

  const handleSidebarScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isBottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 50;

    if (isBottom && !isLoadingSession && !isFetchingMore && hasMore) {
      loadSessions(true);
    }
  };

  const handleNewChat = async () => {
    setIsCreatingChat(true);
    const response = await createChatSession();
    if (response.success) {
      setCurrentSessionId(response.data.id);
      setMessages([]);
      setShowWelcome(true);
      loadSessions();
    }
    setIsCreatingChat(false);
  };

  const handleSelectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    const response = await getSessionQueries(sessionId);
    if (response.success) {
      const formattedMessages = response.data.flatMap((q) => {
        const { type, content } = formatBotMessage(q.response);
        return [
          { type: "text" as const, content: q.query, sender: "user" as const },
          { type, content, sender: "bot" as const, suggestions: q.metadata.suggestions },
        ];
      });
      setMessages(formattedMessages);
      setShowWelcome(formattedMessages.length === 0);
    }
  };

  const handleEditSession = (
    sessionId: string,
    currentTitle: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setEditingSessionId(sessionId);
    setEditTitle(currentTitle);
  };

  const handleSaveTitle = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const previousTitle = sessions.find((s) => s.id === sessionId)?.title || "";
    const newTitle = editTitle.trim();

    if (newTitle && newTitle !== previousTitle) {
      setIsSavingTitle(true);
      const response = await updateChatSession(sessionId, newTitle);
      if (response.success) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? response.data : s)),
        );
      } else {
        setEditTitle(previousTitle);
      }
      setIsSavingTitle(false);
    }
    setEditingSessionId(null);
  };

  const handleDeleteSession = async (
    sessionId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setDeleteConfirmId(sessionId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeletingChat(true);
    const response = await deleteChatSession(deleteConfirmId);
    if (response.success) {
      setSessions((prev) => prev.filter((s) => s.id !== deleteConfirmId));
      if (currentSessionId === deleteConfirmId) {
        setCurrentSessionId("");
        setMessages([]);
        setShowWelcome(true);
      }
    }
    setIsDeletingChat(false);
    setDeleteConfirmId(null);
  };

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = input;
      setMessages((prev) => [
        ...prev,
        { type: "text", content: userMessage, sender: "user" },
      ]);
      setInput("");
      setShowWelcome(false);
      setIsLoading(true);
      try {
        let sessionId = currentSessionId;
        if (!sessionId) {
          const sessionResponse = await createChatSession();
          if (sessionResponse.success) {
            sessionId = sessionResponse.data.id;
            setCurrentSessionId(sessionId);
            loadSessions();
          }
        }

        const response = await sendChatQuery(`${userMessage}`, sessionId);

          if (!response.success) {
            if (response.retryAfterMs) {
              setRetryAvailableAt(Date.now() + response.retryAfterMs);
            }
            const rateLimitNotice = response.retryAfterMs
              ? `Rate limit reached. Please wait ${formatRetryDuration(
                  response.retryAfterMs,
                )} before trying again.`
              : null;
            setMessages((prev) => [
              ...prev,
              {
                type: "text",
                content: rateLimitNotice ?? response.message ?? "Error: Could not get response",
                sender: "bot",
                isRateLimitMessage: Boolean(rateLimitNotice),
              },
            ]);
            return;
          }

        setRetryAvailableAt(null);
        const botResponse = response.data.response;
        const { type: messageType, content: messageContent } = formatBotMessage(botResponse);
        
        setMessages((prev) => [
          ...prev,
          {
            type: messageType,
            content: messageContent,
            sender: "bot",
            isNew: true,
            suggestions: response.data.metadata.suggestions,
          },
        ]);

        // Update session title with first part of bot response if it's still "New Chat"
        const currentSession = sessions.find((s) => s.id === sessionId);
        if (currentSession?.title === "New Chat" && messages.length === 0) {
          const newTitle = response.data.response.message.slice(0, 50);
          const updateResponse = await updateChatSession(sessionId, newTitle);
          if (updateResponse.success) {
            setSessions((prev) =>
              prev.map((s) => (s.id === sessionId ? updateResponse.data : s)),
            );
          }
        }

        // Update session list with new last_message and move to top
        setSessions((prev) => {
          const updatedSession = prev.find((s) => s.id === sessionId);
          if (updatedSession) {
            const otherSessions = prev.filter((s) => s.id !== sessionId);
            return [
              { ...updatedSession, last_message: userMessage },
              ...otherSessions,
            ];
          }
          return prev;
        });
      } catch (error) {
        console.error("Error sending query:", error);
        setRetryAvailableAt(null);
        setMessages((prev) => [
          ...prev,
          {
            type: "text",
            content: "Error: Could not get response",
            sender: "bot",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!enableGptQuery) {
    return null;
  }

  if (!isOpen && !isVisible) {
    return (
      <Button
        size="icon"
        className="fixed bottom-4 cursor-pointer dark:bg-white right-4 h-16 w-16 animate-pulse rounded-full shadow-lg z-50 animate-glow hover:scale-110 transition-transform duration-200"
        onClick={() => {
          setIsExpanded(false);
          setIsOpen(true);
          setIsVisible(true);
        }}
      >
        <Tooltip text="Chat with VESANT AI" position="left">
          <MessageCircle className="h-2 w-2 scale-150 stroke-white dark:stroke-[#0c1e1d] animate-pulse" />
        </Tooltip>
      </Button>
    );
  }

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setIsOpen(false), 600);
  };

  const rateLimitRemainingMs = retryAvailableAt
    ? Math.max(retryAvailableAt - Date.now(), 0)
    : 0;
  const isRateLimited = retryAvailableAt !== null && rateLimitRemainingMs > 0;

  const chatPanel = (
    <div
      ref={chatRef}
      className={`relative bg-[#f5f5f5] dark:bg-[#0c1e1d] border border-gray-200 dark:border-gray-700 shadow-lg flex overflow-hidden rounded-lg transition-all duration-300 ${
        isExpanded
          ? "w-4/5 h-4/5"
          : showSidebar
            ? "w-[650px] h-[580px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)]"
            : "w-[400px] h-[520px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)]"
      } ${isVisible ? "animate-genie-in" : "animate-genie-out"}`}
      style={{
        transformOrigin: "bottom right",
        perspective: "1000px",
      }}
    >
      <div
        className={`flex flex-col overflow-hidden transition-all duration-300 ease-in-out bg-gray-50/30 dark:bg-[#0c1e1d] ${
          showSidebar
            ? "w-64 opacity-100 border-r border-gray-100 dark:border-gray-800"
            : "w-0 opacity-0"
        }`}
      >
        <div className="w-64 flex flex-col h-full overflow-hidden">
          {/* Refined Sidebar Header */}
          <div className="p-6 pb-2">
            <div className="flex items-center justify-between mb-6">
              <Image
                src="/logo-green.svg"
                alt="Logo"
                width={110}
                height={110}
                className="brightness-90 dark:hidden"
              />
              <Image
                src="/logo.svg"
                alt="Logo"
                width={110}
                height={110}
                className="hidden dark:block brightness-110"
              />
              <Tooltip text="New Chat" position="bottom">
                <Button
                  onClick={handleNewChat}
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg border-gray-200 bg-white/30 text-[#3d5550] transition-all cursor-pointer"
                  disabled={isCreatingChat}
                >
                  {isCreatingChat ? (
                    <>
                      <Loader
                        size="13"
                        speed="2.5"
                        className="w-4 h-4 dark:hidden"
                        stroke="3"
                      />
                      <Loader
                        size="13"
                        speed="2.5"
                        className="w-4 h-4 hidden dark:block"
                        stroke="3"
                        lightColor="#ffffff"
                      />
                    </>
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </Tooltip>
            </div>
          </div>

          <div
            ref={sidebarScrollRef}
            onScroll={handleSidebarScroll}
            className="flex-1 overflow-y-auto px-3 pb-8 space-y-6 custom-scrollbar"
          >
            {isLoadingSession ? (
              <div className="flex items-center justify-center h-full">
                <>
                  <Loader
                    size="35"
                    speed="2.5"
                    className="w-8 h-8 dark:hidden"
                    stroke="3"
                  />
                  <Loader
                    size="35"
                    speed="2.5"
                    className="w-8 h-8 hidden dark:block"
                    stroke="3"
                    lightColor="#ffffff"
                  />
                </>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  No chat sessions yet. Start a new conversation!
                </p>
              </div>
            ) : (
              (() => {
                const groups: { [key: string]: ChatSession[] } = {};
                const now = new Date();
                const today = new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  now.getDate(),
                );
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(today.getDate() - 7);

                sessions.forEach((session) => {
                  const date = new Date(session.created_at);
                  let label = "Older";
                  if (date >= today) label = "Today";
                  else if (date >= yesterday) label = "Yesterday";
                  else if (date >= sevenDaysAgo) label = "Previous 7 Days";

                  if (!groups[label]) groups[label] = [];
                  groups[label].push(session);
                });

                return ["Today", "Yesterday", "Previous 7 Days", "Older"].map(
                  (label) => {
                    if (!groups[label] || groups[label].length === 0)
                      return null;
                    return (
                      <div key={label} className="space-y-1">
                        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-2 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                          {label}
                        </h4>
                        {groups[label].map((session) => (
                          <div
                            key={session.id}
                            onClick={() => handleSelectSession(session.id)}
                            className={`py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-200 group relative flex items-center gap-3 ${
                              currentSessionId === session.id
                                ? "bg-gray-100/80 dark:bg-gray-800/50"
                                : "hover:bg-gray-100/40 dark:hover:bg-gray-800/20"
                            }`}
                          >
                            {editingSessionId === session.id ? (
                              <div
                                className="flex items-center gap-2 flex-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Input
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="h-7 text-xs flex-1 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 px-2 focus:ring-1 focus:ring-gray-400"
                                  autoFocus
                                  onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    handleSaveTitle(session.id, e as any)
                                  }
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-gray-500 hover:text-gray-900 cursor-pointer  dark:text-gray-500 dark:hover:text-white dark:hover:bg-[#1a2e2c] transition-all duration-200"
                                  onClick={(e) =>
                                    handleSaveTitle(session.id, e)
                                  }
                                  disabled={isSavingTitle}
                                >
                                  {isSavingTitle ? (
                                    <>
                                      <Loader
                                        size="13"
                                        speed="2.5"
                                        className="w-4 h-4 dark:hidden"
                                        stroke="3"
                                      />
                                      <Loader
                                        size="13"
                                        speed="2.5"
                                        className="w-4 h-4 hidden dark:block"
                                        stroke="3"
                                        lightColor="#ffffff"
                                      />
                                    </>
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <div
                                    className={`truncate text-xs transition-colors ${
                                      currentSessionId === session.id
                                        ? "font-semibold text-gray-900 dark:text-white"
                                        : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                                    }`}
                                  >
                                    {session.title}
                                  </div>
                                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-4 w-4 text-gray-300 hover:text-gray-600 shrink-0 cursor-pointer"
                                      onClick={(e) =>
                                        handleEditSession(
                                          session.id,
                                          session.title,
                                          e,
                                        )
                                      }
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    {/* <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-4 w-4 text-gray-300 hover:text-red-600 shrink-0 cursor-pointer"
                                      onClick={(e) =>
                                        handleDeleteSession(session.id, e)
                                      }
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button> */}
                                  </div>
                                </div>
                              </div>
                            )}
                            {currentSessionId === session.id && (
                              <div className="absolute right-0 top-2 bottom-2 w-0.5 bg-gray-900 dark:bg-white rounded-full" />
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  },
                );
              })()
            )}
            {isFetchingMore && (
              <div className="flex justify-center py-4">
                <Loader
                  size="20"
                  speed="2.5"
                  className="w-5 h-5 dark:hidden"
                  stroke="3"
                />
                <Loader
                  size="20"
                  speed="2.5"
                  className="w-5 h-5 hidden dark:block"
                  stroke="3"
                  lightColor="#ffffff"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Tooltip
              text={showSidebar ? "Hide Sidebar" : "Show Sidebar"}
              position="bottom"
            >
              <Button
                size="icon"
                variant="ghost"
                className="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white dark:hover:bg-[#1a2e2c] transition-all duration-200 cursor-pointer rounded-lg"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <Menu
                  className={`h-5 w-5 transition-transform duration-300 ${showSidebar ? "rotate-90" : ""}`}
                />
              </Button>
            </Tooltip>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              VESANT Insight
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip
              text={isExpanded ? "Restore" : "Maximize"}
              position="bottom"
            >
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white dark:hover:bg-[#1a2e2c] transition-all duration-200 cursor-pointer rounded-lg"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </Tooltip>
            <Tooltip text="Close" position="bottom">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white dark:hover:bg-[#1a2e2c] transition-all duration-200 cursor-pointer rounded-lg"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
        </div>
        <div
          ref={scrollAreaRef}
          className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-[#0c1e1d] min-w-0 min-h-0"
        >
          {showWelcome && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto opacity-80">
              <div className="p-4 rounded-3xl bg-gray-50 dark:bg-gray-800/50 mb-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                <Image
                  src="/vesantAI.svg"
                  alt="VESANT Logo"
                  width={48}
                  height={48}
                  className="animate-ripple"
                />
              </div>
              <h2 className="text-xl font-bold text-center text-gray-800 dark:text-white mb-2">
                Hello! How can I assist you?
              </h2>
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                Ask me about compliance results, screening alerts, or data
                insights.
              </p>
            </div>
          )}
          <div className="space-y-6 w-full max-w-full">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar/Icon Section */}
                {/* {msg.sender !== "user" && (
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={`rounded-full flex items-center justify-center shadow-sm border ${"bg-[#3d5550] border-[#3d5550]"}`}
                    >
                      {
                        <Image
                          src="/vesantAI.svg"
                          alt="AI"
                          width={16}
                          height={16}
                          className=" opacity-50"
                        />
                      }
                    </div>
                  </div>
                )} */}

                <div
                  className={`flex flex-col min-w-0 ${msg.sender === "user" ? "items-end" : "items-start"} max-w-[95%]`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {msg.sender === "user" ? (
                        ""
                      ) : (
                        <div className="flex gap-2 items-center shrink-0">
                          <div className="flex flex-col items-center shrink-0">
                            <div
                              className={`rounded-full flex items-center justify-center shadow-sm border ${
                                msg.sender === "bot" && msg.isNew
                                  ? "bg-[#3d555020] border-[#3d555020] animate-pulse"
                                  : "bg-[#3d555070] border-[#3d555070]"
                              }`}
                            >
                              {
                                <Image
                                  src="/vesantAI.svg"
                                  alt="AI"
                                  width={16}
                                  height={16}
                                  className="opacity-70"
                                />
                              }
                            </div>
                          </div>
                          <span className="opacity-70">VESANT AI</span>
                        </div>
                      )}
                    </span>
                  </div>
                  <div
                    className={`text-[13px] leading-relaxed transition-all duration-200 ${
                      msg.sender === "user"
                        ? "py-2 px-3 bg-[#3d5550] text-[#f8fafc] rounded-2xl rounded-tr-none selection:bg-white/20 shadow-sm"
                        : "py-2 text-gray-800 dark:text-gray-100"
                    } w-full max-w-full overflow-hidden`}
                  >
                    {msg.type === "text" ? (
                      msg.sender === "bot" && msg.isNew ? (
                        <Typewriter
                          text={msg.content as string}
                          onComplete={() => {
                            setMessages((prev) =>
                              prev.map((m, i) =>
                                i === index ? { ...m, isNew: false } : m,
                              ),
                            );
                          }}
                        />
                      ) : (
                        <div
                          className={`whitespace-pre-wrap break-words ${
                            msg.sender === "user"
                              ? "text-gray-100 dark:text-gray-100"
                              : msg.isRateLimitMessage
                                ? "text-red-600 dark:text-red-400"
                                : "text-gray-800 dark:text-gray-100"
                          }`}
                        >
                          {msg.isRateLimitMessage && (
                            <ICONS.Clock
                              size={14}
                              className="text-muted-foreground mr-1.5 inline-block -translate-y-0.5"
                            />
                          )}
                          {msg.content as string}
                        </div>
                      )
                    ) : msg.type === "bullets" ? (
                      <div className="w-full">
                        <div className="mb-3 font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/10 pb-2">
                          {
                            (
                              msg.content as {
                                message: string;
                                items: string[];
                              }
                            ).message
                          }
                        </div>
                        <ul className="space-y-2">
                          {(
                            msg.content as { message: string; items: string[] }
                          ).items.map((item, i) => (
                            <li
                              key={i}
                              className="flex gap-3 items-start group/item"
                            >
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3d5550] dark:bg-emerald-400 shrink-0 opacity-40 group-hover/item:opacity-100 transition-opacity" />
                              <span className="break-words">
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="w-full">
                        <div className="mb-3 font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/10 pb-2">
                          {
                            (msg.content as { message: string; data: any[] })
                              .message
                          }
                        </div>
                        <SimpleTable
                          data={
                            (msg.content as { message: string; data: any[] })
                              .data
                          }
                        />
                      </div>
                    )}
                  </div>
                  {msg.sender === "bot" && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                        Suggested queries
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.suggestions.map((suggestion, i) => {
                          const isLastBotMessage = messages.slice(index + 1).every(m => m.sender === "user");
                          return (
                            <button
                              key={i}
                              onClick={() => isLastBotMessage && !isLoading && setInput(suggestion)}
                              disabled={!isLastBotMessage || isLoading}
                              className={`group relative px-3.5 py-2 text-[11px] font-medium rounded-lg transition-all duration-200 ${
                                isLastBotMessage
                                  ? "bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-[#3d5550] hover:text-white dark:hover:bg-[#3d5550] cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-[#3d5550] dark:hover:border-[#3d5550] shadow-sm hover:shadow-md"
                                  : "bg-gray-50/50 dark:bg-gray-900/30 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-100 dark:border-gray-800/50 opacity-60"
                              }`}
                            >
                              <span className="relative z-10">{suggestion}</span>
                              {isLastBotMessage && (
                                <div className="absolute inset-0 bg-gradient-to-r from-[#3d5550]/0 via-[#3d5550]/5 to-[#3d5550]/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {isLoading && (
            <div className="flex gap-3 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col items-center shrink-0">
                <div className="rounded-full flex items-center justify-center shadow-sm border bg-[#3d555020] border-[#3d555020] animate-pulse">
                  <Image
                    src="/vesantAI.svg"
                    alt="AI"
                    width={16}
                    height={16}
                    className="opacity-40"
                  />
                </div>
              </div>
              {/* <div className="flex flex-col items-start py-2">
                <div className="flex gap-1 p-2 px-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl rounded-tl-none border border-gray-100/50 dark:border-white/5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3d5550] dark:bg-emerald-500/50 animate-bounce [animation-duration:0.8s] [animation-delay:-0.32s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3d5550] dark:bg-emerald-500/50 animate-bounce [animation-duration:0.8s] [animation-delay:-0.16s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3d5550] dark:bg-emerald-500/50 animate-bounce [animation-duration:0.8s]"></span>
                </div>
              </div> */}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 bg-white dark:bg-[#0c1e1d]">
          <div className="relative flex items-center bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-1.5 pl-4 border border-gray-100 dark:border-gray-800 focus-within:border-[#3d5550]/20 transition-all shadow-sm">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSend()}
              // disabled={isLoading}
              className="w-full bg-transparent border-none shadow-none focus-visible:ring-0 px-0 h-10 text-sm placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Tooltip text="Send message">
              <Button
                onClick={handleSend}
                size="icon"
                variant="ghost"
                disabled={isLoading || !input.trim() || isRateLimited}
                className="dark:text-gray-300 text-[#3d5550] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
          {isRateLimited && rateLimitRemainingMs > 0 && (
            <p className="mt-2 text-[11px] text-amber-500 dark:text-amber-400">
              Rate limit reached. Please wait{" "}
              {formatRetryDuration(rateLimitRemainingMs)} before retrying.
            </p>
          )}
        </div>
      </div>
      {deleteConfirmId && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-[4px] z-[70] flex items-center justify-center delete-confirmation p-4"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-[2rem] shadow-2xl p-8 max-w-[320px] w-full animate-in zoom-in-95 fade-in duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-5">
                <Trash2 className="h-7 w-7 text-red-600 dark:text-red-500" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Delete Chat?
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                This will permanently remove this conversation. This action
                cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  variant="ghost"
                  className="flex-1 h-11 rounded-xl font-semibold dark:text-gray-300 text-gray-700 bg-gray-100 dark:bg-gray-800 cursor-pointer"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 h-11 rounded-xl font-semibold bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 shadow-md shadow-red-200 dark:shadow-none cursor-pointer"
                  onClick={confirmDelete}
                  disabled={isDeletingChat}
                >
                  {isDeletingChat ? (
                    <Loader
                      size="13"
                      speed="2.5"
                      className="w-4 h-4"
                      stroke="3"
                      lightColor="#ffffff"
                    />
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return isExpanded ? (
    <div
      className={`fixed inset-0 backdrop-blur-sm bg-white/50 dark:bg-black/50 flex items-center justify-center z-50 transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {chatPanel}
    </div>
  ) : (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {chatPanel}
    </div>
  );
}
