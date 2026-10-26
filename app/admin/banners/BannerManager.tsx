"use client";

import { FormEvent, useState } from "react";

type Banner = {
  id: string;
  eyebrow: string | null;
  title: string;
  description: string | null;
  image: string;
  link: string | null;
  linkText: string | null;
  couponCode: string | null;
  discountPercent: number | null;
  startsAt: string | Date | null;
  endsAt: string | Date | null;
  active: boolean;
  sortOrder: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

type BannerDraft = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  link: string;
  linkText: string;
  couponCode: string;
  discountPercent: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  sortOrder: string;
};

const blankDraft: BannerDraft = {
  eyebrow: "",
  title: "",
  description: "",
  image: "",
  link: "/shop.html",
  linkText: "Khám phá ngay",
  couponCode: "",
  discountPercent: "",
  startsAt: "",
  endsAt: "",
  active: true,
  sortOrder: "0",
};
const maxImageSize = 2 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Không thể đọc tệp ảnh."));
    };
    reader.onerror = () => reject(new Error("Không thể đọc tệp ảnh."));
    reader.readAsDataURL(file);
  });
}

function toLocalDateTime(value: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function toPayload(draft: BannerDraft) {
  return {
    ...draft,
    eyebrow: draft.eyebrow || null,
    description: draft.description || null,
    link: draft.link || null,
    linkText: draft.linkText || null,
    couponCode: draft.couponCode || null,
    discountPercent: draft.discountPercent ? Number(draft.discountPercent) : null,
    startsAt: draft.startsAt ? new Date(draft.startsAt).toISOString() : null,
    endsAt: draft.endsAt ? new Date(draft.endsAt).toISOString() : null,
    sortOrder: Number(draft.sortOrder),
  };
}

function draftFromBanner(banner: Banner): BannerDraft {
  return {
    eyebrow: banner.eyebrow || "",
    title: banner.title,
    description: banner.description || "",
    image: banner.image,
    link: banner.link || "",
    linkText: banner.linkText || "",
    couponCode: banner.couponCode || "",
    discountPercent: banner.discountPercent ? String(banner.discountPercent) : "",
    startsAt: toLocalDateTime(banner.startsAt),
    endsAt: toLocalDateTime(banner.endsAt),
    active: banner.active,
    sortOrder: String(banner.sortOrder),
  };
}

async function readJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    throw new Error(`Máy chủ trả về phản hồi không hợp lệ (HTTP ${response.status}).`);
  }
}

