import { createHash } from "node:crypto";
import type { Gender } from "@prisma/client";

const validGenders = new Set<Gender>(["FEMALE", "MALE", "OTHER", "UNSPECIFIED"]);
const imageDataUrlPattern = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export const MAX_AVATAR_DATA_URL_LENGTH = 3 * 1024 * 1024;

export function isProfileInput(value: unknown): value is {
  fullName: string;
  phone: string;
  avatar: string | null;
  dateOfBirth: string | null;
  gender: Gender;
} {
  return typeof value === "object" &&
    value !== null &&
    "fullName" in value &&
    typeof value.fullName === "string" &&
    value.fullName.trim().length >= 2 &&
    value.fullName.trim().length <= 120 &&
    "phone" in value &&
    typeof value.phone === "string" &&
    value.phone.length <= 30 &&
    "avatar" in value &&
    (value.avatar === null || (
      typeof value.avatar === "string" &&
      value.avatar.length <= MAX_AVATAR_DATA_URL_LENGTH &&
      imageDataUrlPattern.test(value.avatar)
    )) &&
    "dateOfBirth" in value &&
    (value.dateOfBirth === null || (
      typeof value.dateOfBirth === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value.dateOfBirth) &&
      !Number.isNaN(Date.parse(`${value.dateOfBirth}T00:00:00.000Z`)) &&
      new Date(`${value.dateOfBirth}T00:00:00.000Z`).toISOString().slice(0, 10) === value.dateOfBirth &&
      new Date(value.dateOfBirth).getTime() <= Date.now()
    )) &&
    "gender" in value &&
    typeof value.gender === "string" &&
    validGenders.has(value.gender as Gender);
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isValidEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
