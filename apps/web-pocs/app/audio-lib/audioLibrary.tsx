"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Search,
  Copy,
  Trash2,
  Music,
  Calendar,
  File,
  Edit2,
  Check,
  X,
  ExternalLink,
  AlertCircle,
  Bug,
  RefreshCw,
} from "lucide-react";
import {
  uploadAudio,
  deleteAudio,
  searchAudios,
  getAllAudios,
  updateAudioTitle,
  getAudioStats,
  testBlobUrl,
  debugBlobStorage,
  syncBlobUrls,
} from "./actions";
import { Metadata } from "next";

interface AudioFile {
  id: string;
  filename: string;
  title: string;
  url: string;
  downloadUrl: string;
  uploadDate: string;
  size: number;
}

interface AudioStats {
  totalFiles: number;
  totalSize: number;
}

export const metadata: Metadata = {
  title: "Audio Media Library",
  description: "Audio Library Redis + Vercel Blob",
};

export function AudioLibrary() {
  const [audios, setAudios] = useState<AudioFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [previousQuery, setPreviousQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [stats, setStats] = useState<AudioStats>({
    totalFiles: 0,
    totalSize: 0,
  });
  const [testingUrls, setTestingUrls] = useState<Set<string>>(new Set());
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadAudios();
    loadStats();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        if (!isLoading) {
          loadAudios();
        }
      }
    }, 800);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const loadAudios = async () => {
    try {
      setIsLoading(true);
      const audioList = await getAllAudios();
      setAudios(audioList);
    } catch (error) {
      console.error("Failed to load audio files:", error);
      alert("Failed to load audio files");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const audioStats = await getAudioStats();
      setStats(audioStats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleSearch = async () => {
    try {
      if (!isLoading) {
        setIsLoading(true);
        if (searchQuery !== previousQuery) {
          const results = await searchAudios(searchQuery);
          setAudios(results);
        }
        setIsLoading(false);
      }
      if (searchQuery !== previousQuery) {
        setPreviousQuery(searchQuery);
      }
    } catch (error) {
      console.error("Search failed:", error);
      alert("Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("audio") as File;

    if (!file || !title.trim()) {
      alert("Please select a file and enter a `title");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadAudio(formData);
      setTitle("");
      (e.target as HTMLFormElement).reset();
      await loadAudios();
      await loadStats();
    } catch (error) {
      console.error("Upload failed:", error);
      alert(
        `Failed to upload audio file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this audio file?")) {
      return;
    }

    try {
      await deleteAudio(id);
      await loadAudios();
      await loadStats();
      alert("Audio file deleted successfully");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete audio file");
    }
  };

  const handleEditTitle = (audio: AudioFile) => {
    setEditingId(audio.id);
    setEditTitle(audio.title);
  };

  const handleSaveTitle = async (id: string) => {
    if (!editTitle.trim()) {
      alert("Title cannot be empty");
      return;
    }

    try {
      await updateAudioTitle(id, editTitle);
      setEditingId(null);
      setEditTitle("");
      await loadAudios();
      alert("Title updated successfully");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update title");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Download URL copied to clipboard");
    } catch (error) {
      alert("Failed to copy URL");
    }
  };

  const testUrl = async (url: string, audioId: string) => {
    setTestingUrls((prev) => new Set(prev).add(audioId));
    try {
      const result = await testBlobUrl(url);
      if (result.success && "status" in result) {
        alert(`URL is accessible! Status: ${result.status}`);
      } else {
        alert(
          `URL test failed: ${
            "error" in result
              ? result.error
              : "status" in result
                ? `${result.status} ${result.statusText}`
                : "Unknown error"
          }`,
        );
      }
      console.log("Full test result:", result);
    } catch (error) {
      alert("URL test failed");
      console.error("Test error:", error);
    } finally {
      setTestingUrls((prev) => {
        const newSet = new Set(prev);
        newSet.delete(audioId);
        return newSet;
      });
    }
  };

  const handleDebug = async () => {
    try {
      const debug = await debugBlobStorage();
      setDebugInfo(debug);
      console.log("Debug info:", debug);
    } catch (error) {
      console.error("Debug failed:", error);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncBlobUrls();
      if (result.success) {
        alert(
          "message" in result ? result.message : "Sync completed successfully.",
        );
        await loadAudios(); // Reload to show updated URLs
      } else {
        alert(
          `Sync failed: ${"error" in result ? result.error : "message" in result ? result.message : "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Sync failed:", error);
      alert("Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown Date";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Unknown Date";
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Unknown Date";
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container max-w-6xl px-4 py-8 mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-4xl font-bold">Audio Library</h1>
              <p className="text-muted-foreground">
                Upload, manage, and share your audio files
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-2"
              >
                {isSyncing ? (
                  <div className="w-4 h-4 border-b border-current rounded-full animate-spin"></div>
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Sync URLs
              </Button>
              <Button
                variant="outline"
                onClick={handleDebug}
                className="flex items-center gap-2"
              >
                <Bug className="w-4 h-4" />
                Debug
              </Button>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <Badge variant="secondary">{stats.totalFiles} files</Badge>
            <Badge variant="outline">
              {formatFileSize(stats.totalSize)} total
            </Badge>
          </div>
        </div>

        {/* Debug Info */}
        {debugInfo && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">
                Debug Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">URL Mismatches:</h4>
                  {debugInfo.mismatchedUrls?.length > 0 ? (
                    <pre className="p-2 overflow-auto text-xs bg-white border rounded max-h-32">
                      {JSON.stringify(debugInfo.mismatchedUrls, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-green-600">No URL mismatches found!</p>
                  )}
                </div>
                <details>
                  <summary className="font-semibold cursor-pointer">
                    Full Debug Data
                  </summary>
                  <pre className="p-2 mt-2 overflow-auto text-xs bg-white border rounded max-h-40">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Section */}
        <Card className="mb-8 border shadow-sm border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <Upload className="w-5 h-5" />
              Upload Audio File
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="title"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Title
                  </label>
                  <Input
                    id="title"
                    name="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter audio title"
                    required
                    className="flex w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="audio"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Audio File
                  </label>
                  <Input
                    id="audio"
                    name="audio"
                    type="file"
                    accept="audio/*"
                    required
                    className="flex w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && !title) {
                        const nameWithoutExt = file.name.replace(
                          /\.[^/.]+$/,
                          "",
                        );
                        setTitle(nameWithoutExt);
                      }
                    }}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isUploading}
                className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium transition-colors rounded-md whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-b-2 border-current rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Audio
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Search Section */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <Input
              placeholder="Search by title or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Audio List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              Audio Files {searchQuery.length ? ` (${searchQuery})` : ""}
            </h2>
            <Badge variant="secondary">{audios.length} files</Badge>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-8 h-8 mx-auto mb-4 border-b-2 rounded-full animate-spin border-primary"></div>
                <p className="text-muted-foreground">Loading audio files...</p>
              </CardContent>
            </Card>
          ) : audios.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No audio files found matching your search."
                    : "No audio files uploaded yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {audios.map((audio) => (
                <Card
                  key={audio.id}
                  className="transition-colors hover:border-gray-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Music className="flex-shrink-0 w-5 h-5 text-primary" />
                          {editingId === audio.id ? (
                            <div className="flex items-center flex-1 gap-2">
                              <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="flex-1"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleSaveTitle(audio.id);
                                  } else if (e.key === "Escape") {
                                    handleCancelEdit();
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSaveTitle(audio.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center flex-1 gap-2">
                              <h3 className="text-lg font-semibold truncate">
                                {audio.title}
                              </h3>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditTitle(audio)}
                                className="w-6 h-6 p-0"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3 text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <File className="w-4 h-4" />
                            <span className="truncate">{audio.filename}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(audio.uploadDate)}</span>
                          </div>
                          <div>
                            <span>{formatFileSize(audio.size)}</span>
                          </div>
                        </div>

                        <div className="p-3 mt-4 rounded-lg bg-muted">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Download URL:
                            </span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  copyToClipboard(audio.downloadUrl)
                                }
                                className="h-8 px-3"
                                disabled={!audio.downloadUrl}
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  testUrl(audio.downloadUrl, audio.id)
                                }
                                className="h-8 px-3"
                                disabled={
                                  !audio.downloadUrl ||
                                  testingUrls.has(audio.id)
                                }
                              >
                                {testingUrls.has(audio.id) ? (
                                  <div className="w-3 h-3 mr-1 border-b border-current rounded-full animate-spin"></div>
                                ) : (
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                )}
                                Test
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  window.open(audio.downloadUrl, "_blank")
                                }
                                className="h-8 px-3"
                                disabled={!audio.downloadUrl}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Open
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(audio.id)}
                                className="h-8 px-3"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                          {audio.downloadUrl ? (
                            <code className="block p-2 mt-2 text-xs break-all border rounded text-primary bg-background">
                              {audio.downloadUrl}
                            </code>
                          ) : (
                            <div className="p-2 mt-2 text-xs border rounded text-muted-foreground bg-background">
                              No download URL available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
