"use client";

import React, { useState } from "react";
import { useChat } from "ai/react";
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
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-bold">AI Text Generator</h1>

      <form onSubmit={handleTextPromptSubmit} className="mb-4">
        <Input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Enter your prompt..."
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
        {messages.map((m) => (
          <div key={m.id} className="rounded border p-4">
            {m.role === "user" ? (
              <p className="font-semibold">{m.content}</p>
            ) : m.role === "assistant" ? (
              <div>
                <p className="mb-2">{m.content}</p>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
