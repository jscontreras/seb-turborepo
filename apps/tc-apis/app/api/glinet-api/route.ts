import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    // Get the path to the content.html file
    const filePath = path.join(
      process.cwd(),
      "public",
      "files",
      "content.html",
    );

    // Read the file content
    const fileContent = await fs.readFile(filePath, "utf8");

    // Return the content as plain text
    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
