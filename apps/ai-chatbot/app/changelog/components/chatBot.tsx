"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, FileUIPart } from "ai";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { ImageIcon, Loader2, Paperclip, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Prism from "prismjs";
import "prismjs/themes/prism-okaidia.css";
import "prismjs/components/prism-typescript";

// Storage keys
const STORAGE_KEYS = {
  MESSAGES: "changelog-chat-messages",
  ATTACHMENTS: "changelog-chat-attachments",
  INPUT: "changelog-chat-input",
  SESSION_ID: "changelog-chat-session-id",
};

function PrismLoader() {
  useEffect(() => {
    Prism.highlightAll();
  }, []);

  return <div className="hidden"></div>;
}

export function ChatBot() {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<FileUIPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Create a custom transport that extends DefaultChatTransport with error handling
  const customTransport = new DefaultChatTransport({
    api: "/api/changelog",
    async fetch(url, options) {
      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`;
          setError(errorMessage);
          throw new Error(errorMessage);
        }

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        throw err;
      }
    },
  });

  // Initialize chat with persistence and custom transport
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: customTransport,
  });

  // Initialize chat state from localStorage
  useEffect(() => {
    // More reliable reload detection using multiple methods
    const isHardReload = (() => {
      // Method 1: Check if this is a fresh page load (not navigation)
      if (typeof window !== "undefined" && window.performance) {
        const navigation = window.performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming;
        if (navigation && navigation.type === "reload") {
          return true;
        }
      }

      // Method 2: Check if session storage has a flag (set on beforeunload)
      const wasReloading = sessionStorage.getItem("chat-reloading");
      if (wasReloading === "true") {
        sessionStorage.removeItem("chat-reloading");
        return true;
      }

      // Method 3: Check if we have a session ID mismatch
      const currentSessionId = sessionStorage.getItem("chat-session-id");
      const storedSessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);

      if (!currentSessionId) {
        // First time visit, generate session ID
        const newSessionId = Date.now().toString();
        sessionStorage.setItem("chat-session-id", newSessionId);
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, newSessionId);
        return false;
      }

      if (currentSessionId !== storedSessionId) {
        // Session ID mismatch indicates a reload
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, currentSessionId);
        return true;
      }

      return false;
    })();

    if (isHardReload) {
      // Clear all chat storage on hard reload
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      localStorage.removeItem(STORAGE_KEYS.ATTACHMENTS);
      localStorage.removeItem(STORAGE_KEYS.INPUT);
      console.log("Hard reload detected - cleared chat history");
    } else {
      // Load saved state from localStorage
      setIsRestoring(true);
      try {
        const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
        const savedAttachments = localStorage.getItem(STORAGE_KEYS.ATTACHMENTS);
        const savedInput = localStorage.getItem(STORAGE_KEYS.INPUT);

        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          setMessages(parsedMessages);
        }

        if (savedAttachments) {
          const parsedAttachments = JSON.parse(savedAttachments);
          setAttachments(parsedAttachments);
        }

        if (savedInput) {
          setInput(savedInput);
        }
      } catch (error) {
        console.error("Error loading chat state from localStorage:", error);
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEYS.MESSAGES);
        localStorage.removeItem(STORAGE_KEYS.ATTACHMENTS);
        localStorage.removeItem(STORAGE_KEYS.INPUT);
      } finally {
        setIsRestoring(false);
      }
    }

    setIsInitialized(true);

    // Add beforeunload listener to set a flag for hard reload detection
    const handleBeforeUnload = () => {
      sessionStorage.setItem("chat-reloading", "true");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [setMessages]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (isInitialized && messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
      } catch (error) {
        console.error("Error saving messages to localStorage:", error);
      }
    }
  }, [messages, isInitialized]);

  // Save attachments to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(
          STORAGE_KEYS.ATTACHMENTS,
          JSON.stringify(attachments),
        );
      } catch (error) {
        console.error("Error saving attachments to localStorage:", error);
      }
    }
  }, [attachments, isInitialized]);

  // Save input to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEYS.INPUT, input);
      } catch (error) {
        console.error("Error saving input to localStorage:", error);
      }
    }
  }, [input, isInitialized]);

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    const data = await response.json();
    return data.url;
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      setIsUploading(true);
      try {
        const newAttachments: FileUIPart[] = [];

        for (const file of Array.from(event.target.files)) {
          if (file.type.startsWith("image/")) {
            const url = await uploadFile(file);
            newAttachments.push({
              type: "file",
              filename: file.name,
              url: url,
              mediaType: file.type,
            });
          }
        }

        setAttachments([...attachments, ...newAttachments]);
      } catch (err) {
        console.error("Error uploading files:", err);
        setError("Failed to upload one or more files. Please try again.");
      } finally {
        setIsUploading(false);
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const clearAttachments = () => {
    setAttachments([]);
  };

  const clearChatHistory = () => {
    setMessages([]);
    setAttachments([]);
    setInput("");
    setError(null); // Clear any errors when clearing chat
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.ATTACHMENTS);
    localStorage.removeItem(STORAGE_KEYS.INPUT);
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    sessionStorage.removeItem("chat-reloading");
    sessionStorage.removeItem("chat-session-id");
  };
  return (
    <div className="max-w-4xl p-4 mx-auto changelog-bot">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {"AI Bot (Vercel Changelog RAG)"}
        </h1>
        {messages.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearChatHistory}
            className="text-sm"
          >
            Clear Chat
          </Button>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            // Clear any previous errors when sending a new message
            setError(null);
            sendMessage({ text: input, files: attachments });
            setInput("");
            // Clear input from localStorage after sending
            localStorage.removeItem(STORAGE_KEYS.INPUT);
          }
        }}
        className="mb-4 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status !== "ready"}
            placeholder="Try saying 'latest performance improvements launched by Vercel'..."
            className="flex-1 w-full p-2 border-2 border-gray-300 rounded-md"
            type="text"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            multiple
          />
        </div>
        {attachments.length > 0 && (
          <div className="p-2 border rounded-md bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Attached Files</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAttachments}
                className="h-6 px-2"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <div key={index} className="relative group">
                  <div className="flex items-center gap-1 p-1 text-xs bg-white border rounded">
                    <ImageIcon className="w-3 h-3" />
                    <span className="max-w-[150px] truncate">
                      {attachment.filename}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="w-4 h-4 p-0 ml-1 opacity-50 hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="absolute left-0 z-10 hidden p-1 bg-black rounded group-hover:block top-6 bg-opacity-80">
                    <img
                      src={attachment.url || "/placeholder.svg"}
                      alt={attachment.filename || `preview-${index}`}
                      className="max-w-[150px] max-h-[150px] rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={status !== "ready"}
            className="w-full"
          >
            {" "}
            {status !== "ready" ? "Generating..." : "Generate with AI"}
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            multiple
          />
        </div>
      </form>
      {isRestoring && (
        <Alert className="mb-4">
          <AlertTitle>Restoring Chat</AlertTitle>
          <AlertDescription>
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Restoring your previous conversation...
            </div>
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-4 flex flex-col-reverse">
        {messages.map((message) => {
          let extraReferences = "";
          let changelogExtract = "";
          message.parts.forEach((part) => {
            if (part.type === "tool-getExtraReferences" && part.output) {
              extraReferences += part.output + "\n";
            }
          });
          return (
            <div
              key={message.id}
              className={`p-6 pb-6 pt-4 mt-6 border rounded  ${message.role === "user" ? "text-blue-900 ml-8" : "text-gray-800 mr-8 bg-blue-100"}`}
            >
              <p className="font-semibold mb-2">
                {message.role === "user" ? "You:" : "Assistant:"}
              </p>
              {message.parts.map((part, index) => {
                switch (part.type) {
                  case "text":
                    return (
                      <div key={index} className={`block`}>
                        <ReactMarkdown>{part.text}</ReactMarkdown>
                      </div>
                    );
                  case "tool-echo":
                    return (
                      <span key={index}>
                        <span style={{ color: "red" }}>(echoing)</span>{" "}
                        <ReactMarkdown components={{ p: "span" }}>
                          {part.output + ""}
                        </ReactMarkdown>
                      </span>
                    );
                  case "tool-createImage":
                    console.log(part.state, message);
                    return (
                      <span key={index}>
                        <span style={{ color: "red" }}>
                          (Generating Imagee)
                        </span>
                        <img
                          src={part.output + "" || "/placeholder.svg"}
                          alt="Generated content"
                          className="mt-2 rounded"
                          width={500}
                          height={500}
                        />
                      </span>
                    );
                  case "tool-modifyImage":
                    console.log(part.state, message);
                    return (
                      <span key={index}>
                        <span style={{ color: "red" }}>(Modifying Image)</span>
                        <img
                          src={part.output + "" || "/placeholder.svg"}
                          alt="Generated content"
                          className="mt-2 rounded"
                          width={500}
                          height={500}
                        />
                      </span>
                    );
                  case "tool-getExtraReferences":
                    return (
                      <ReactMarkdown key={index} components={{ p: "span" }}>
                        {extraReferences + ""}
                      </ReactMarkdown>
                    );
                  case "tool-getBlogs":
                    // Usage for Blogs
                    return (
                      <div key={`${index}-blogs`}>
                        {renderToolOutput(
                          part,
                          index,
                          "Blogs",
                          "https://vercel.com/blog/",
                        )}
                      </div>
                    );
                    break;
                  case "tool-getGuides":
                    // Usage for Guides
                    return (
                      <div key={`${index}-guides`}>
                        {renderToolOutput(
                          part,
                          index,
                          "Guides",
                          "https://vercel.com/guides/",
                        )}
                      </div>
                    );
                    break;
                  case "tool-getDocs":
                    // Usage for Docs
                    return (
                      <div key={`${index}-docs`}>
                        {renderToolOutput(
                          part,
                          index,
                          "Docs",
                          "https://vercel.com/docs/",
                        )}
                      </div>
                    );
                    break;
                  case "tool-getChangelogs":
                    // console.log(">>>partChangelogs", part);
                    // Handle changelog tool response
                    if (part.errorText) {
                      return (
                        <div key={index}>
                          <span style={{ color: "red" }}>{part.errorText}</span>
                        </div>
                      );
                    }
                    if (part.output) {
                      // The output is the final text from the tool
                      if (part.state === "output-available") {
                        if ((part.output as any).steps) {
                          changelogExtract += (part.output as any).steps
                            .map((step: any) =>
                              step.content
                                .map((content: any) => content.text)
                                .join("\n"),
                            )
                            .join("\n");
                        } else {
                          changelogExtract += part.output + "";
                        }
                      }
                      return (
                        <div key={index}>
                          <ReactMarkdown>{changelogExtract}</ReactMarkdown>
                        </div>
                      );
                    } else {
                      // Show loading state when output is not yet available
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating changelog response...</span>
                        </div>
                      );
                    }

                  default:
                    console.log(">>>part", part);
                    return null;
                }
              })}
            </div>
          );
        })}
      </div>
      <PrismLoader />
    </div>
  );
}

const renderToolOutput = (
  part: any,
  index: number,
  type: string,
  urlPrefix: string,
) => {
  console.log(">>>Tool", part);
  if (part.errrText) {
    return (
      <div key={index}>
        <span style={{ color: "red" }}>{part.errorText}</span>
      </div>
    );
  }
  let stringResults = "";
  if (part.state === "output-available") {
    // The output is the final text from the tool
    if (part.state === "output-available") {
      if (part.output.steps) {
        const filteredResults = (part.output as any).steps
          .map((step: any) =>
            step.content.filter(
              (content: any) =>
                content.type === "source" && content.url.startsWith(urlPrefix),
            ),
          )
          .flat();

        console.log(">>>Filtered Results", filteredResults);
        if (filteredResults.length > 0) {
          stringResults +=
            `## ${type} Extract\n` +
            filteredResults
              .map((content: any) => `- [${content.url}](${content.url})`)
              .join("\n");
        } else {
          stringResults += `## ${type} Extract\n - No results found.`;
        }
      } else {
        stringResults += part.output + "";
      }
    }
    return (
      <div key={index}>
        <ReactMarkdown>{stringResults}</ReactMarkdown>
      </div>
    );
  } else {
    // Show loading state when output is not yet available
    return (
      <div key={index} className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Generating {type} response...</span>
      </div>
    );
  }
};
