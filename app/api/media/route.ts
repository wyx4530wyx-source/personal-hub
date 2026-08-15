import { getBindings } from "@/lib/content-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key) return new Response("Missing file", { status: 400 });
  const { DB, MEDIA } = getBindings();
  const object = await MEDIA.get(key);
  if (!object) return new Response("File not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "private, max-age=3600");
  if (url.searchParams.get("download") === "1") {
    let originalName = object.customMetadata?.originalName;
    if (!originalName) {
      const item = await DB.prepare("SELECT file_name FROM content_items WHERE file_key = ? LIMIT 1")
        .bind(key)
        .first<{ file_name: string | null }>();
      originalName = item?.file_name || "download";
    }
    headers.set("content-disposition", `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
  }
  return new Response(object.body, { headers });
}
