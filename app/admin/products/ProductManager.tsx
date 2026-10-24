"use client";

import { FormEvent, useState } from "react";

type Variant = { id?: string; size: string; color: string | null; stock: number };
type Category = { id: string; name: string; slug: string };
type Product = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  images: string[];
  categoryId: string;
  category: Category;
  variants: Variant[];
};

const blankForm = { name: "", price: "", description: "", image: "", categoryId: "", variants: "S, Đen, 0" };

export default function ProductManager({
  initialProducts,
  categories,
}: {
  initialProducts: Product[];
  categories: Category[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function startEditing(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: String(product.price),
      description: product.description || "",
      image: product.images[0] || "",
      categoryId: product.categoryId,
      variants: product.variants.map(variant =>
        [variant.size, variant.color || "", variant.stock].join(", "),
      ).join("\n"),
    });
    setMessage("");
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...blankForm, categoryId: categories[0]?.id || "" });
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const variants = form.variants.split(/\r?\n/).filter(line => line.trim()).map(line => {
        const [size, color = "", stockText = "0"] = line.split(",").map(value => value.trim());
        const stock = Number(stockText);
        if (!size || !Number.isInteger(stock) || stock < 0) {
          throw new Error("Biến thể cần có định dạng: Size, Màu, Tồn kho.");
        }
        return { size, color: color || null, stock };
      });
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        images: [form.image.trim()],
        categoryId: form.categoryId,
        variants,
      };
      if (!Number.isFinite(payload.price) || payload.price < 0 || !payload.images[0]) {
        throw new Error("Vui lòng nhập giá và URL hình ảnh hợp lệ.");
      }
      const response = await fetch(
        editingId ? `/api/admin/products/${encodeURIComponent(editingId)}` : "/api/admin/products",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể lưu sản phẩm.");
      setProducts(current => editingId
        ? current.map(product => product.id === result.id ? result : product)
        : [result, ...current]);
      setMessage(editingId ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm.");
      resetForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lưu sản phẩm.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form className="admin-form admin-card" onSubmit={saveProduct}>
        <label>Tên sản phẩm<input required maxLength={160} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
        <label>Giá (₫)<input required min="0" step="1000" type="number" value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} /></label>
        <label>Danh mục<select required value={form.categoryId} onChange={event => setForm({ ...form, categoryId: event.target.value })}>
          <option value="" disabled>Chọn danh mục</option>
          {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select></label>
        <label>URL hình ảnh<input required type="url" value={form.image} onChange={event => setForm({ ...form, image: event.target.value })} /></label>
        <label className="admin-wide">Mô tả<textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label>
        <label className="admin-wide">Biến thể (mỗi dòng: Size, Màu, Tồn kho)
          <textarea required value={form.variants} onChange={event => setForm({ ...form, variants: event.target.value })} />
        </label>
        <div className="admin-wide">
          <button className="admin-button" type="submit" disabled={saving || categories.length === 0}>
            {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm sản phẩm"}
          </button>
          {editingId && <button className="admin-button admin-button-secondary" type="button" onClick={resetForm}>Hủy sửa</button>}
          {!categories.length && <p>Chưa có danh mục. Hãy tạo danh mục trước khi thêm sản phẩm.</p>}
        </div>
      </form>
      <p className="admin-status" role="status">{message}</p>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Biến thể</th><th></th></tr></thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.name}<br /><span className="admin-muted">{product.description}</span></td>
                <td>{product.category.name}</td>
                <td>{new Intl.NumberFormat("vi-VN").format(product.price)}₫</td>
                <td>{product.variants.map(variant => `${variant.size} · ${variant.color || "—"} (${variant.stock})`).join(", ")}</td>
                <td><button className="admin-button admin-button-secondary" type="button" onClick={() => startEditing(product)}>Sửa</button></td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={5}>Chưa có sản phẩm.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
