// src/components/LeftSidebar.jsx
import { cookies } from "next/headers";
import { prisma } from "@/libs/prisma";
import { SESSION_COOKIE } from "@/libs/auth";
import LeftSidebarClient from "./LeftSidebarClient";

export const runtime = "nodejs";

export default async function LeftSidebar() {
  const token = cookies().get(SESSION_COOKIE)?.value || null;

  let me = null;
  if (token) {
    // Lấy session + user theo token
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            avatarUrl: true,
            // nếu bạn có cột credits/balance thì select ở đây
            credits: true, // hoặc balance tuỳ schema
          },
        },
      },
    });

    // Kiểm tra session còn hạn (nếu có expiresAt trong bảng Session)
    const notExpired =
      !session?.expiresAt || new Date(session.expiresAt).getTime() > Date.now();

    if (session && session.user && notExpired) {
      me = {
        email: session.user.email,
        name: session.user.name,
        avatar: session.user.avatarUrl || null,
        credits:
          typeof session.user.credits === "number" ? session.user.credits : 0,
      };
    }
  }

  return <LeftSidebarClient me={me} />;
}
