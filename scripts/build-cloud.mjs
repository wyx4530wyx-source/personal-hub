import { rm } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { spawn } from "node:child_process";

const projectRoot = process.cwd();
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npmExecutable = process.env.npm_execpath ? process.execPath : npmCommand;
const npmArguments = process.env.npm_execpath
  ? [process.env.npm_execpath, "run", "build"]
  : ["run", "build"];

await new Promise((resolveBuild, rejectBuild) => {
  const child = spawn(npmExecutable, npmArguments, {
    cwd: projectRoot,
    env: { ...process.env, PERSONAL_HUB_CLOUD_DEPLOY: "1" },
    stdio: "inherit",
  });
  child.on("error", rejectBuild);
  child.on("exit", (code) => {
    if (code === 0) resolveBuild();
    else rejectBuild(new Error(`Cloud build failed with exit code ${code}`));
  });
});

const clientAssets = resolve(projectRoot, "dist", "client");
const generatedHeroCopy = resolve(clientAssets, "videos", "whale-fall-background.mp4");
const generatedRelativePath = relative(clientAssets, generatedHeroCopy);
if (generatedRelativePath.startsWith("..") || generatedRelativePath === "") {
  throw new Error("Refusing to remove a path outside the generated client assets directory");
}

await rm(generatedHeroCopy, { force: true });