export default function BannerManager({ initialBanners }: { initialBanners: Banner[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [draft, setDraft] = useState<BannerDraft>(blankDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  function resetForm() {
    setDraft(blankDraft);
    setEditingId(null);
    setFileInputKey(key => key + 1);
  }

  function startEditing(banner: Banner) {
    setDraft(draftFromBanner(banner));
    setEditingId(banner.id);
    setFileInputKey(key => key + 1);
    setMessage("");
  }

  async function selectImage(file: File | undefined) {
    if (!file) return;
    if (!allowedImageTypes.includes(file.type)) {
      setMessage("Ảnh banner phải có định dạng JPEG, PNG hoặc WebP.");
      return;
    }
    if (file.size > maxImageSize) {
      setMessage("Kích thước ảnh tối đa là 2 MiB.");
      return;
    }

    try {
      const image = await readImageFile(file);
      setDraft(current => ({ ...current, image }));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể đọc tệp ảnh.");
    }
  }

  async function saveBanner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.image) {
      setMessage("Vui lòng tải ảnh banner từ thiết bị.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(
        editingId ? `/api/admin/banners/${encodeURIComponent(editingId)}` : "/api/admin/banners",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPayload(draft)),
        },
      );
      const result = await readJsonResponse(response);
      if (!response.ok) throw new Error(result.error || "Không thể lưu banner.");
      setBanners(current => editingId
        ? current.map(banner => banner.id === result.id ? result : banner)
        : [result, ...current]);
      setMessage(editingId ? "Đã cập nhật banner." : "Đã thêm banner.");
      resetForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lưu banner.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleBanner(banner: Banner) {
    setMessage("");
    try {
      const response = await fetch(`/api/admin/banners/${encodeURIComponent(banner.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draftFromBanner(banner), active: !banner.active, sortOrder: banner.sortOrder }),
      });
      const result = await readJsonResponse(response);
      if (!response.ok) throw new Error(result.error || "Không thể đổi trạng thái banner.");
      setBanners(current => current.map(item => item.id === result.id ? result : item));
      setMessage(result.active ? "Đã kích hoạt banner." : "Đã tắt banner.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể đổi trạng thái banner.");
    }
  }

  async function deleteBanner(banner: Banner) {
    if (!window.confirm(`Xóa banner "${banner.title}"?`)) return;
    setMessage("");
    try {
      const response = await fetch(`/api/admin/banners/${encodeURIComponent(banner.id)}`, { method: "DELETE" });
      const result = await readJsonResponse(response);
      if (!response.ok) throw new Error(result.error || "Không thể xóa banner.");
      setBanners(current => current.filter(item => item.id !== banner.id));
      if (editingId === banner.id) resetForm();
      setMessage("Đã xóa banner.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể xóa banner.");
    }
  }

  return (
    <>
      <form className="admin-form admin-card" onSubmit={saveBanner}>
        <label>Tiêu đề chương trình
          <input required maxLength={120} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} />
        </label>
        <label>Nhãn trên banner
          <input maxLength={80} placeholder="Ví dụ: ƯU ĐÃI MÙA HÈ" value={draft.eyebrow} onChange={event => setDraft({ ...draft, eyebrow: event.target.value })} />
        </label>
        <label className="admin-wide">Mô tả ngắn
          <textarea maxLength={500} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} />
        </label>
        <div className="admin-wide admin-image-field">
          <label htmlFor="banner-image">Ảnh banner (JPEG, PNG hoặc WebP; tối đa 2 MiB)
            <input
              key={fileInputKey}
              id="banner-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={event => selectImage(event.currentTarget.files?.[0])}
            />
          </label>
          {draft.image && <img className="admin-image-preview banner-image-preview" src={draft.image} alt="Xem trước banner" />}
        </div>
        <label>Mã giảm giá
          <input maxLength={40} placeholder="Ví dụ: KCJSALE20" value={draft.couponCode} onChange={event => setDraft({ ...draft, couponCode: event.target.value.toUpperCase() })} />
        </label>
        <label>Phần trăm giảm giá
          <input required={Boolean(draft.couponCode)} min="1" max="80" step="1" type="number" placeholder="Ví dụ: 15" value={draft.discountPercent} onChange={event => setDraft({ ...draft, discountPercent: event.target.value })} />
        </label>
        <label>Thứ tự hiển thị
          <input required min="0" max="10000" step="1" type="number" value={draft.sortOrder} onChange={event => setDraft({ ...draft, sortOrder: event.target.value })} />
        </label>
        <label>Liên kết
          <input maxLength={2048} placeholder="/shop.html" value={draft.link} onChange={event => setDraft({ ...draft, link: event.target.value })} />
        </label>
        <label>Nhãn nút liên kết
          <input maxLength={80} value={draft.linkText} onChange={event => setDraft({ ...draft, linkText: event.target.value })} />
        </label>
        <label>Bắt đầu hiển thị
          <input type="datetime-local" value={draft.startsAt} onChange={event => setDraft({ ...draft, startsAt: event.target.value })} />
        </label>
        <label>Kết thúc hiển thị
          <input type="datetime-local" value={draft.endsAt} onChange={event => setDraft({ ...draft, endsAt: event.target.value })} />
        </label>
        <label className="admin-checkbox">
          <input type="checkbox" checked={draft.active} onChange={event => setDraft({ ...draft, active: event.target.checked })} />
          Kích hoạt chương trình
        </label>
        <div className="admin-wide">
          <button className="admin-button" type="submit" disabled={saving}>
            {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm banner"}
          </button>
          {editingId && <button className="admin-button admin-button-secondary" type="button" onClick={resetForm}>Hủy sửa</button>}
        </div>
      </form>
      <p className="admin-status" role="status">{message}</p>
      <div className="admin-card">
        <table className="admin-table admin-banner-table">
          <thead><tr><th>Ảnh</th><th>Chương trình</th><th>Thời gian</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
          <tbody>
            {banners.map(banner => (
              <tr key={banner.id}>
                <td><img className="admin-banner-thumbnail" src={banner.image} alt="" /></td>
                <td>
                  <strong>{banner.title}</strong>
                  {banner.couponCode && <><br /><code>{banner.couponCode} · giảm {banner.discountPercent}%</code></>}
                  {banner.description && <p className="admin-muted">{banner.description}</p>}
                </td>
                <td className="admin-muted">
                  {banner.startsAt ? new Date(banner.startsAt).toLocaleString("vi-VN") : "Ngay"}
                  <br />{banner.endsAt ? new Date(banner.endsAt).toLocaleString("vi-VN") : "Không đặt hạn"}
                </td>
                <td>{banner.active ? "Đang bật" : "Đã tắt"}</td>
                <td className="admin-banner-actions">
                  <button className="admin-button admin-button-secondary" type="button" onClick={() => startEditing(banner)}>Sửa</button>
                  <button className="admin-button admin-button-secondary" type="button" onClick={() => toggleBanner(banner)}>{banner.active ? "Tắt" : "Bật"}</button>
                  <button className="admin-button admin-button-danger" type="button" onClick={() => deleteBanner(banner)}>Xóa</button>
                </td>
              </tr>
            ))}
            {banners.length === 0 && <tr><td colSpan={5}>Chưa có banner hoặc chương trình khuyến mãi.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
