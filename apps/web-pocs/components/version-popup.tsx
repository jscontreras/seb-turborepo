import { getNextJsVersion } from "@/lib/get-nextjs-version";

export async function VersionPopup() {
  let version = "Unknown";

  try {
    version = await getNextJsVersion();
  } catch (error) {
    console.error("Failed to get Next.js version:", error);
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white text-xs px-3 py-1.5 rounded-full shadow-md z-50 opacity-80 hover:opacity-100 transition-opacity">
      Next.js v{version}
    </div>
  );
}
