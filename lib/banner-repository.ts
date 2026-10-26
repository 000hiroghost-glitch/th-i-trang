import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { BannerInput } from "./banner-validation";

export type BannerRecord = {
  id: string;
  eyebrow: string | null;
  title: string;
  description: string | null;
  image: string;
  link: string | null;
  linkText: string | null;
  couponCode: string | null;
  discountPercent: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

const bannerColumns = Prisma.raw(
  '"id", "eyebrow", "title", "description", "image", "link", "linkText", "couponCode", "discountPercent", "startsAt", "endsAt", "active", "sortOrder", "createdAt", "updatedAt"',
);

export async function getPublicBanners(now = new Date()) {
  return prisma.$queryRaw<Pick<
    BannerRecord,
    "id" | "eyebrow" | "title" | "description" | "image" | "link" | "linkText" | "couponCode" | "discountPercent"
  >[]>(Prisma.sql`
    SELECT "id", "eyebrow", "title", "description", "image", "link", "linkText", "couponCode", "discountPercent"
    FROM "Banner"
    WHERE "active" = true
      AND ("startsAt" IS NULL OR "startsAt" <= ${now})
      AND ("endsAt" IS NULL OR "endsAt" >= ${now})
    ORDER BY "sortOrder" ASC, "createdAt" DESC
  `);
}

export async function getAdminBanners() {
  return prisma.$queryRaw<BannerRecord[]>(Prisma.sql`
    SELECT ${bannerColumns} FROM "Banner"
    ORDER BY "sortOrder" ASC, "createdAt" DESC
  `);
}

export async function createBanner(input: BannerInput) {
  const id = randomUUID();
  const [banner] = await prisma.$queryRaw<BannerRecord[]>(Prisma.sql`
    INSERT INTO "Banner" (
      "id", "eyebrow", "title", "description", "image", "link", "linkText",
      "couponCode", "discountPercent", "startsAt", "endsAt", "active", "sortOrder", "updatedAt"
    )
    VALUES (
      ${id}, ${input.eyebrow}, ${input.title}, ${input.description}, ${input.image},
      ${input.link}, ${input.linkText}, ${input.couponCode}, ${input.discountPercent}, ${input.startsAt},
      ${input.endsAt}, ${input.active}, ${input.sortOrder}, CURRENT_TIMESTAMP
    )
    RETURNING ${bannerColumns}
  `);
  return banner;
}

export async function updateBanner(id: string, input: BannerInput) {
  const [banner] = await prisma.$queryRaw<BannerRecord[]>(Prisma.sql`
    UPDATE "Banner"
    SET
      "eyebrow" = ${input.eyebrow},
      "title" = ${input.title},
      "description" = ${input.description},
      "image" = ${input.image},
      "link" = ${input.link},
      "linkText" = ${input.linkText},
      "couponCode" = ${input.couponCode},
      "discountPercent" = ${input.discountPercent},
      "startsAt" = ${input.startsAt},
      "endsAt" = ${input.endsAt},
      "active" = ${input.active},
      "sortOrder" = ${input.sortOrder},
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${id}
    RETURNING ${bannerColumns}
  `);
  return banner ?? null;
}

export async function deleteBanner(id: string) {
  return prisma.$executeRaw(Prisma.sql`DELETE FROM "Banner" WHERE "id" = ${id}`);
}
