import { NextResponse } from "next/server";
import { getPublicBanners } from "../../../lib/banner-repository";

export async function GET() {
  try {
    const banners = await getPublicBanners();
    return NextResponse.json(banners, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Không thể tải banner:", error);
    return NextResponse.json({ error: "Không thể tải chương trình khuyến mãi." }, { status: 500 });
  }
}
