import { NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";

export const runtime = "nodejs";

/**
 * POST /api/songs/:id/listen
 * - Tăng listens +1
 * - Chống đếm trùng bằng cookie trong 1 giờ (mỗi bài 1 lần / trình duyệt)
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const songId = Number(params.id);
  if (!Number.isFinite(songId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const cookieName = `ls_${songId}`; // listened-song

  // Check cookie: nếu đã nghe bài này trong 1h -> không cộng nữa
  const cookieHeader = req.headers.get("cookie") || "";
  const alreadyCounted = cookieHeader
    .split(";")
    .some((c) => c.trim().startsWith(`${cookieName}=`));

  const res = new NextResponse(null, { status: 204 });

  if (alreadyCounted) {
    return res; // đã có cookie -> thoát sớm
  }

  try {
    await prisma.song.update({
      where: { id: songId },
      data: { listens: { increment: 1 } },
    });

    // Set cookie 1 giờ để chống trùng
    res.cookies.set(cookieName, "1", {
      httpOnly: false,   // để client nhìn thấy cũng được (không nhạy cảm)
      sameSite: "lax",
      maxAge: 1 * 60,   // 1 phút
      path: "/",
    });

    return res;
  } catch (e) {
    console.error("listen increment error", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
