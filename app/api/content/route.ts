import { ensureContentSchema, getBindings, listStoredContent, parseStoredContentBlocks, serializeContent, type ContentType, type StoredContentBlock } from "@/lib/content-store";
import { isAdminRequest } from "@/lib/admin-auth";
import { isAdminAccessAllowed } from "@/lib/admin-access-server";

const allowedTypes = new Set<ContentType>(["post", "video", "download"]);

function slugify(value: string) {
  const ascii = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${ascii || "content"}-${Date.now().toString(36)}`;
}

function safeName(name: string) {
  const extension = name.includes(".") ? `.${name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "")}` : "";
  return `${crypto.randomUUID()}${extension.toLowerCase()}`;
}

async function storeFile(file: File | null) {
  if (!file || file.size === 0) return null;
  const { MEDIA } = getBindings();
  const key = safeName(file.name);
  await MEDIA.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
    customMetadata: { originalName: file.name },
  });
  return key;
}

type IncomingContentBlock =
  | { type:"text"; text:string }
  | { type:"image"; field:string; alt:string };

function readIncomingBlocks(value: FormDataEntryValue | null): IncomingContentBlock[] {
  if (typeof value !== "string" || !value) return [];
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed) || parsed.length > 50) throw new Error("一篇帖子最多添加 50 个内容块");
  return parsed.filter((block): block is IncomingContentBlock => {
    if (!block || typeof block !== "object" || !("type" in block)) return false;
    if (block.type === "text") return "text" in block && typeof block.text === "string";
    return block.type === "image" && "field" in block && typeof block.field === "string" && "alt" in block && typeof block.alt === "string";
  });
}

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    if (searchParams.get("admin") === "1" && !isAdminAccessAllowed(request.headers)) return Response.json({ error:"后台管理尚未在此地址启用" }, { status:403 });
    if (searchParams.get("admin") === "1" && !await isAdminRequest(request)) return Response.json({ error:"请先登录" }, { status:401 });
    const typeValue = searchParams.get("type") as ContentType | null;
    const type = typeValue && allowedTypes.has(typeValue) ? typeValue : undefined;
    const items = await listStoredContent(type);
    return Response.json({ items: items.map(serializeContent) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取内容失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdminAccessAllowed(request.headers)) return Response.json({ error:"后台管理尚未在此地址启用" }, { status:403 });
    if (!await isAdminRequest(request)) return Response.json({ error:"登录状态已失效，请重新登录" }, { status:401 });
    const form = await request.formData();
    const type = String(form.get("type") || "") as ContentType;
    const title = String(form.get("title") || "").trim();
    const description = String(form.get("description") || "").trim();
    const body = String(form.get("body") || "").trim();
    if (!allowedTypes.has(type)) return Response.json({ error: "请选择内容类型" }, { status: 400 });
    if (!title) return Response.json({ error: "请填写标题或文件名称" }, { status: 400 });

    const file = form.get("file") instanceof File ? form.get("file") as File : null;
    const cover = form.get("cover") instanceof File ? form.get("cover") as File : null;
    if ((type === "video" || type === "download") && !file) return Response.json({ error: "请选择需要上传的文件" }, { status: 400 });
    if (file && file.size > 250 * 1024 * 1024) return Response.json({ error: "单个文件请不要超过 250 MB" }, { status: 400 });

    await ensureContentSchema();
    const fileKey = await storeFile(file);
    const coverKey = await storeFile(cover);
    const galleryFiles = form.getAll("gallery").filter((value): value is File => value instanceof File && value.size > 0);
    const galleryKeys: string[] = [];
    for (const image of galleryFiles.slice(0, 12)) {
      const key = await storeFile(image);
      if (key) galleryKeys.push(key);
    }

    const incomingBlocks = type === "post" ? readIncomingBlocks(form.get("contentBlocks")) : [];
    const contentBlocks: StoredContentBlock[] = [];
    let blockImageCount = 0;
    for (const block of incomingBlocks) {
      if (block.type === "text") {
        const text = block.text.trim();
        if (text) contentBlocks.push({ type:"text", text });
        continue;
      }
      if (++blockImageCount > 20) return Response.json({ error:"一篇帖子最多添加 20 张正文图片" }, { status:400 });
      const image = form.get(block.field);
      if (!(image instanceof File) || image.size === 0) continue;
      if (!image.type.startsWith("image/")) return Response.json({ error:"正文图片的文件格式不正确" }, { status:400 });
      if (image.size > 25 * 1024 * 1024) return Response.json({ error:"每张正文图片请不要超过 25 MB" }, { status:400 });
      const key = await storeFile(image);
      if (key) contentBlocks.push({ type:"image", key, alt:block.alt.slice(0, 200) });
    }
    if (type === "post" && !contentBlocks.length && !body) return Response.json({ error:"请至少添加一段文字或一张图片" }, { status:400 });

    const id = crypto.randomUUID();
    const slug = slugify(title);
    const publishedAt = new Date().toISOString().slice(0, 10);
    const createdAt = Date.now();
    const { DB } = getBindings();
    await DB.prepare(`INSERT INTO content_items
      (id, type, slug, title, description, body, cover_key, file_key, file_name, mime_type, file_size, gallery_keys, content_blocks, published_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, type, slug, title, description, body, coverKey, fileKey, file?.name || null, file?.type || null, file?.size || 0, JSON.stringify(galleryKeys), JSON.stringify(contentBlocks), publishedAt, createdAt)
      .run();

    return Response.json({ ok: true, id, slug }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "上传失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isAdminAccessAllowed(request.headers)) return Response.json({ error:"后台管理尚未在此地址启用" }, { status:403 });
    if (!await isAdminRequest(request)) return Response.json({ error:"登录状态已失效，请重新登录" }, { status:401 });
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "缺少内容编号" }, { status: 400 });
    await ensureContentSchema();
    const { DB, MEDIA } = getBindings();
    const item = await DB.prepare("SELECT * FROM content_items WHERE id = ?").bind(id).first<Record<string, unknown>>();
    if (!item) return Response.json({ error: "内容不存在" }, { status: 404 });
    const gallery = JSON.parse(String(item.gallery_keys || "[]")) as string[];
    const blockImages = parseStoredContentBlocks(String(item.content_blocks || "[]")).filter((block) => block.type === "image").map((block) => block.key);
    const keys = [item.cover_key, item.file_key, ...gallery, ...blockImages].filter((key): key is string => typeof key === "string" && key.length > 0);
    if (keys.length) await MEDIA.delete(keys);
    await DB.prepare("DELETE FROM content_items WHERE id = ?").bind(id).run();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "删除失败" }, { status: 500 });
  }
}
