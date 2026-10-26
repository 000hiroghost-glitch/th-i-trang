import { scrypt as scryptCallback, scryptSync, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

export const DUMMY_PASSWORD_HASH =
  `scrypt$${Buffer.alloc(16).toString("hex")}$${scryptSync("KCJ invalid login", Buffer.alloc(16), 64).toString("hex")}`;

const scrypt = (
  password: string,
  salt: Buffer,
  keyLength: number,
) => new Promise<Buffer>((resolve, reject) => {
  scryptCallback(password, salt, keyLength, (error, derivedKey) => {
    if (error) reject(error);
    else resolve(derivedKey as Buffer);
  });
});

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, saltHex, keyHex] = storedHash.split("$");
  if (/^\$2[aby]\$/.test(storedHash)) {
    return bcrypt.compare(password, storedHash);
  }
  if (
    algorithm !== "scrypt" ||
    !/^[a-f0-9]{32}$/i.test(saltHex ?? "") ||
    !/^[a-f0-9]{128}$/i.test(keyHex ?? "")
  ) {
    return false;
  }

  const expected = Buffer.from(keyHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}
