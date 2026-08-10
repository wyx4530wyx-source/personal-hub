import { ensureContentSchema, getBindings, listStoredContent, serializeContent, type ContentType } from "@/lib/content-store";

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

export async function GET(request: Request) {
  try {
    const typeValue = new URL(request.url).searchParams.get("type") as ContentType | null;
    const type = typeValue && allowedTypes.has(typeValue) ? typeValue : undefined;
    const items = await listStoredContent(type);
    return Response.json({ items: items.map(serializeContent) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取内容失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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

    const id = crypto.randomUUID();
    const slug = slugify(title);
    const publishedAt = new Date().toISOString().slice(0, 10);
    const createdAt = Date.now();
    const { DB } = getBindings();
    await DB.prepare(`INSERT INTO content_items
      (id, type, slug, title, description, body, cover_key, file_key, file_name, mime_type, file_size, gallery_keys, published_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, type, slug, title, description, body, coverKey, fileKey, file?.name || null, file?.type || null, file?.size || 0, JSON.stringify(galleryKeys), publishedAt, createdAt)
      .run();

    return Response.json({ ok: true, id, slug }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "上传失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "缺少内容编号" }, { status: 400 });
    await ensureContentSchema();
    const { DB, MEDIA } = getBindings();
    const item = await DB.prepare("SELECT * FROM content_items WHERE id = ?").bind(id).first<Record<string, unknown>>();
    if (!item) return Response.json({ error: "内容不存在" }, { status: 404 });
    const gallery = JSON.parse(String(item.gallery_keys || "[]")) as string[];
    const keys = [item.cover_key, item.file_key, ...gallery].filter((key): key is string => typeof key === "string" && key.length > 0);
    if (keys.length) await MEDIA.delete(keys);
    await DB.prepare("DELETE FROM content_items WHERE id = ?").bind(id).run();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "删除失败" }, { status: 500 });
  }
}
