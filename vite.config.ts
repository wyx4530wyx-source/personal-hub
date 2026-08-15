import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";
const PERSONAL_HUB_DATABASE_ID = "7f7ee15d-682d-4a37-8dd5-78beba595132";
const isCloudDeployment = process.env.PERSONAL_HUB_CLOUD_DEPLOY === "1";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  name: isCloudDeployment ? "personal-hub" : "ibuki-personal-hub",
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  vars: isCloudDeployment ? { ADMIN_PUBLIC_ENABLED: "true" } : {},
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: isCloudDeployment ? "personal-hub-db" : "site-creator-d1",
          database_id: isCloudDeployment
            ? PERSONAL_HUB_DATABASE_ID
            : SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: isCloudDeployment ? "personal-hub-media" : "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: isCodexSeatbeltSandbox
      ? {
          allowedHosts: [".trycloudflare.com"],
          watch: { useFsEvents: false, usePolling: true },
        }
      : { allowedHosts: [".trycloudflare.com"] },
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
