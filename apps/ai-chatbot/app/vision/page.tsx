"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/image-uploader";
import { ChatInterface } from "@/components/chat-interface";
import { analyzeImage } from "@/lib/ai/vision";
import { Card } from "@/components/ui/card";
import { Info, AlertTriangle, ImageIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ImageAnalysis() {
  const [image, setImage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSendMessage = async (question: string) => {
    if (!image) {
      throw new Error("Please upload an image first");
    }

    try {
      setApiError(null);
      const result = await analyzeImage(image, question);
      return result;
    } catch (error: any) {
      console.error("Error analyzing image:", error);

      // Check if it's a quota error
      if (
        error.message?.includes("quota") ||
        error.message?.includes("billing")
      ) {
        setApiError(error.message);
      }

      throw error;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Image Analysis with AI
      </h1>

      {apiError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>API Error</AlertTitle>
          <AlertDescription>
            {apiError}
            <div className="mt-2">
              <p className="text-sm">To resolve this issue:</p>
              <ul className="list-disc list-inside text-sm ml-2 mt-1">
                <li>Check your OpenAI account billing status</li>
                <li>Upgrade your OpenAI plan if you're on a free tier</li>
                <li>Wait until your usage quota resets</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 h-full">
          <h2 className="text-xl font-semibold mb-4">Upload Image</h2>
          <ImageUploader onImageChange={setImage} className="mb-4" />

          {!image ? (
            <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50 text-blue-700 rounded-md">
              <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                Upload an image to start asking questions about it. The AI can
                analyze the content, identify objects, read text, and understand
                the context of the image.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 mt-4 p-3 bg-green-50 text-green-700 rounded-md">
              <ImageIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Image uploaded successfully!</p>
                <p className="mt-1">Try asking questions like:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>What can you see in this image?</li>
                  <li>Describe the main elements in this picture.</li>
                  <li>What text appears in this image?</li>
                  <li>What colors are dominant in this image?</li>
                </ul>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-4 h-[600px] flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Ask Questions</h2>
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              onSendMessage={handleSendMessage}
              disabled={!image}
            />
          </div>
        </Card>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Powered by Vercel AI SDK and OpenAI GPT-4 Vision. Upload any image and
          ask questions to get AI-powered insights.
        </p>
      </div>
    </div>
  );
}
