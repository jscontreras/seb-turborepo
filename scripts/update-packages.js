import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Function to execute shell commands
const execCommand = (command, cwd) => {
  try {
    console.log(`Executing: ${command} in ${cwd}`);
    const output = execSync(command, { cwd, stdio: 'pipe' }).toString();
    console.log(`Command output: ${output}`);
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
};

// Function to find all package.json files in the monorepo
async function findPackageJsonFiles(rootDir) {
  const packagesDir = path.join(rootDir, 'packages');

  try {
    // Check if packages directory exists
    await fs.access(packagesDir);

    // Get all directories in the packages folder
    const packageDirs = await fs.readdir(packagesDir);

    // Find all package.json files
    const packageJsonFiles = [];

    for (const dir of packageDirs) {
      const packageDir = path.join(packagesDir, dir);
      const stats = await fs.stat(packageDir);

      if (stats.isDirectory()) {
        const packageJsonPath = path.join(packageDir, 'package.json');

        try {
          await fs.access(packageJsonPath);
          packageJsonFiles.push({
            path: packageJsonPath,
            dir: packageDir
          });
        } catch (error) {
          // package.json doesn't exist in this directory, skip
        }
      }
    }

    // Also check for package.json in apps directory if it exists
    const appsDir = path.join(rootDir, 'apps');
    try {
      await fs.access(appsDir);
      const appDirs = await fs.readdir(appsDir);

      for (const dir of appDirs) {
        const appDir = path.join(appsDir, dir);
        const stats = await fs.stat(appDir);

        if (stats.isDirectory()) {
          const packageJsonPath = path.join(appDir, 'package.json');

          try {
            await fs.access(packageJsonPath);
            packageJsonFiles.push({
              path: packageJsonPath,
              dir: appDir
            });
          } catch (error) {
            // package.json doesn't exist in this directory, skip
          }
        }
      }
    } catch (error) {
      // apps directory doesn't exist, continue
    }

    return packageJsonFiles;
  } catch (error) {
    console.error('Error finding package.json files:', error.message);
    return [];
  }
}

// Main function
async function main() {
  // Get the current directory (should be the turborepo root)
  const rootDir = process.cwd();
  console.log(`Running from turborepo root: ${rootDir}`);

  // Find all package.json files
  const packageJsonFiles = await findPackageJsonFiles(rootDir);
  console.log(`Found ${packageJsonFiles.length} packages`);

  // Process each package
  for (const { path: packageJsonPath, dir } of packageJsonFiles) {
    try {
      console.log(`\nProcessing package: ${packageJsonPath}`);

      // Read and parse package.json
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);

      // Check for dependencies
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      // Check if next is a dependency
      const hasNext = dependencies && 'next' in dependencies;

      // Check if any @vercel/* packages are dependencies
      const hasVercelDeps = dependencies &&
        Object.keys(dependencies).some(dep => dep.startsWith('@vercel/'));

      // Update next to canary if it exists
      if (hasNext) {
        console.log(`Package has next.js dependency. Updating to canary...`);
        execCommand('pnpm update next@canary', dir);
      } else {
        console.log('Package does not have next.js dependency. Skipping next update.');
      }

      // Update @vercel/* packages if they exist
      if (hasVercelDeps) {
        console.log(`Package has @vercel/* dependencies. Updating...`);
        execCommand('pnpm update "@vercel/*"', dir);
      } else {
        console.log('Package does not have @vercel/* dependencies. Skipping @vercel update.');
      }

    } catch (error) {
      console.error(`Error processing package ${packageJsonPath}:`, error.message);
    }
  }

  console.log('\nPackage update process completed!');
}

// Run the script
main().catch(error => {
  console.error('Error running script:', error);
  process.exit(1);
});