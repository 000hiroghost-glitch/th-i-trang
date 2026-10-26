"use strict";

(() => {
  const grid = document.querySelector("#shop-product-grid");
  const filters = {
    search: document.querySelector("#shop-search"),
    category: document.querySelector("#filter-category"),
    minimum: document.querySelector("#filter-min-price"),
    maximum: document.querySelector("#filter-max-price"),
    size: document.querySelector("#filter-size"),
    color: document.querySelector("#filter-color"),
    sort: document.querySelector("#filter-sort"),
  };
  const pagination = document.querySelector("#shop-pagination");
  const resultLabel = document.querySelector("#shop-result-count");
  const emptyState = document.querySelector("#shop-empty");
  const errorState = document.querySelector("#shop-load-error");
  const retryButton = document.querySelector("#shop-retry");
  const productTotal = document.querySelector("#shop-product-total");
  const pageSize = 20;
  const currency = new Intl.NumberFormat("vi-VN");
  let currentPage = 1;
  let products = [];
  let filteredProducts = [];
  let requestController;

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
    image.alt = product.name;
    image.loading = "lazy";
    imageWrap.append(image);

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
    const variantList = document.createElement("ul");
    variantList.className = "shop-variant-list";
    variantList.setAttribute("aria-label", `Size và màu của ${product.name}`);
    product.variants.forEach(variant => {
      const item = document.createElement("li");
      item.textContent = [
        variant.size,
        variant.color,
        variant.stock > 0 ? `Còn ${variant.stock}` : "Hết hàng",
      ].filter(Boolean).join(" · ");
      variantList.append(item);
    });

    const sizeLabel = document.createElement("label");
    sizeLabel.className = "shop-size-field";
    sizeLabel.textContent = "Size";
    const sizeSelect = document.createElement("select");
    sizeSelect.setAttribute("aria-label", `Chọn Size cho ${product.name}`);
    product.variants.forEach(variant => {
      const option = document.createElement("option");
      option.value = variant.id;
      option.textContent = [
        variant.size,
        variant.color,
        variant.stock > 0 ? `Còn ${variant.stock}` : "Hết hàng",
      ].filter(Boolean).join(" · ");
      option.disabled = variant.stock <= 0;
      sizeSelect.append(option);
    });
    sizeSelect.value = product.variants.find(variant => variant.stock > 0)?.id || "";
    sizeLabel.append(sizeSelect);

    const addButton = document.createElement("button");
    addButton.className = "buy-button";
    addButton.type = "button";
    addButton.textContent = "Thêm vào giỏ";
    const availableStock = product.variants.reduce((total, variant) => total + variant.stock, 0);
    addButton.disabled = availableStock === 0;
    if (availableStock === 0) addButton.textContent = "Hết hàng";
    addButton.addEventListener("click", () => {
      window.KCJSite.addToCart(product, sizeSelect.value);
    });
    footer.append(variantList, sizeLabel, addButton);
    card.append(imageWrap, info, footer);
    return card;
  };

  const renderProducts = () => {
    const start = (currentPage - 1) * pageSize;
    const pageProducts = filteredProducts.slice(start, start + pageSize);
    grid.replaceChildren(...pageProducts.map(createCard));
    resultLabel.textContent = `Đang hiển thị ${pageProducts.length} / ${filteredProducts.length} sản phẩm`;
    emptyState.hidden = filteredProducts.length !== 0;
    pagination.replaceChildren();

    const pageCount = Math.ceil(filteredProducts.length / pageSize);
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

  const applyFilters = () => {
    const query = filters.search.value.trim().toLocaleLowerCase("vi");
    const minimum = filters.minimum.value === "" ? 0 : Number(filters.minimum.value);
    const maximum = filters.maximum.value === "" ? Infinity : Number(filters.maximum.value);
    filteredProducts = products.filter(product =>
      product.name.toLocaleLowerCase("vi").includes(query) &&
      (filters.category.value === "all" || product.category === filters.category.value) &&
      product.price >= minimum &&
      product.price <= maximum &&
      (filters.size.value === "all" || product.variants.some(variant => variant.size === filters.size.value)) &&
      (filters.color.value === "all" || product.variants.some(variant => variant.color === filters.color.value))
    );

    if (filters.sort.value === "price-asc") {
      filteredProducts.sort((left, right) => left.price - right.price);
    } else if (filters.sort.value === "price-desc") {
      filteredProducts.sort((left, right) => right.price - left.price);
    }

    currentPage = 1;
    renderProducts();
  };

  const loadProducts = async () => {
    requestController?.abort();
    requestController = new AbortController();
    grid.setAttribute("aria-busy", "true");
    grid.replaceChildren();
    pagination.replaceChildren();
    emptyState.hidden = true;
    errorState.hidden = true;
    resultLabel.textContent = "Đang tải sản phẩm...";

    try {
      const response = await fetch("/api/products", { signal: requestController.signal });
      if (!response.ok) {
        throw new Error(`Products request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new TypeError("Products API response must be an array.");
      }

      products = data.map(product => ({
        ...product,
        image: product.images?.[0] || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
        category: product.category?.slug || "",
        categoryLabel: product.category?.name || "KCJ",
        variants: Array.isArray(product.variants) ? product.variants : [],
        stock: Array.isArray(product.variants)
          ? product.variants.reduce((total, variant) => total + variant.stock, 0)
          : 0,
      }));
      productTotal.textContent = `${products.length} sản phẩm`;
      grid.setAttribute("aria-busy", "false");
      applyFilters();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Không thể tải danh sách sản phẩm:", error);
      products = [];
      filteredProducts = [];
      productTotal.textContent = "0 sản phẩm";
      resultLabel.textContent = "";
      grid.setAttribute("aria-busy", "false");
      errorState.hidden = false;
      pagination.replaceChildren();
    }
  };

  [filters.search, filters.category, filters.minimum, filters.maximum, filters.size, filters.color, filters.sort]
    .forEach(control => control.addEventListener(control === filters.search ? "input" : "change", applyFilters));
  retryButton.addEventListener("click", loadProducts);

  const query = new URLSearchParams(window.location.search).get("q");
  if (query) filters.search.value = query;
  loadProducts();
})();
