import { getBindings } from "@/lib/content-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key) return new Response("Missing file", { status: 400 });
  const { DB, MEDIA } = getBindings();
  const rangeHeader = request.headers.get("range");
  const object = await MEDIA.get(key, rangeHeader ? { range: request.headers } : undefined);
  if (!object) return new Response("File not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "private, max-age=3600");
  let status = 200;
  if (rangeHeader && object.range) {
    const range = object.range as { offset?:number; length?:number; suffix?:number };
    const start = range.offset ?? Math.max(0, object.size - (range.suffix ?? object.size));
    const length = range.length ?? range.suffix ?? object.size - start;
    const end = Math.min(object.size - 1, start + length - 1);
    headers.set("content-range", `bytes ${start}-${end}/${object.size}`);
    headers.set("content-length", String(end - start + 1));
    status = 206;
  } else {
    headers.set("content-length", String(object.size));
  }
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
  return new Response(object.body, { status, headers });
}
