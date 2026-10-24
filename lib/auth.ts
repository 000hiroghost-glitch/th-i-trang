import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { SESSION_COOKIE, verifySessionToken } from "./auth-token";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const claims = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!claims) return null;

  return prisma.user.findUnique({
    where: { id: claims.sub },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
    },
  });
}

export async function getAdminUser() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}
