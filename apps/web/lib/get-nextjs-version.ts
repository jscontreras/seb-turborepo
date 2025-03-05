import { readFile } from "fs/promises"
import { resolve } from "path"

export async function getNextJsVersion(): Promise<string> {
  try {
    // Try to read the package.json file
    const packageJsonPath = resolve(process.cwd(), "package.json")
    const packageJsonContent = await readFile(packageJsonPath, "utf-8")
    const packageJson = JSON.parse(packageJsonContent)

    // Get the Next.js version from dependencies or devDependencies
    const nextVersion = packageJson.dependencies?.next || packageJson.devDependencies?.next || "Not installed"

    return nextVersion
  } catch (error) {
    console.error("Error reading Next.js version:", error)
    return "Error reading version"
  }
}

