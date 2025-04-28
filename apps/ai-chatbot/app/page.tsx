/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ImageIcon, Loader2, Paperclip, X } from "lucide-react";
import type { Attachment } from "@ai-sdk/ui-utils";

type Part = {
  type: string;
  toolInvocation?: {
    toolName: string;
    args: Record<string, unknown>;
    result?: string;
  };
};

export default function TextGenerator() {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      onError: (error) => {
        console.error("Chat error:", error);
        setError(
          "An error occurred while generating the text. Please try again.",
        );
      },
    });

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
        const newAttachments: Attachment[] = [];

        for (const file of Array.from(event.target.files)) {
          if (file.type.startsWith("image/")) {
            const url = await uploadFile(file);
            newAttachments.push({
              name: file.name,
              url: url,
              contentType: file.type,
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

  const handleTextPromptSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setError(null);

    try {
      await handleSubmit(e, {
        experimental_attachments:
          attachments.length > 0 ? attachments : undefined,
      });
      // Clear attachments after submission
      setAttachments([]);
    } catch (error) {
      console.error("Submission error:", error);
      setError("Failed to submit the request. Please try again.");
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

  return (
    <div className="max-w-2xl p-4 mx-auto">
      <h1 className="mb-4 text-2xl font-bold">{"AI Generator (with tools)"}</h1>
      <form onSubmit={handleTextPromptSubmit} className="mb-4 space-y-4">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Try saying 'echo hello world' or 'modify this image'..."
            className="flex-1"
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
                      {attachment.name}
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
                      alt={attachment.name || `preview-${index}`}
                      className="max-w-[150px] max-h-[150px] rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || isUploading}
          className="w-full"
        >
          {isLoading ? "Generating..." : "Generate with AI"}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {messages.map((m) => {
          return (
            <div key={m.id} className="p-4 border rounded">
              <p className="mb-2 font-semibold">
                {m.role === "user" ? "You:" : "Assistant:"}
              </p>
              {m.role === "user" ? (
                <div>
                  <p>{m.content}</p>
                  {/* Display user-attached images */}
                  <div className="mt-2 space-y-2">
                    {m.experimental_attachments
                      ?.filter((attachment) =>
                        attachment.contentType?.startsWith("image/"),
                      )
                      .map((attachment, index) => (
                        <div key={`${m.id}-${index}`} className="mt-2">
                          <img
                            src={attachment.url || "/placeholder.svg"}
                            alt={attachment.name ?? `attachment-${index}`}
                            className="max-w-full rounded-md"
                            style={{ maxHeight: "300px" }}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div>
                  {m.content && (
                    <p className="mb-2">{cleanMessages(m.content)}</p>
                  )}
                  {/* Display AI-generated images from tool calls */}
                  {m.parts &&
                    m.parts.length > 0 &&
                    m.parts.some((part) => part.type === "tool-invocation") && (
                      <div className="p-3 mb-2 bg-gray-100 rounded">
                        {m.parts.some(
                          (part) => part.type === "tool-invocation",
                        ) && (
                          <p className="font-medium text-gray-700">
                            Part Details:
                          </p>
                        )}
                        {m.parts.map((part: Part, index) => {
                          switch (part.type) {
                            case "step-start":
                              return null;
                            case "tool-invocation":
                              if (
                                ["createImage", "modifyImage"].includes(
                                  part.toolInvocation?.toolName || "",
                                ) &&
                                typeof part.toolInvocation?.result ===
                                  "string" &&
                                part.toolInvocation?.result.startsWith("http")
                              ) {
                                return (
                                  <div
                                    key={index}
                                    className="p-2 bg-blue-100 rounded"
                                  >
                                    <p className="font-medium text-blue-700">
                                      Generated Image:
                                    </p>
                                    <img
                                      src={
                                        part.toolInvocation.result ||
                                        "/placeholder.svg"
                                      }
                                      alt="Generated content"
                                      className="mt-2 rounded"
                                      width={500}
                                      height={500}
                                    />
                                  </div>
                                );
                              }
                              return (
                                <div
                                  key={index}
                                  className="p-2 bg-green-100 rounded"
                                >
                                  <p className="font-medium text-green-700">
                                    Tool Invocation:
                                  </p>
                                  <p>
                                    <strong>Tool Name:</strong>{" "}
                                    {part.toolInvocation?.toolName ||
                                      "Unknown Tool"}
                                  </p>
                                  <p>
                                    <strong>Arguments:</strong>{" "}
                                    {JSON.stringify(
                                      part.toolInvocation?.args || {},
                                      null,
                                      2,
                                    )}
                                  </p>
                                  <p>
                                    <strong>Result:</strong>{" "}
                                    {part.toolInvocation?.result || "Unknown"}
                                  </p>
                                </div>
                              );
                            case "text":
                              return null;
                            default:
                              return (
                                <div
                                  key={index}
                                  className="p-2 bg-red-100 rounded"
                                >
                                  <p className="font-medium text-red-700">
                                    Unknown part type
                                  </p>
                                </div>
                              );
                          }
                        })}
                      </div>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function cleanMessages(content: string): React.ReactNode {
  const regex = /!\[.*\]\(.*\)/gm;
  // Replace any potentially harmful or unwanted HTML tags with safe text
  const sanitizedContent = content.replace(regex, "");

  // Remove URLs enclosed in parentheses
  const contentWithoutUrls = sanitizedContent.replace(
    /$$https?:\/\/[^\s)]+$$/g,
    "",
  );

  // Convert newlines into <br /> tags for proper formatting
  const formattedContent = contentWithoutUrls.split("\n").map((line, index) => (
    <React.Fragment key={index}>
      {line}
      <br />
    </React.Fragment>
  ));

  return formattedContent;
}
