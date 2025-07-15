"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, FileUIPart } from "ai";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { ImageIcon, Loader2, Paperclip, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Page() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/changelog",
    }),
  });
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<FileUIPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  return (
    <div className="max-w-4xl p-4 mx-auto changelog-bot">
      <h1 className="mb-4 text-2xl font-bold">
        {"AI Bot (Vercel Changelog RAG)"}
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input, files: attachments });
            setInput("");
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
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-4 flex flex-col-reverse">
        {messages.map((message) => (
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
                      <span style={{ color: "red" }}>(Generating Imagee)</span>
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
                default:
                  return null;
              }
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
