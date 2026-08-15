import { clearAdminSessionCookie, createAdminSessionCookie, isAdminRequest, verifyAdminCredentials } from "@/lib/admin-auth";
import { isAdminAccessAllowed } from "@/lib/admin-access-server";

function rejectPublicAdmin(request: Request) {
  if (isAdminAccessAllowed(request.headers)) return null;
  return Response.json({ error:"后台管理尚未在此地址启用" }, { status:403 });
}

export async function GET(request: Request) {
  const rejected = rejectPublicAdmin(request);
  if (rejected) return rejected;
  return Response.json({ authenticated:await isAdminRequest(request) });
}

export async function POST(request: Request) {
  try {
    const rejected = rejectPublicAdmin(request);
    if (rejected) return rejected;
    const body = await request.json() as { username?:unknown; password?:unknown };
    const username = typeof body.username === "string" ? body.username : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!await verifyAdminCredentials(username, password)) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      return Response.json({ error:"用户名或密码不正确" }, { status:401 });
    }
    return Response.json({ authenticated:true }, { headers: { "Set-Cookie":await createAdminSessionCookie() } });
  } catch {
    return Response.json({ error:"登录失败，请重新输入" }, { status:400 });
  }
}

export async function DELETE(request: Request) {
  const rejected = rejectPublicAdmin(request);
  if (rejected) return rejected;
  return Response.json({ authenticated:false }, { headers: { "Set-Cookie":clearAdminSessionCookie() } });
}
