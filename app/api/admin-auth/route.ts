import { clearAdminSessionCookie, createAdminSessionCookie, isAdminRequest, verifyAdminCredentials } from "@/lib/admin-auth";
import { isAdminAccessAllowed } from "@/lib/admin-access-server";
import { checkAdminLoginLimit, clearAdminLoginFailures, recordAdminLoginFailure } from "@/lib/admin-login-limit";

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
    const loginLimit = await checkAdminLoginLimit(request);
    if (loginLimit.blocked) {
      return Response.json({ error:"登录失败次数过多，请 15 分钟后再试" }, {
        status:429,
        headers: { "Retry-After":String(loginLimit.retryAfterSeconds), "Cache-Control":"no-store" },
      });
    }
    const body = await request.json() as { username?:unknown; password?:unknown };
    const username = typeof body.username === "string" ? body.username : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!await verifyAdminCredentials(username, password)) {
      const failedAttempt = await recordAdminLoginFailure(request);
      await new Promise((resolve) => setTimeout(resolve, 450));
      if (failedAttempt.blocked) {
        return Response.json({ error:"登录失败次数过多，请 15 分钟后再试" }, {
          status:429,
          headers: { "Retry-After":String(failedAttempt.retryAfterSeconds), "Cache-Control":"no-store" },
        });
      }
      return Response.json({ error:"用户名或密码不正确" }, { status:401 });
    }
    await clearAdminLoginFailures(request);
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
