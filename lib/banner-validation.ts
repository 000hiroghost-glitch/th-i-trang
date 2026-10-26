export const MAX_BANNER_IMAGE_LENGTH = 3 * 1024 * 1024;

export type BannerInput = {
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
};

function isOptionalString(value: unknown, maxLength: number): value is string | null {
  return value === null || value === undefined ||
    (typeof value === "string" && value.length <= maxLength);
}

function parseDate(value: unknown): Date | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isValidImage(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.length <= 2048 && /^https:\/\/[^\s]+$/i.test(value)) return true;
  return value.length <= MAX_BANNER_IMAGE_LENGTH &&
    /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}

export function parseBannerInput(body: unknown): BannerInput | null {
  if (typeof body !== "object" || body === null) return null;
  if (
    !("title" in body) ||
    typeof body.title !== "string" ||
    !body.title.trim() ||
    body.title.trim().length > 120 ||
    !("image" in body) ||
    !isValidImage(body.image) ||
    !("active" in body) ||
    typeof body.active !== "boolean" ||
    !("sortOrder" in body) ||
    typeof body.sortOrder !== "number" ||
    !Number.isInteger(body.sortOrder) ||
    body.sortOrder < 0 ||
    body.sortOrder > 10000 ||
    !("eyebrow" in body) ||
    !isOptionalString(body.eyebrow, 80) ||
    !("description" in body) ||
    !isOptionalString(body.description, 500) ||
    !("link" in body) ||
    !isOptionalString(body.link, 2048) ||
    !("linkText" in body) ||
    !isOptionalString(body.linkText, 80) ||
    !("couponCode" in body) ||
    !isOptionalString(body.couponCode, 40) ||
    !("discountPercent" in body) ||
    (
      body.discountPercent !== null &&
      body.discountPercent !== undefined &&
      (typeof body.discountPercent !== "number" || !Number.isInteger(body.discountPercent) || body.discountPercent < 1 || body.discountPercent > 80)
    ) ||
    (Boolean(body.couponCode?.trim()) !== (typeof body.discountPercent === "number"))
  ) {
    return null;
  }

  const startsAt = parseDate("startsAt" in body ? body.startsAt : null);
  const endsAt = parseDate("endsAt" in body ? body.endsAt : null);
  if (startsAt === undefined || endsAt === undefined) return null;
  if (startsAt && endsAt && startsAt >= endsAt) return null;

  const link = body.link?.trim() || null;
  if (link && !(link.startsWith("/") && !link.startsWith("//"))) {
    try {
      if (new URL(link).protocol !== "https:") return null;
    } catch {
      return null;
    }
  }

  return {
    eyebrow: body.eyebrow?.trim() || null,
    title: body.title.trim(),
    description: body.description?.trim() || null,
    image: body.image,
    link,
    linkText: body.linkText?.trim() || null,
    couponCode: body.couponCode?.trim() || null,
    discountPercent: typeof body.discountPercent === "number" ? body.discountPercent : null,
    startsAt,
    endsAt,
    active: body.active,
    sortOrder: body.sortOrder,
  };
}
