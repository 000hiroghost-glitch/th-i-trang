"use strict";

(() => {
  const imageSources = [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1548126032-079a0fb0099d?auto=format&fit=crop&w=900&q=85",
  ];
  const colors = [
    { name: "Đen", slug: "den" },
    { name: "Kem", slug: "kem" },
    { name: "Olive", slug: "olive" },
    { name: "Xám", slug: "xam" },
    { name: "Navy", slug: "navy" },
    { name: "Be", slug: "be" },
    { name: "Xanh denim", slug: "xanh-denim" },
    { name: "Đỏ đô", slug: "do-do" },
    { name: "Trắng ngà", slug: "trang-nga" },
    { name: "Nâu", slug: "nau" },
  ];
  const productTypes = [
    { base: "Áo phông Boxy Fit", category: "ao", material: "Cotton 100%", price: 389000, fit: "Boxy Fit" },
    { base: "Zip Hoodie", category: "ao-khoac", material: "Cotton nỉ", price: 790000, fit: "Relaxed Fit" },
    { base: "Varsity Jacket", category: "ao-khoac", material: "Nỉ dày, tay da tổng hợp", price: 1190000, fit: "Oversize" },
    { base: "Quần Cargo", category: "quan", material: "Cotton twill", price: 729000, fit: "Ống rộng" },
    { base: "Baggy Denim", category: "quan", material: "Denim cotton", price: 849000, fit: "Baggy" },
    { base: "Parachute Pants", category: "quan", material: "Nylon tái chế", price: 790000, fit: "Ống rộng, gấu rút" },
    { base: "Nón Trucker", category: "phu-kien", material: "Cotton twill, lưới polyester", price: 329000, fit: "Freesize, khóa điều chỉnh" },
    { base: "Beanie dệt gân", category: "phu-kien", material: "Cotton pha acrylic", price: 279000, fit: "Freesize" },
    { base: "Túi đeo chéo", category: "phu-kien", material: "Canvas chống bám nhẹ", price: 459000, fit: "Dây đeo điều chỉnh" },
    { base: "Áo khoác Coach", category: "ao-khoac", material: "Polyester chống gió", price: 890000, fit: "Regular Fit" },
  ];
  const categoryNames = {
    ao: "ÁO",
    "ao-khoac": "ÁO KHOÁC",
    quan: "QUẦN",
    "phu-kien": "PHỤ KIỆN",
  };
  const shopCatalog = productTypes.flatMap((type, typeIndex) =>
    colors.map((color, colorIndex) => ({
      id: `${type.base.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")}-${color.slug}`,
      name: `${type.base} · ${color.name}`,
      category: type.category,
      categoryLabel: `${categoryNames[type.category]} · STREETWEAR`,
      material: type.material,
      fit: type.fit,
      color: color.name,
      sizes: ["S", "M", "L", "XL"],
      price: type.price + (colorIndex % 4) * 25000,
      image: imageSources[typeIndex],
      alt: `${type.base} màu ${color.name}, phong cách Streetwear KCJ`,
      soldCount: 35 + ((typeIndex * 73 + colorIndex * 41) % 465),
      badge: colorIndex === 0 ? "BÁN CHẠY" : colorIndex === 1 ? "MỚI" : "",
    }))
  );

  const grid = document.querySelector("#shop-product-grid");
  const filters = {
    search: document.querySelector("#shop-search"),
    category: document.querySelector("#filter-category"),
    minimum: document.querySelector("#filter-min-price"),
    maximum: document.querySelector("#filter-max-price"),
    size: document.querySelector("#filter-size"),
    color: document.querySelector("#filter-color"),
    material: document.querySelector("#filter-material"),
    sort: document.querySelector("#filter-sort"),
  };
  const pagination = document.querySelector("#shop-pagination");
  const resultLabel = document.querySelector("#shop-result-count");
  const emptyState = document.querySelector("#shop-empty");
  const pageSize = 20;
  let currentPage = 1;
  let filteredProducts = [];
  const currency = new Intl.NumberFormat("vi-VN");
  const formatPrice = value => `${currency.format(value)}₫`;

  const createCard = product => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.id = product.id;
    const imageWrap = document.createElement("div");
    imageWrap.className = "product-image-wrap";
    const image = document.createElement("img");
    image.className = "product-image";
    image.src = product.image;
    image.alt = product.alt;
    image.loading = "lazy";
    imageWrap.append(image);
    if (product.badge) {
      const badge = document.createElement("span");
      badge.className = `product-badge${product.badge === "MỚI" ? " product-badge-light" : ""}`;
      badge.textContent = product.badge;
      imageWrap.append(badge);
    }

    const info = document.createElement("div");
    info.className = "product-info";
    const copy = document.createElement("div");
    const category = document.createElement("p");
    category.className = "product-category";
    category.textContent = product.categoryLabel;
    const name = document.createElement("h3");
    name.textContent = product.name;
    copy.append(category, name);
    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent = formatPrice(product.price);
    info.append(copy, price);

    const footer = document.createElement("div");
    footer.className = "product-footer shop-product-footer";
    const sizeLabel = document.createElement("label");
    sizeLabel.className = "shop-size-field";
    sizeLabel.textContent = "Size";
    const sizeSelect = document.createElement("select");
    sizeSelect.setAttribute("aria-label", `Chọn Size cho ${product.name}`);
    product.sizes.forEach(size => {
      const option = document.createElement("option");
      option.value = size;
      option.textContent = size;
      sizeSelect.append(option);
    });
    sizeLabel.append(sizeSelect);
    const addButton = document.createElement("button");
    addButton.className = "buy-button";
    addButton.type = "button";
    addButton.textContent = "Thêm vào giỏ";
    addButton.addEventListener("click", () => {
      window.KCJSite.addToCart(product, sizeSelect.value);
    });
    footer.append(sizeLabel, addButton);
    card.append(imageWrap, info, footer);
    return card;
  };

  const applyFilters = () => {
    const query = filters.search.value.trim().toLocaleLowerCase("vi");
    const minimum = filters.minimum.value === "" ? 0 : Number(filters.minimum.value);
    const maximum = filters.maximum.value === "" ? Infinity : Number(filters.maximum.value);
    filteredProducts = shopCatalog.filter(product =>
      product.name.toLocaleLowerCase("vi").includes(query) &&
      (filters.category.value === "all" || product.category === filters.category.value) &&
      product.price >= minimum &&
      product.price <= maximum &&
      (filters.size.value === "all" || product.sizes.includes(filters.size.value)) &&
      (filters.color.value === "all" || product.color === filters.color.value) &&
      (filters.material.value === "all" || product.material === filters.material.value)
    );

    if (filters.sort.value === "price-asc") {
      filteredProducts.sort((left, right) => left.price - right.price);
    } else if (filters.sort.value === "price-desc") {
      filteredProducts.sort((left, right) => right.price - left.price);
    } else {
      filteredProducts.sort((left, right) => right.soldCount - left.soldCount);
    }
    currentPage = 1;
    renderProducts();
  };

  const renderPagination = () => {
    const pageCount = Math.ceil(filteredProducts.length / pageSize);
    pagination.replaceChildren();
    if (pageCount <= 1) return;
    const addButton = (label, page, disabled = false, current = false) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `pagination-button${current ? " is-current" : ""}`;
      button.textContent = label;
      button.disabled = disabled;
      if (current) button.setAttribute("aria-current", "page");
      button.addEventListener("click", () => {
        currentPage = page;
        renderProducts();
        document.querySelector("#shop-products").scrollIntoView({ behavior: "smooth", block: "start" });
      });
      pagination.append(button);
    };
    addButton("Trước", Math.max(1, currentPage - 1), currentPage === 1);
    for (let page = 1; page <= pageCount; page += 1) {
      addButton(String(page), page, false, currentPage === page);
    }
    addButton("Sau", Math.min(pageCount, currentPage + 1), currentPage === pageCount);
  };

  const renderProducts = () => {
    const start = (currentPage - 1) * pageSize;
    const pageProducts = filteredProducts.slice(start, start + pageSize);
    grid.replaceChildren(...pageProducts.map(createCard));
    resultLabel.textContent = `Đang hiển thị ${pageProducts.length} / ${filteredProducts.length} sản phẩm`;
    emptyState.hidden = filteredProducts.length !== 0;
    renderPagination();
  };

  [filters.search, filters.category, filters.minimum, filters.maximum, filters.size, filters.color, filters.material, filters.sort]
    .forEach(control => control.addEventListener(control === filters.search ? "input" : "change", applyFilters));
  const query = new URLSearchParams(window.location.search).get("q");
  if (query) filters.search.value = query;
  applyFilters();
  document.querySelector("#shop-product-total").textContent = `${shopCatalog.length} sản phẩm`;
})();
