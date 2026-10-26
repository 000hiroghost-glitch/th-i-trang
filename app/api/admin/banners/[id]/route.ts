import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "../../../../../lib/auth";
import { deleteBanner, updateBanner } from "../../../../../lib/banner-repository";
import { parseBannerInput } from "../../../../../lib/banner-validation";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
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
    const { id } = await context.params;
    const banner = await updateBanner(id, input);
    if (!banner) return NextResponse.json({ error: "Không tìm thấy banner." }, { status: 404 });
    return NextResponse.json(banner);
  } catch (error) {
    console.error("Không thể cập nhật banner:", error);
    return NextResponse.json({ error: "Không thể cập nhật banner." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });

  try {
    const { id } = await context.params;
    const deleted = await deleteBanner(id);
    if (!deleted) return NextResponse.json({ error: "Không tìm thấy banner." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Không thể xóa banner:", error);
    return NextResponse.json({ error: "Không thể xóa banner." }, { status: 500 });
  }
}
