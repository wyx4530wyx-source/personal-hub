import { getSiteStats, incrementLikes, recordPresence, removePresence } from "@/lib/site-stats-store";

const noStoreHeaders = { "Cache-Control": "no-store, max-age=0" };

function response(data: unknown, status = 200) {
  return Response.json(data, { status, headers: noStoreHeaders });
}

function validVisitorId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9-]{8,80}$/.test(value);
}

export async function GET() {
  try {
    return response(await getSiteStats());
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "读取统计数据失败" }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: string; visitorId?: unknown; countVisit?: unknown };
    if (body.action === "like") return response(await incrementLikes());
    if (!validVisitorId(body.visitorId)) return response({ error: "访客编号无效" }, 400);
    if (body.action === "presence") return response(await recordPresence(body.visitorId, body.countVisit === true));
    if (body.action === "leave") return response(await removePresence(body.visitorId));
    return response({ error: "未知操作" }, 400);
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "更新统计数据失败" }, 500);
  }
}
