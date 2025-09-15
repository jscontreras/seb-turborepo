import { Metadata } from "next";
import { AudioLibrary } from "./audioLibrary";

export const metadata: Metadata = {
  title: "Audio Media Library",
  description: "Audio Library Redis + Vercel Blob",
};

export default function AudioLibraryPage() {
  return <AudioLibrary />;
}
