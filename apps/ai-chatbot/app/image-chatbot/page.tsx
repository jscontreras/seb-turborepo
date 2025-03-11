"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();
      setImageData(data.imageData);
    } catch (error) {
      console.error("Image generation error:", error);
      setError(
        "An error occurred while generating the image. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-bold">AI Image Generator</h1>

      <form onSubmit={handleSubmit} className="mb-4">
        <Input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your image prompt..."
          className="mb-2"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Image"}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {imageData && (
        <div className="mt-4">
          <img
            src={imageData}
            alt="Generated image"
            className="w-full rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
