import { env } from "cloudflare:workers";

export type ContentType = "post" | "video" | "download";
export type StoredContentBlock =
  | { type:"text"; text:string }
  | { type:"image"; key:string; alt:string };

export type PublicContentBlock =
  | { type:"text"; text:string }
  | { type:"image"; src:string; alt:string };

export type StoredContent = {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  description: string;
  body: string;
  coverKey: string | null;
  fileKey: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number;
  galleryKeys: string;
  contentBlocks: string;
  publishedAt: string;
  createdAt: number;
};

function bindings() {
  return env as unknown as { DB: D1Database; MEDIA: R2Bucket };
}

export function getBindings() {
  const runtime = bindings();
  if (!runtime.DB || !runtime.MEDIA) throw new Error("本地内容仓库尚未启动，请重新启动网站。");
  return runtime;
}

export async function ensureContentSchema() {
  const { DB } = getBindings();
  await DB.batch([
    DB.prepare(`CREATE TABLE IF NOT EXISTS content_items (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      cover_key TEXT,
      file_key TEXT,
      file_name TEXT,
      mime_type TEXT,
      file_size INTEGER NOT NULL DEFAULT 0,
      gallery_keys TEXT NOT NULL DEFAULT '[]',
      content_blocks TEXT NOT NULL DEFAULT '[]',
      published_at TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`),
  ]);
  const tableInfo = await DB.prepare("PRAGMA table_info(content_items)").all<{ name:string }>();
  if (!tableInfo.results.some((column) => column.name === "content_blocks")) {
    await DB.prepare("ALTER TABLE content_items ADD COLUMN content_blocks TEXT NOT NULL DEFAULT '[]'").run();
  }
  await DB.batch([
    DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_content_items_slug ON content_items(slug)"),
    DB.prepare("CREATE INDEX IF NOT EXISTS idx_content_items_type_created ON content_items(type, created_at DESC)"),
  ]);
  await DB.prepare("PRAGMA optimize").run();
}

export async function listStoredContent(type?: ContentType) {
  await ensureContentSchema();
  const { DB } = getBindings();
  const columns = `id, type, slug, title, description, body,
    cover_key AS coverKey, file_key AS fileKey, file_name AS fileName,
    mime_type AS mimeType, file_size AS fileSize, gallery_keys AS galleryKeys, content_blocks AS contentBlocks,
    published_at AS publishedAt, created_at AS createdAt`;
  const statement = type
    ? DB.prepare(`SELECT ${columns} FROM content_items WHERE type = ? ORDER BY created_at DESC`).bind(type)
    : DB.prepare(`SELECT ${columns} FROM content_items ORDER BY created_at DESC`);
  const result = await statement.all<StoredContent>();
  return result.results;
}

export async function getStoredContentBySlug(slug: string) {
  await ensureContentSchema();
  const { DB } = getBindings();
  return DB.prepare(`SELECT id, type, slug, title, description, body,
    cover_key AS coverKey, file_key AS fileKey, file_name AS fileName,
    mime_type AS mimeType, file_size AS fileSize, gallery_keys AS galleryKeys, content_blocks AS contentBlocks,
    published_at AS publishedAt, created_at AS createdAt
    FROM content_items WHERE slug = ? LIMIT 1`).bind(slug).first<StoredContent>();
}

export function mediaUrl(key: string | null, download = false) {
  if (!key) return null;
  return `/api/media?key=${encodeURIComponent(key)}${download ? "&download=1" : ""}`;
}

export function serializeContent(item: StoredContent) {
  let gallery: string[] = [];
  try { gallery = JSON.parse(item.galleryKeys || "[]") as string[]; } catch { gallery = []; }
  return {
    ...item,
    cover: mediaUrl(item.coverKey),
    file: mediaUrl(item.fileKey, item.type === "download"),
    gallery: gallery.map((key) => mediaUrl(key)).filter(Boolean),
    contentBlocks: parseContentBlocks(item.contentBlocks),
    size: formatBytes(item.fileSize),
  };
}

export function parseStoredContentBlocks(value: string | null | undefined): StoredContentBlock[] {
  try {
    const blocks = JSON.parse(value || "[]") as unknown;
    if (!Array.isArray(blocks)) return [];
    return blocks.filter((block): block is StoredContentBlock => {
      if (!block || typeof block !== "object" || !("type" in block)) return false;
      if (block.type === "text") return "text" in block && typeof block.text === "string";
      return block.type === "image" && "key" in block && typeof block.key === "string" && "alt" in block && typeof block.alt === "string";
    });
  } catch { return []; }
}

export function parseContentBlocks(value: string | null | undefined): PublicContentBlock[] {
  return parseStoredContentBlocks(value).map((block) => block.type === "text"
    ? block
    : { type:"image", src:mediaUrl(block.key) as string, alt:block.alt });
}

export function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
}
