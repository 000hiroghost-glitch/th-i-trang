import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "../../../../lib/auth";
import { createBanner, getAdminBanners } from "../../../../lib/banner-repository";
import { parseBannerInput } from "../../../../lib/banner-validation";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });

  try {
    const banners = await getAdminBanners();
    return NextResponse.json(banners);
  } catch (error) {
    console.error("Không thể tải danh sách banner quản trị:", error);
    return NextResponse.json({ error: "Không thể tải danh sách banner." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const input = parseBannerInput(body);
  if (!input) {
    return NextResponse.json({ error: "Vui lòng kiểm tra thông tin banner và khoảng thời gian hiển thị." }, { status: 400 });
  }

  try {
    const banner = await createBanner(input);
    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error("Không thể tạo banner:", error);
    return NextResponse.json({ error: "Không thể lưu banner." }, { status: 500 });
  }
}
