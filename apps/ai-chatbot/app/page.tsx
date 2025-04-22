"use client";

import React, { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TextGenerator() {
  const [error, setError] = useState<string | null>(null);

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

  const handleTextPromptSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setError(null);
    try {
      await handleSubmit(e);
    } catch (error) {
      console.error("Submission error:", error);
      setError("Failed to submit the request. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl p-4 mx-auto">
      <h1 className="mb-4 text-2xl font-bold">AI Text Generator</h1>

      <form onSubmit={handleTextPromptSubmit} className="mb-4">
        <Input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Try saying 'echo hello world'..."
          className="mb-2"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Text"}
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
          console.log(m);
          return (
            <div key={m.id} className="p-4 border rounded">
              <p className="mb-2 font-semibold">
                {m.role === "user" ? "You:" : "Assistant:"}
              </p>

              {m.role === "user" ? (
                <p>{m.content}</p>
              ) : (
                <div>
                  {/* Show content if it exists */}
                  {m.content && <p className="mb-2">{m.content}</p>}

                  {/* Show tool calls */}
                  {m.parts && m.parts.length > 0 && (
                    <div className="p-3 mb-2 bg-gray-100 rounded">
                      <p className="font-medium text-gray-700">Part Details:</p>
                      {m.parts.map(
                        (
                          part: {
                            type:
                              | "text"
                              | "reasoning"
                              | "tool-invocation"
                              | "source"
                              | "step-start";
                            [key: string]: any;
                          },
                          index,
                        ) => {
                          switch (part.type) {
                            case "step-start":
                              return null;
                            case "tool-invocation":
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
                                    {part.toolInvocation.toolName}
                                  </p>
                                  <p>
                                    <strong>Arguments:</strong>{" "}
                                    {JSON.stringify(
                                      part.toolInvocation.args,
                                      null,
                                      2,
                                    )}
                                  </p>
                                  <p>
                                    <strong>Result:</strong>{" "}
                                    {part.toolInvocation.result}
                                  </p>
                                </div>
                              );
                            case "text":
                              return (
                                <div
                                  key={index}
                                  className="p-2 bg-gray-100 rounded"
                                >
                                  <p className="text-gray-700">{part.text}</p>
                                </div>
                              );
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
                        },
                      )}
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
