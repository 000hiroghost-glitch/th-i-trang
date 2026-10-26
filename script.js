"use strict";

const productGrid = document.querySelector("#product-grid");
const productSearch = document.querySelector("#product-search");
const productTotal = document.querySelector("#product-total");
const emptySearch = document.querySelector("#empty-search");
const categoryFilters = document.querySelector("#category-filters");
const heroEyebrow = document.querySelector("#hero-eyebrow");
const heroTitle = document.querySelector("#hero-title");
const heroDescription = document.querySelector("#hero-description");
const heroLink = document.querySelector("#hero-link");
const heroNote = document.querySelector("#hero-note");
const heroImage = document.querySelector("#hero-image");
const heroImageTag = document.querySelector("#hero-image-tag");
const heroIndex = document.querySelector("#hero-index");
const heroBannerControls = document.querySelector("#hero-banner-controls");
const homePromotions = document.querySelector("#home-promotions");
const homePromotionGrid = document.querySelector("#home-promotion-grid");
const cartTrigger = document.querySelector("#cart-trigger");
const cartPanel = document.querySelector("#cart-panel");
const cartBackdrop = document.querySelector("#cart-backdrop");
const cartClose = document.querySelector("#cart-close");
const cartCount = document.querySelector("#cart-count");
const cartPanelCount = document.querySelector("#cart-panel-count");
const cartItems = document.querySelector("#cart-items");
const cartSubtotal = document.querySelector("#cart-subtotal");
const checkoutButton = document.querySelector("#checkout-button");
const detailPanel = document.querySelector("#detail-panel");
const detailBackdrop = document.querySelector("#detail-backdrop");
const detailClose = document.querySelector("#detail-close");
const detailImage = document.querySelector("#detail-image");
const detailCategory = document.querySelector("#detail-category");
const detailTitle = document.querySelector("#detail-title");
const detailPrice = document.querySelector("#detail-price");
const detailDescription = document.querySelector("#detail-description");
const detailMaterial = document.querySelector("#detail-material");
const detailFit = document.querySelector("#detail-fit");
const detailCare = document.querySelector("#detail-care");
const detailQuantity = document.querySelector("#detail-quantity");
const detailQuantityDecrease = document.querySelector("#detail-quantity-decrease");
const detailQuantityIncrease = document.querySelector("#detail-quantity-increase");
const sizeOptions = document.querySelector("#size-options");
const detailValidation = document.querySelector("#detail-validation");
const detailAddButton = document.querySelector("#detail-add-button");
const detailCheckoutButton = document.querySelector("#detail-checkout-button");
const summaryProduct = document.querySelector("#summary-product");
const summarySize = document.querySelector("#summary-size");
const summaryQuantity = document.querySelector("#summary-quantity");
const summaryTotal = document.querySelector("#summary-total");
const checkoutPanel = document.querySelector("#checkout-panel");
const checkoutBackdrop = document.querySelector("#checkout-backdrop");
const checkoutForm = document.querySelector("#checkout-form");
const checkoutClose = document.querySelector("#checkout-close");
const checkoutOrderItems = document.querySelector("#checkout-order-items");
const checkoutOrderTotal = document.querySelector("#checkout-order-total");
const checkoutFormError = document.querySelector("#checkout-form-error");
const checkoutConfirmButton = document.querySelector("#checkout-confirm-button");
const qrDemoPanel = document.querySelector("#qr-demo-panel");
const qrTransferNote = document.querySelector("#qr-transfer-note");
const installmentPanel = document.querySelector("#installment-panel");
const savedAddressCard = document.querySelector("#saved-address-card");
const savedAddressSelect = document.querySelector("#saved-address-select");
const savedAddressPreview = document.querySelector("#saved-address-preview");
const noSavedAddressNote = document.querySelector("#no-saved-address-note");
const checkoutCouponCode = document.querySelector("#checkout-coupon-code");
const checkoutCouponMessage = document.querySelector("#checkout-coupon-message");
const checkoutPromotions = document.querySelector("#checkout-promotions");
const checkoutDiscountRow = document.querySelector("#checkout-discount-row");
const checkoutDiscountTotal = document.querySelector("#checkout-discount-total");
const checkoutApplyCoupon = document.querySelector("#checkout-apply-coupon");
const checkoutRemoveCoupon = document.querySelector("#checkout-remove-coupon");
const orderPanel = document.querySelector("#order-panel");
const orderBackdrop = document.querySelector("#order-backdrop");
const orderClose = document.querySelector("#order-close");
const orderContinueButton = document.querySelector("#order-continue-button");
const orderStatusNote = document.querySelector("#order-status-note");
const orderIdElement = document.querySelector("#order-id");
const orderDateElement = document.querySelector("#order-date");
const orderCustomerElement = document.querySelector("#order-customer");
const orderPhoneElement = document.querySelector("#order-phone");
const orderAddressElement = document.querySelector("#order-address");
const orderPaymentElement = document.querySelector("#order-payment");
const orderItemsElement = document.querySelector("#order-items");
const orderTotalElement = document.querySelector("#order-total");
const accountTrigger = document.querySelector("#account-trigger");
const authModal = document.querySelector("#auth-modal");
const authClose = document.querySelector("#auth-close");
const authTabs = document.querySelectorAll(".auth-tab");
const authLoginForm = document.querySelector("#login-view");
const authRegisterForm = document.querySelector("#register-view");
const loginMessage = document.querySelector("#login-message");
const registerMessage = document.querySelector("#register-message");
const registerPassword = document.querySelector("#register-password");
const registerPasswordConfirm = document.querySelector(
  "#register-password-confirm"
);
const toast = document.querySelector("#toast");
const readAuthResponse = async (response, action) => {
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`Máy chủ không trả về JSON hợp lệ khi ${action} (HTTP ${response.status}).`);
  }
  if (!result || typeof result !== "object") {
    throw new Error(`Máy chủ không trả về dữ liệu hợp lệ khi ${action} (HTTP ${response.status}).`);
  }
  if (!response.ok) {
    throw new Error(typeof result.error === "string" ? result.error : `Không thể ${action}.`);
  }
  return result;
};

const currency = new Intl.NumberFormat("vi-VN");
const cart = new Map();
const cartStorageKey = "kcj-cart-v1";
let productCards = [];
let productCatalog = [];
let activeCategory = "all";
let selectedProduct = null;
let selectedSize = "";
let selectedVariantId = "";
let selectedQuantity = 1;
let returnFocusElement = null;
let authReturnFocusElement = null;
let toastTimeout;
let storageAvailable = true;
let storageWarningShown = false;
let checkoutDraftOrderId = "";
let checkoutAddresses = [];
let selectedShippingAddressId = null;
let appliedCoupon = null;
let authenticatedUser = null;
let homeBanners = [];
let activeBannerIndex = 0;
let bannerRotationTimer;

const refreshHomeAccount = user => {
  const label = document.querySelector(".account-label");
  if (!label) {
    return;
  }
  label.textContent = user?.name ? user.name.split(" ")[0] : "Tài khoản";
  accountTrigger.setAttribute(
    "aria-label",
    user?.name ? `Tài khoản ${user.name}` : "Mở đăng nhập hoặc đăng ký"
  );
};

const formatPrice = price => `${currency.format(price)}₫`;

const warnStorageUnavailable = () => {
  storageAvailable = false;
  if (!storageWarningShown) {
    storageWarningShown = true;
    announce(
      "Không thể lưu dữ liệu trên thiết bị này. Hãy bật localStorage hoặc dùng cửa sổ trình duyệt thông thường."
    );
  }
};

const restoreCart = () => {
  let savedCart;

  try {
    const serializedCart = localStorage.getItem(cartStorageKey);
    if (!serializedCart) {
      return;
    }
    savedCart = JSON.parse(serializedCart);
  } catch (error) {
    console.error("Không thể đọc giỏ hàng đã lưu:", error);
    try {
      localStorage.removeItem(cartStorageKey);
    } catch (removeError) {
      console.error("Không thể xóa giỏ hàng đã hỏng:", removeError);
    }
    warnStorageUnavailable();
    return;
  }

  if (!Array.isArray(savedCart)) {
    console.error("Dữ liệu giỏ hàng đã lưu không đúng định dạng.");
    try {
      localStorage.removeItem(cartStorageKey);
    } catch (error) {
      console.error("Không thể xóa giỏ hàng đã hỏng:", error);
      warnStorageUnavailable();
    }
    return;
  }

  savedCart.forEach(savedItem => {
    let product = productCatalog.find(
      catalogProduct => catalogProduct.id === savedItem.productId
    );
    const variant = product?.variants.find(item =>
      item.id === savedItem.variantId ||
      (!savedItem.variantId && item.size === savedItem.size && item.color === (savedItem.color || null))
    );
    const validQuantity =
      Number.isSafeInteger(savedItem.quantity) &&
      savedItem.quantity > 0 &&
      savedItem.quantity <= 999;

    if (!product || !variant || !validQuantity || variant.stock <= 0) {
      console.warn("Bỏ qua một sản phẩm không hợp lệ trong giỏ hàng đã lưu.");
      return;
    }

    const itemId = variant.id;
    const existing = cart.get(itemId);
    if (existing) {
      existing.quantity = Math.min(variant.stock, existing.quantity + savedItem.quantity);
      return;
    }

    cart.set(itemId, {
      id: itemId,
      variantId: variant.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: variant.size,
      color: variant.color,
      quantity: Math.min(savedItem.quantity, variant.stock),
    });

  });
};

const persistCart = () => {
  if (!storageAvailable) {
    return false;
  }

  const savedCart = Array.from(cart.values()).map(item => ({
    productId: item.productId,
    variantId: item.variantId,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    name: item.name,
    price: item.price,
    image: item.image,
  }));

  try {
    if (savedCart.length === 0) {
      localStorage.removeItem(cartStorageKey);
    } else {
      localStorage.setItem(cartStorageKey, JSON.stringify(savedCart));
    }
    return true;
  } catch (error) {
    console.error("Không thể lưu giỏ hàng:", error);
    warnStorageUnavailable();
    return false;
  }
};

const announce = message => {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
};

const createProductCard = product => {
  const card = document.createElement("article");
  card.className = "product-card";
  card.dataset.id = product.id;
  card.dataset.name = product.name;
  card.dataset.price = product.price;
  card.dataset.category = product.category;

  const imageWrap = document.createElement("div");
  imageWrap.className = "product-image-wrap";

  const image = document.createElement("img");
  image.className = "product-image";
  image.src = product.image;
  image.alt = product.alt;
  image.loading = "lazy";
  imageWrap.append(image);

  if (product.stock <= 0) {
    const badge = document.createElement("span");
    badge.className = "product-badge";
    badge.textContent = "Hết hàng";
    imageWrap.append(badge);
  }

  if (product.badge) {
    const badge = document.createElement("span");
    badge.className = "product-badge";
    badge.textContent = product.badge;
    if (product.badge === "MỚI") {
      badge.classList.add("product-badge-light");
    }
    if (product.badge.startsWith("-")) {
      badge.classList.add("product-badge-sale");
    }
    imageWrap.append(badge);
  }

  const quickAdd = document.createElement("button");
  quickAdd.className = "quick-add";
  quickAdd.type = "button";
  quickAdd.setAttribute("aria-label", `Xem nhanh chi tiết ${product.name}`);
  quickAdd.innerHTML = '<span aria-hidden="true">+</span>';
  imageWrap.append(quickAdd);

  const info = document.createElement("div");
  info.className = "product-info";

  const infoCopy = document.createElement("div");
  const category = document.createElement("p");
  category.className = "product-category";
  category.textContent = product.categoryLabel;
  const name = document.createElement("h3");
  name.textContent = product.name;
  infoCopy.append(category, name);

  const price = document.createElement("p");
  price.className = "product-price";
  price.textContent = formatPrice(product.price);
  info.append(infoCopy, price);

  const footer = document.createElement("div");
  footer.className = "product-footer";
  const colors = document.createElement("div");
  colors.className = "color-options";
  colors.setAttribute("aria-label", "Có nhiều màu sắc");
  colors.innerHTML =
    '<span class="color-dot color-white"></span><span class="color-dot color-brown"></span><span class="color-caption">Nhiều màu</span>';

  const actions = createProductActions(product.name, product.stock <= 0);
  footer.append(colors, actions);
  card.append(imageWrap, info, footer);
  return card;
};

const createProductActions = (productName, outOfStock = false) => {
  const actions = document.createElement("div");
  actions.className = "product-actions";

  const detailButton = document.createElement("button");
  detailButton.className = "detail-button";
  detailButton.type = "button";
  detailButton.textContent = "Xem chi tiết";
  detailButton.setAttribute("aria-label", `Xem chi tiết ${productName}`);

  const buyButton = document.createElement("button");
  buyButton.className = "buy-button";
  buyButton.type = "button";
  buyButton.textContent = outOfStock ? "Hết hàng" : "Mua ngay";
  buyButton.disabled = outOfStock;

  actions.append(detailButton, buyButton);
  return actions;
};

const setupProductCards = () => {
  productGrid.replaceChildren(...productCatalog.map(createProductCard));

  productCards = Array.from(productGrid.querySelectorAll(".product-card"));
  updateCategoryFilters();
  applyFilters();
};

const updateCategoryFilters = () => {
  const categories = new Map();
  productCatalog.forEach(product => {
    if (product.category && product.categoryLabel) {
      categories.set(product.category, product.categoryLabel);
    }
  });
  if (!categories.has(activeCategory)) activeCategory = "all";
  const buttons = [
    ["all", "Tất cả"],
    ...Array.from(categories.entries()),
  ].map(([slug, label]) => {
    const button = document.createElement("button");
    button.className = "category-filter";
    button.type = "button";
    button.dataset.category = slug;
    button.setAttribute("aria-pressed", String(slug === activeCategory));
    button.textContent = label;
    if (slug === activeCategory) button.classList.add("is-active");
    return button;
  });
  categoryFilters.replaceChildren(...buttons);
};

const loadHomeProducts = async () => {
  productGrid.setAttribute("aria-busy", "true");
  productGrid.replaceChildren();
  productTotal.textContent = "Đang tải sản phẩm...";
  try {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error(`Products request failed with status ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new TypeError("Products API response must be an array.");
    productCatalog = data.map(product => ({
      ...product,
      image: product.images?.[0] || "",
      alt: product.name,
      category: product.category?.slug || "",
      categoryLabel: product.category?.name || "KCJ",
      variants: Array.isArray(product.variants) ? product.variants : [],
      stock: Array.isArray(product.variants)
        ? product.variants.reduce((total, variant) => total + variant.stock, 0)
        : 0,
      material: "Thông tin theo mô tả sản phẩm",
      fit: "Tham khảo bảng size",
      care: "Thực hiện theo hướng dẫn trên nhãn sản phẩm.",
    }));
    productTotal.textContent = `${productCatalog.length} sản phẩm`;
  } catch (error) {
    console.error("Không thể tải sản phẩm từ máy chủ:", error);
    productCatalog = [];
    productGrid.replaceChildren();
    productTotal.textContent = "Không thể tải sản phẩm";
    announce("Không thể tải danh sách sản phẩm. Vui lòng tải lại trang.");
  } finally {
    productGrid.setAttribute("aria-busy", "false");
    setupProductCards();
  }
};

const renderHomeBanners = () => {
  const banner = homeBanners[activeBannerIndex];
  if (!banner) return;

  heroEyebrow.textContent = banner.eyebrow || "KCJ · ƯU ĐÃI MỚI";
  heroTitle.textContent = banner.title;
  heroDescription.textContent = banner.description || "";
  heroDescription.hidden = !banner.description;
  heroLink.href = banner.link || "shop.html";
  heroLink.textContent = banner.linkText || "Khám phá ngay";
  heroLink.target = banner.link?.startsWith("https://") ? "_blank" : "";
  heroLink.rel = heroLink.target ? "noreferrer" : "";
  heroNote.textContent = banner.couponCode
    ? `Mã ưu đãi: ${banner.couponCode}`
    : banner.eyebrow || "Thiết kế cho nhịp sống của bạn";
  heroImage.style.backgroundImage = `url("${banner.image}")`;
  heroImage.setAttribute("aria-label", banner.title);
  heroImageTag.textContent = banner.eyebrow || "KCJ · SALE";
  heroIndex.textContent = `${String(activeBannerIndex + 1).padStart(2, "0")} / ${String(homeBanners.length).padStart(2, "0")}`;

  heroBannerControls.hidden = homeBanners.length < 2;
  heroBannerControls.replaceChildren(...homeBanners.map((item, index) => {
    const button = document.createElement("button");
    button.className = "hero-banner-dot";
    button.type = "button";
    button.setAttribute("aria-label", `Hiển thị banner ${index + 1}: ${item.title}`);
    button.setAttribute("aria-current", String(index === activeBannerIndex));
    button.addEventListener("click", () => {
      activeBannerIndex = index;
      renderHomeBanners();
    });
    return button;
  }));
};

const renderHomePromotions = () => {
  const promotions = homeBanners.filter(banner => banner.couponCode);
  homePromotions.hidden = promotions.length === 0;
  homePromotionGrid.replaceChildren(...promotions.map(banner => {
    const card = document.createElement("article");
    card.className = "home-promotion-card";
    const copy = document.createElement("div");
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = banner.eyebrow || "ƯU ĐÃI KCJ";
    const title = document.createElement("h3");
    title.textContent = banner.title;
    const description = document.createElement("p");
    description.textContent = banner.description || "Ưu đãi có thời hạn, áp dụng theo điều kiện của chương trình.";
    copy.append(eyebrow, title, description);

    const bottom = document.createElement("div");
    bottom.className = "home-promotion-card-bottom";
    const code = document.createElement("button");
    code.className = "home-promotion-code";
    code.type = "button";
    code.dataset.copyCoupon = banner.couponCode;
    code.textContent = banner.couponCode;
    const link = document.createElement("a");
    link.className = "home-promotion-link";
    link.href = banner.link || "shop.html";
    link.textContent = banner.linkText || "Mua sắm";
    bottom.append(code, link);
    card.append(copy, bottom);
    return card;
  }));
};

const loadHomeBanners = async () => {
  try {
    const response = await fetch("/api/banners");
    if (!response.ok) throw new Error(`Banner request failed with status ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new TypeError("Banners API response must be an array.");
    homeBanners = data;
    activeBannerIndex = 0;
    if (homeBanners.length) renderHomeBanners();
    renderHomePromotions();
    window.clearInterval(bannerRotationTimer);
    if (homeBanners.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      bannerRotationTimer = window.setInterval(() => {
        activeBannerIndex = (activeBannerIndex + 1) % homeBanners.length;
        renderHomeBanners();
      }, 6500);
    }
  } catch (error) {
    console.error("Không thể tải banner quảng cáo:", error);
  }
};

const getProductForCard = card =>
  productCatalog.find(product => product.id === card.dataset.id);

const applyFilters = () => {
  const query = productSearch.value.trim().toLocaleLowerCase("vi");
  let visibleCount = 0;

  productCards.forEach(card => {
    const matchesCategory =
      activeCategory === "all" || card.dataset.category === activeCategory;
    const matchesSearch = card.dataset.name
      .toLocaleLowerCase("vi")
      .includes(query);
    const isVisible = matchesCategory && matchesSearch;
    card.hidden = !isVisible;
    if (isVisible) {
      visibleCount += 1;
    }
  });

  productTotal.textContent = `${String(visibleCount).padStart(2, "0")} sản phẩm`;
  emptySearch.hidden = visibleCount !== 0;
};

const setModalScrollLock = () => {
  const hasOpenModal =
    cartPanel.classList.contains("is-open") ||
    detailPanel.classList.contains("is-open") ||
    checkoutPanel.classList.contains("is-open") ||
    orderPanel.classList.contains("is-open") ||
    !authModal.hidden;
  document.body.classList.toggle("cart-open", hasOpenModal);
};

const updateDetailSummary = () => {
  if (!selectedProduct) {
    return;
  }

  const variant = selectedProduct.variants.find(item => item.id === selectedVariantId);
  summaryProduct.textContent = selectedProduct.name;
  summarySize.textContent = variant
    ? [variant.size, variant.color].filter(Boolean).join(" · ")
    : "Chưa chọn";
  summaryQuantity.textContent = selectedQuantity;
  summaryTotal.textContent = formatPrice(
    selectedProduct.price * selectedQuantity
  );

  const variantIsAvailable = Boolean(variant && variant.stock > 0 && selectedQuantity <= variant.stock);
  detailAddButton.disabled = !variantIsAvailable;
  detailCheckoutButton.disabled = !variantIsAvailable;
  detailQuantityIncrease.disabled = !variant || selectedQuantity >= variant.stock;
  detailValidation.textContent = selectedProduct.variants.every(item => item.stock <= 0)
    ? "Sản phẩm đã hết hàng."
    : !variant
      ? "Chọn một biến thể để tiếp tục."
    : variant.stock === 0
      ? "Hết hàng."
      : selectedQuantity > variant.stock
        ? `Chỉ còn ${variant.stock} sản phẩm trong kho.`
        : `Còn ${variant.stock} sản phẩm trong kho.`;
};

const openDetail = (product, focusTarget = document.activeElement, variantId = "") => {
  if (!product) {
    return;
  }

  if (cartPanel.classList.contains("is-open")) {
    closeCart(false);
  }

  selectedProduct = product;
  selectedVariantId = variantId || product.variants.find(variant => variant.stock > 0)?.id || "";
  selectedSize = product.variants.find(variant => variant.id === selectedVariantId)?.size || "";
  selectedQuantity = 1;
  returnFocusElement = focusTarget;

  detailImage.src = product.image;
  detailImage.alt = product.alt;
  detailCategory.textContent = product.categoryLabel;
  detailTitle.textContent = product.name;
  detailPrice.textContent = formatPrice(product.price);
  detailDescription.textContent = product.description;
  detailMaterial.textContent = product.material;
  detailFit.textContent = product.fit;
  detailCare.textContent = product.care;
  detailQuantity.textContent = selectedQuantity;
  sizeOptions.replaceChildren(...product.variants.map(variant => {
    const button = document.createElement("button");
    button.className = "size-option";
    button.type = "button";
    button.dataset.size = variant.size;
    button.dataset.variantId = variant.id;
    button.setAttribute("aria-pressed", String(variant.id === selectedVariantId));
    button.disabled = variant.stock <= 0;
    button.textContent = [
      variant.size,
      variant.color,
      variant.stock > 0 ? `(${variant.stock})` : "(Hết hàng)",
    ].filter(Boolean).join(" · ");
    if (variant.id === selectedVariantId) button.classList.add("is-selected");
    return button;
  }));

  detailBackdrop.hidden = false;
  requestAnimationFrame(() => detailBackdrop.classList.add("is-visible"));
  detailPanel.inert = false;
  detailPanel.setAttribute("aria-hidden", "false");
  detailPanel.classList.add("is-open");
  setModalScrollLock();
  detailClose.focus();
  updateDetailSummary();
};

const closeDetail = (restoreFocus = true) => {
  detailPanel.classList.remove("is-open");
  detailBackdrop.classList.remove("is-visible");
  detailPanel.inert = true;
  detailPanel.setAttribute("aria-hidden", "true");
  setModalScrollLock();

  window.setTimeout(() => {
    if (!detailPanel.classList.contains("is-open")) {
      detailBackdrop.hidden = true;
    }
  }, 250);

  if (restoreFocus && returnFocusElement?.isConnected) {
    returnFocusElement.focus();
  }
};

const addToCart = (product, size, quantity = 1) => {
  if (!product || !size) {
    return false;
  }

  const variant = product.variants.find(item => item.id === size || item.size === size);
  if (!variant || variant.stock <= 0) {
    announce("Biến thể này hiện đã hết hàng.");
    return false;
  }
  const itemId = variant.id;
  const existing = cart.get(itemId);
  if (existing) {
    if (existing.quantity + quantity > variant.stock) {
      announce(`Chỉ còn ${variant.stock} sản phẩm trong kho.`);
      return false;
    }
    existing.quantity += quantity;
  } else {
    cart.set(itemId, {
      id: itemId,
      variantId: variant.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: variant.size,
      color: variant.color,
      quantity,
    });
  }

  updateCart();
  announce(`Đã thêm ${product.name} · ${[variant.size, variant.color].filter(Boolean).join(" · ")} vào giỏ hàng.`);
  return true;
};

const changeQuantity = (itemId, difference) => {
  const item = cart.get(itemId);
  if (!item) {
    return;
  }

  const product = productCatalog.find(candidate => candidate.id === item.productId);
  const variant = product?.variants.find(candidate => candidate.id === item.variantId);
  if (difference > 0 && (!variant || item.quantity >= variant.stock)) {
    announce("Số lượng đã đạt mức tồn kho hiện có.");
    return;
  }
  item.quantity += difference;
  if (item.quantity <= 0) {
    cart.delete(itemId);
  }
  updateCart();
};

const removeItem = itemId => {
  cart.delete(itemId);
  updateCart();
};

const openCart = () => {
  if (detailPanel.classList.contains("is-open")) {
    closeDetail(false);
  }

  cartBackdrop.hidden = false;
  requestAnimationFrame(() => cartBackdrop.classList.add("is-visible"));
  cartPanel.inert = false;
  cartPanel.setAttribute("aria-hidden", "false");
  cartPanel.classList.add("is-open");
  cartTrigger.setAttribute("aria-expanded", "true");
  setModalScrollLock();
  cartClose.focus();
};

const closeCart = (restoreFocus = true) => {
  cartPanel.classList.remove("is-open");
  cartBackdrop.classList.remove("is-visible");
  cartPanel.inert = true;
  cartPanel.setAttribute("aria-hidden", "true");
  cartTrigger.setAttribute("aria-expanded", "false");
  setModalScrollLock();

  window.setTimeout(() => {
    if (!cartPanel.classList.contains("is-open")) {
      cartBackdrop.hidden = true;
    }
  }, 250);

  if (restoreFocus) {
    cartTrigger.focus();
  }
};

const openCartItemDetail = (item, focusTarget) => {
  const product = productCatalog.find(
    catalogProduct => catalogProduct.id === item.productId
  );
  openDetail(product, focusTarget, item.variantId);
};

const updateCart = () => {
  const entries = Array.from(cart.values());
  const itemCount = entries.reduce((total, item) => total + item.quantity, 0);
  const subtotal = entries.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  cartCount.textContent = itemCount;
  cartPanelCount.textContent = `(${itemCount})`;
  cartSubtotal.textContent = formatPrice(subtotal);
  checkoutButton.disabled = itemCount === 0;

  if (entries.length === 0) {
    cartItems.innerHTML =
      '<p class="cart-empty">Giỏ hàng đang chờ món đồ bạn yêu.</p>';
    persistCart();
    return;
  }

  cartItems.replaceChildren(
    ...entries.map(item => {
      const article = document.createElement("article");
      article.className = "cart-item";

      const image = document.createElement("img");
      image.className = "cart-item-image";
      image.src = item.image;
      image.alt = item.name;
      image.loading = "lazy";

      const details = document.createElement("div");
      details.className = "cart-item-details";

      const name = document.createElement("button");
      name.className = "cart-item-detail-link";
      name.type = "button";
      name.textContent = item.name;
      name.setAttribute("aria-label", `Xem chi tiết đơn hàng: ${item.name}`);
      name.addEventListener("click", () => openCartItemDetail(item, name));

      const unitPrice = document.createElement("p");
      unitPrice.textContent = `${formatPrice(item.price)} · ${[item.size, item.color].filter(Boolean).join(" · ")}`;

      const quantity = document.createElement("div");
      quantity.className = "cart-item-quantity";
      quantity.setAttribute("aria-label", `Số lượng ${item.name}`);

      const decrease = document.createElement("button");
      decrease.type = "button";
      decrease.textContent = "−";
      decrease.setAttribute("aria-label", `Giảm số lượng ${item.name}`);
      decrease.addEventListener("click", () => changeQuantity(item.id, -1));

      const quantityNumber = document.createElement("span");
      quantityNumber.textContent = item.quantity;

      const increase = document.createElement("button");
      increase.type = "button";
      increase.textContent = "+";
      const product = productCatalog.find(candidate => candidate.id === item.productId);
      const variant = product?.variants.find(candidate => candidate.id === item.variantId);
      increase.disabled = !variant || item.quantity >= variant.stock;
      increase.setAttribute("aria-label", `Tăng số lượng ${item.name}`);
      increase.addEventListener("click", () => changeQuantity(item.id, 1));

      quantity.append(decrease, quantityNumber, increase);
      details.append(name, unitPrice, quantity);

      const end = document.createElement("div");
      end.className = "cart-item-end";

      const lineTotal = document.createElement("strong");
      lineTotal.textContent = formatPrice(item.price * item.quantity);

      const remove = document.createElement("button");
      remove.className = "remove-item";
      remove.type = "button";
      remove.textContent = "Xóa";
      remove.setAttribute("aria-label", `Xóa ${item.name} khỏi giỏ hàng`);
      remove.addEventListener("click", () => removeItem(item.id));

      end.append(lineTotal, remove);
      article.append(image, details, end);
      return article;
    })
  );
  persistCart();
};

const selectSavedAddress = addressId => {
  const address = checkoutAddresses.find(item => item.id === addressId);
  if (!address) {
    selectedShippingAddressId = null;
    checkoutConfirmButton.disabled = true;
    return;
  }
  selectedShippingAddressId = address.id;
  checkoutConfirmButton.disabled = false;
  savedAddressPreview.textContent = `${address.recipient} · ${address.phone} · ${address.address}`;
};

const renderCheckoutPromotions = promotions => {
  checkoutPromotions.replaceChildren();
  for (const promotion of promotions) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "checkout-promotion";
    button.disabled = !promotion.available;
    button.textContent = `${promotion.title}: ${promotion.couponCode} · giảm ${promotion.discountPercent}%${promotion.available ? "" : " · sắp diễn ra"}`;
    if (promotion.available) {
      button.addEventListener("click", () => {
        checkoutCouponCode.value = promotion.couponCode;
        void applyCheckoutCoupon();
      });
    }
    checkoutPromotions.append(button);
  }
};

const loadCheckoutOptions = async () => {
  const response = await fetch("/api/checkout/options", { cache: "no-store" });
  const result = await readAuthResponse(response, "tải dữ liệu giao hàng");
  checkoutAddresses = Array.isArray(result.addresses) ? result.addresses : [];
  savedAddressSelect.replaceChildren();
  if (checkoutAddresses.length) {
    savedAddressCard.hidden = false;
    noSavedAddressNote.hidden = true;
    for (const address of checkoutAddresses) {
      const option = document.createElement("option");
      option.value = address.id;
      option.textContent = `${address.label}${address.isDefault ? " (Mặc định)" : ""} · ${address.recipient} · ${address.phone}`;
      savedAddressSelect.append(option);
    }
    const defaultAddress = checkoutAddresses.find(address => address.isDefault) || checkoutAddresses[0];
    savedAddressSelect.value = defaultAddress.id;
    selectSavedAddress(defaultAddress.id);
  } else {
    savedAddressCard.hidden = true;
    noSavedAddressNote.hidden = false;
    selectedShippingAddressId = null;
    checkoutConfirmButton.disabled = true;
  }
  renderCheckoutPromotions(Array.isArray(result.promotions) ? result.promotions : []);
};

const applyCheckoutCoupon = async () => {
  checkoutCouponMessage.textContent = "";
  const code = checkoutCouponCode.value.trim();
  if (!code) {
    checkoutCouponMessage.textContent = "Nhập mã giảm giá trước khi áp dụng.";
    return;
  }
  checkoutApplyCoupon.disabled = true;
  try {
    const response = await fetch("/api/checkout/coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        items: Array.from(cart.values()).map(item => ({ variantId: item.variantId, quantity: item.quantity })),
      }),
    });
    appliedCoupon = await readAuthResponse(response, "kiểm tra mã giảm giá");
    checkoutCouponCode.value = appliedCoupon.code;
    checkoutCouponMessage.textContent = `Đã áp dụng ${appliedCoupon.code} · giảm ${formatPrice(appliedCoupon.discountAmount)}.`;
    checkoutRemoveCoupon.hidden = false;
    renderCheckoutOrder();
  } catch (error) {
    appliedCoupon = null;
    checkoutRemoveCoupon.hidden = true;
    checkoutCouponMessage.textContent = error instanceof Error ? error.message : "Không thể áp dụng mã.";
    renderCheckoutOrder();
  } finally {
    checkoutApplyCoupon.disabled = false;
  }
};

const openCheckout = () => {
  if (cart.size === 0) {
    announce("Giỏ hàng đang trống. Hãy chọn sản phẩm trước khi đặt hàng.");
    return;
  }

  if (cartPanel.classList.contains("is-open")) {
    closeCart(false);
  }
  if (detailPanel.classList.contains("is-open")) {
    closeDetail(false);
  }

  checkoutFormError.textContent = "";
  checkoutCouponMessage.textContent = "";
  appliedCoupon = null;
  checkoutCouponCode.value = "";
  checkoutRemoveCoupon.hidden = true;
  selectedShippingAddressId = null;
  checkoutAddresses = [];
  savedAddressCard.hidden = true;
  noSavedAddressNote.hidden = true;
  checkoutConfirmButton.disabled = true;
  checkoutDraftOrderId = createOrderId();
  qrTransferNote.textContent = checkoutDraftOrderId;
  renderCheckoutOrder();
  checkoutBackdrop.hidden = false;
  requestAnimationFrame(() => checkoutBackdrop.classList.add("is-visible"));
  checkoutPanel.inert = false;
  checkoutPanel.setAttribute("aria-hidden", "false");
  checkoutPanel.classList.add("is-open");
  setModalScrollLock();
  void loadCheckoutOptions().catch(error => {
    noSavedAddressNote.hidden = false;
    checkoutFormError.textContent = error instanceof Error ? error.message : "Không thể tải thông tin checkout.";
  });
  checkoutClose.focus();
};

const closeCheckout = (restoreFocus = true) => {
  checkoutPanel.classList.remove("is-open");
  checkoutBackdrop.classList.remove("is-visible");
  checkoutPanel.inert = true;
  checkoutPanel.setAttribute("aria-hidden", "true");
  setModalScrollLock();

  window.setTimeout(() => {
    if (!checkoutPanel.classList.contains("is-open")) {
      checkoutBackdrop.hidden = true;
    }
  }, 250);

  if (restoreFocus) {
    cartTrigger.focus();
  }
};

const renderCheckoutOrder = () => {
  const entries = Array.from(cart.values());
  const subtotal = entries.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  checkoutOrderItems.replaceChildren(
    ...entries.map(item => {
      const row = document.createElement("div");
      row.className = "checkout-order-row";

      const description = document.createElement("span");
      description.textContent = `${item.name} · ${[item.size, item.color].filter(Boolean).join(" · ")} × ${item.quantity}`;

      const lineTotal = document.createElement("strong");
      lineTotal.textContent = formatPrice(item.price * item.quantity);

      row.append(description, lineTotal);
      return row;
    })
  );
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  checkoutDiscountRow.hidden = discount <= 0;
  checkoutDiscountTotal.textContent = `−${formatPrice(discount)}`;
  checkoutOrderTotal.textContent = formatPrice(Math.max(0, subtotal - discount));
};

const validateCheckoutForm = () => {
  if (!selectedShippingAddressId) {
    checkoutFormError.textContent = "Hãy lưu và chọn địa chỉ giao hàng trong tài khoản trước khi đặt hàng.";
    return false;
  }
  const paymentInputs = checkoutForm.querySelectorAll(
    'input[name="paymentMethod"]'
  );
  const installmentSelected = checkoutForm.querySelector('input[name="paymentMethod"]:checked')?.value === "installment";
  const installmentMonths = checkoutForm.elements.namedItem("installmentMonths");
  const installmentProvider = checkoutForm.elements.namedItem("installmentProvider");

  const hasPaymentMethod = Array.from(paymentInputs).some(input => input.checked);
  paymentInputs.forEach(input => {
    input.setCustomValidity(
      hasPaymentMethod ? "" : "Vui lòng chọn phương thức thanh toán."
    );
  });
  installmentMonths.required = installmentSelected;
  installmentProvider.required = installmentSelected;
  installmentProvider.setCustomValidity(
    !installmentSelected || installmentProvider.value.trim().length >= 2
      ? ""
      : "Vui lòng nhập tên ngân hàng hoặc đơn vị trả góp."
  );

  return checkoutForm.reportValidity();
};

const createOrderId = () => {
  const datePart = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const randomPart = Math.floor(Math.random() * 9000 + 1000);
  return `KCJ-${datePart}-${randomPart}`;
};

const clearStoredCartForOrder = () => {
  if (!storageAvailable) {
    checkoutFormError.textContent =
      "Không thể xóa giỏ hàng đã lưu vì trình duyệt đang chặn localStorage. Hãy bật lưu trữ trang web rồi thử lại.";
    return false;
  }

  try {
    localStorage.removeItem(cartStorageKey);
    return true;
  } catch (error) {
    console.error("Không thể xóa giỏ hàng đã lưu:", error);
    storageAvailable = false;
    checkoutFormError.textContent =
      "Chưa thể hoàn tất đơn hàng vì không xóa được giỏ hàng đã lưu trên thiết bị. Hãy kiểm tra quyền lưu trữ rồi thử lại.";
    return false;
  }
};

const renderOrderSummary = order => {
  orderIdElement.textContent = order.id;
  orderDateElement.textContent = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(order.createdAt));
  orderCustomerElement.textContent = order.customer.name;
  orderPhoneElement.textContent = order.customer.phone;
  orderAddressElement.textContent = order.customer.address;
  orderPaymentElement.textContent = order.paymentMethodLabel;
  orderStatusNote.textContent =
    order.paymentMethod === "qr"
      ? "Đơn hàng đã được ghi nhận. Thông tin thanh toán QR hiện chỉ mang tính minh họa."
      : order.paymentMethod === "installment"
        ? "Yêu cầu trả góp đã được ghi nhận và đang chờ đối tác xác minh. Không gửi OTP hoặc CCCD cho KCJ."
        : "Đơn hàng đã được ghi nhận và tồn kho đã cập nhật.";
  orderTotalElement.textContent = formatPrice(order.total);

  orderItemsElement.replaceChildren(
    ...order.items.map(item => {
      const row = document.createElement("div");
      row.className = "order-item-row";

      const description = document.createElement("span");
      description.textContent = `${item.name} · Size ${item.size} × ${item.quantity}`;

      const lineTotal = document.createElement("strong");
      lineTotal.textContent = formatPrice(item.price * item.quantity);

      row.append(description, lineTotal);
      return row;
    })
  );
};

const showOrderSummary = order => {
  closeCheckout(false);
  cart.clear();
  updateCart();
  checkoutForm.reset();
  qrDemoPanel.hidden = true;
  checkoutFormError.textContent = "";
  renderOrderSummary(order);

  orderBackdrop.hidden = false;
  requestAnimationFrame(() => orderBackdrop.classList.add("is-visible"));
  orderPanel.inert = false;
  orderPanel.setAttribute("aria-hidden", "false");
  orderPanel.classList.add("is-open");
  setModalScrollLock();
  orderClose.focus();
  announce("Đặt hàng thành công!");
};

const closeOrderSummary = () => {
  orderPanel.classList.remove("is-open");
  orderBackdrop.classList.remove("is-visible");
  orderPanel.inert = true;
  orderPanel.setAttribute("aria-hidden", "true");
  setModalScrollLock();

  window.setTimeout(() => {
    if (!orderPanel.classList.contains("is-open")) {
      orderBackdrop.hidden = true;
    }
  }, 250);

  cartTrigger.focus();
};

const setAuthView = view => {
  const showLogin = view === "login";
  authLoginForm.hidden = !showLogin;
  authRegisterForm.hidden = showLogin;
  loginMessage.textContent = "";
  registerMessage.textContent = "";

  authTabs.forEach(tab => {
    const isSelected = tab.dataset.authView === view;
    tab.classList.toggle("is-active", isSelected);
    tab.setAttribute("aria-selected", String(isSelected));
  });

  document.querySelector("#auth-title").textContent = showLogin
    ? "Chào mừng bạn trở lại"
    : "Tạo tài khoản KCJ";
  document.querySelector("#auth-description").textContent = showLogin
    ? "Đăng nhập để tiếp tục hành trình cùng KCJ."
    : "Tạo tài khoản để lưu lại những món đồ bạn yêu.";

  const firstInput = showLogin
    ? document.querySelector("#login-email")
    : document.querySelector("#register-name");
  firstInput.focus();
};

const openAuthModal = (view = "login") => {
  authReturnFocusElement = document.activeElement;
  authModal.hidden = false;
  setModalScrollLock();
  setAuthView(view);
};

const closeAuthModal = () => {
  authModal.hidden = true;
  setModalScrollLock();
  loginMessage.textContent = "";
  registerMessage.textContent = "";
  authLoginForm.reset();
  authRegisterForm.reset();
  registerPasswordConfirm.setCustomValidity("");

  if (authReturnFocusElement?.isConnected) {
    authReturnFocusElement.focus();
  } else {
    accountTrigger.focus();
  }
};

loadHomeProducts().then(() => {
  restoreCart();
  updateCart();
});
loadHomeBanners();

productGrid.addEventListener("click", event => {
  const card = event.target.closest(".product-card");
  if (!card) {
    return;
  }

  const product = getProductForCard(card);
  if (!product) {
    return;
  }

  if (
    event.target.closest(
      ".quick-add, .detail-button, .buy-button, .product-image-wrap, .product-info"
    )
  ) {
    openDetail(product);
  }
});

productSearch.addEventListener("input", applyFilters);

categoryFilters.addEventListener("click", event => {
  const filterButton = event.target.closest(".category-filter");
  if (!filterButton) {
    return;
  }

  activeCategory = filterButton.dataset.category;
  categoryFilters.querySelectorAll(".category-filter").forEach(button => {
    const isSelected = button === filterButton;
    button.classList.toggle("is-active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
  applyFilters();
});

homePromotionGrid.addEventListener("click", async event => {
  const button = event.target.closest("[data-copy-coupon]");
  if (!button) return;
  try {
    await navigator.clipboard.writeText(button.dataset.copyCoupon);
    announce(`Đã sao chép mã ${button.dataset.copyCoupon}.`);
  } catch (error) {
    console.error("Không thể sao chép mã giảm giá:", error);
    announce("Không thể sao chép mã. Vui lòng ghi lại mã hiển thị.");
  }
});

sizeOptions.addEventListener("click", event => {
  const variantButton = event.target.closest(".size-option");
  if (!variantButton) {
    return;
  }

  selectedSize = variantButton.dataset.size;
  selectedVariantId = variantButton.dataset.variantId;
  sizeOptions.querySelectorAll(".size-option").forEach(button => {
    const isSelected = button === variantButton;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
  updateDetailSummary();
});

detailQuantityDecrease.addEventListener("click", () => {
  selectedQuantity = Math.max(1, selectedQuantity - 1);
  detailQuantity.textContent = selectedQuantity;
  updateDetailSummary();
});

detailQuantityIncrease.addEventListener("click", () => {
  selectedQuantity += 1;
  detailQuantity.textContent = selectedQuantity;
  updateDetailSummary();
});

detailAddButton.addEventListener("click", () => {
  if (addToCart(selectedProduct, selectedVariantId, selectedQuantity)) {
    closeDetail();
  }
});

detailCheckoutButton.addEventListener("click", () => {
  if (!addToCart(selectedProduct, selectedVariantId, selectedQuantity)) {
    return;
  }

  closeDetail(false);
  window.setTimeout(openCheckout, 20);
});

cartTrigger.addEventListener("click", openCart);
cartClose.addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", () => closeCart());
detailClose.addEventListener("click", () => closeDetail());
detailBackdrop.addEventListener("click", () => closeDetail());

document.addEventListener("keydown", event => {
  if (!authModal.hidden && event.key === "Tab") {
    const focusableElements = Array.from(
      authModal.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      )
    ).filter(element => element.offsetParent !== null);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
    return;
  }

  if (event.key !== "Escape") {
    return;
  }

  if (orderPanel.classList.contains("is-open")) {
    closeOrderSummary();
  } else if (checkoutPanel.classList.contains("is-open")) {
    closeCheckout();
  } else if (!authModal.hidden) {
    closeAuthModal();
  } else if (detailPanel.classList.contains("is-open")) {
    closeDetail();
  } else if (cartPanel.classList.contains("is-open")) {
    closeCart();
  }
});

checkoutButton.addEventListener("click", () => {
  if (!checkoutButton.disabled) {
    openCheckout();
  }
});

checkoutClose.addEventListener("click", () => closeCheckout());
checkoutBackdrop.addEventListener("click", () => closeCheckout());
orderClose.addEventListener("click", closeOrderSummary);
orderContinueButton.addEventListener("click", closeOrderSummary);
orderBackdrop.addEventListener("click", closeOrderSummary);
accountTrigger.addEventListener("click", () => {
  if (authenticatedUser) {
    window.location.href = "/account";
    return;
  }
  openAuthModal("login");
});
authClose.addEventListener("click", closeAuthModal);
authModal.addEventListener("click", event => {
  if (event.target === authModal) {
    closeAuthModal();
  }
});

authModal.addEventListener("click", event => {
  const viewButton = event.target.closest("[data-auth-view]");
  if (viewButton && !viewButton.classList.contains("auth-tab")) {
    setAuthView(viewButton.dataset.authView);
  }
});

authTabs.forEach(tab => {
  tab.addEventListener("click", () => setAuthView(tab.dataset.authView));
});

authLoginForm.addEventListener("input", () => {
  authLoginForm
    .querySelectorAll("input")
    .forEach(input => input.setCustomValidity(""));
  loginMessage.textContent = "";
});

authRegisterForm.addEventListener("input", () => {
  authRegisterForm
    .querySelectorAll("input")
    .forEach(input => input.setCustomValidity(""));
  registerMessage.textContent = "";
});

authLoginForm.addEventListener("submit", async event => {
  event.preventDefault();
  const emailInput = authLoginForm.elements.namedItem("email");
  const passwordInput = authLoginForm.elements.namedItem("password");

  emailInput.setCustomValidity(
    !emailInput.value.trim()
      ? "Vui lòng nhập email."
      : emailInput.validity.typeMismatch
        ? "Vui lòng nhập địa chỉ email hợp lệ."
        : ""
  );
  passwordInput.setCustomValidity(
    !passwordInput.value
      ? "Vui lòng nhập mật khẩu."
      : passwordInput.value.length < 8
        ? "Mật khẩu cần có ít nhất 8 ký tự."
        : ""
  );

  if (!authLoginForm.reportValidity()) {
    return;
  }

  const submitButton = authLoginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  loginMessage.textContent = "Đang đăng nhập...";
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput.value, password: passwordInput.value }),
    });
    const result = await readAuthResponse(response, "đăng nhập");
    authenticatedUser = result.user;
    refreshHomeAccount(result.user);
    loginMessage.textContent = "Đăng nhập thành công.";
    if (result.user.role === "ADMIN") {
      window.location.assign("/account?tab=admin");
    } else {
      window.setTimeout(closeAuthModal, 650);
    }
  } catch (error) {
    loginMessage.textContent = error instanceof Error ? error.message : "Không thể đăng nhập.";
  } finally {
    submitButton.disabled = false;
  }
});

authRegisterForm.addEventListener("submit", async event => {
  event.preventDefault();
  const nameInput = authRegisterForm.elements.namedItem("name");
  const emailInput = authRegisterForm.elements.namedItem("email");
  const passwordInput = authRegisterForm.elements.namedItem("password");

  nameInput.setCustomValidity(
    nameInput.value.trim().length < 2
      ? "Vui lòng nhập họ tên gồm ít nhất 2 ký tự."
      : ""
  );
  emailInput.setCustomValidity(
    !emailInput.value.trim()
      ? "Vui lòng nhập email."
      : emailInput.validity.typeMismatch
        ? "Vui lòng nhập địa chỉ email hợp lệ."
        : ""
  );
  passwordInput.setCustomValidity(
    passwordInput.value.length < 8
      ? "Mật khẩu cần có ít nhất 8 ký tự."
      : ""
  );
  registerPasswordConfirm.setCustomValidity(
    registerPasswordConfirm.value.length < 8
      ? "Vui lòng nhập lại mật khẩu gồm ít nhất 8 ký tự."
      : registerPassword.value === registerPasswordConfirm.value
      ? ""
      : "Mật khẩu nhập lại chưa khớp."
  );

  if (!authRegisterForm.reportValidity()) {
    return;
  }

  const submitButton = authRegisterForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  registerMessage.textContent = "Đang tạo tài khoản...";
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: nameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
      }),
    });
    const result = await readAuthResponse(response, "đăng ký");
    authenticatedUser = result.user;
    refreshHomeAccount(result.user);
    registerMessage.textContent = "Tạo tài khoản thành công.";
    window.setTimeout(() => window.location.assign("/account"), 650);
  } catch (error) {
    registerMessage.textContent = error instanceof Error ? error.message : "Không thể tạo tài khoản.";
  } finally {
    submitButton.disabled = false;
  }
});

checkoutForm.addEventListener("change", event => {
  if (event.target.name === "paymentMethod") {
    const isQrPayment = event.target.value === "qr";
    const isInstallment = event.target.value === "installment";
    qrDemoPanel.hidden = !isQrPayment;
    installmentPanel.hidden = !isInstallment;
    if (isQrPayment) qrTransferNote.textContent = checkoutDraftOrderId;
  }
});

checkoutForm.addEventListener("input", () => {
  if (checkoutForm.contains(document.activeElement)) {
    document.activeElement.setCustomValidity("");
  }
  checkoutFormError.textContent = "";
});

savedAddressSelect.addEventListener("change", () => selectSavedAddress(savedAddressSelect.value));
checkoutApplyCoupon.addEventListener("click", () => void applyCheckoutCoupon());
checkoutRemoveCoupon.addEventListener("click", () => {
  appliedCoupon = null;
  checkoutCouponCode.value = "";
  checkoutCouponMessage.textContent = "Đã bỏ mã giảm giá.";
  checkoutRemoveCoupon.hidden = true;
  renderCheckoutOrder();
});
checkoutCouponCode.addEventListener("input", () => {
  if (appliedCoupon && checkoutCouponCode.value.trim().toUpperCase() !== appliedCoupon.code.toUpperCase()) {
    appliedCoupon = null;
    checkoutRemoveCoupon.hidden = true;
    renderCheckoutOrder();
  }
});

checkoutForm.addEventListener("submit", async event => {
  event.preventDefault();
  checkoutFormError.textContent = "";

  if (!validateCheckoutForm()) {
    return;
  }

  if (cart.size === 0) {
    checkoutFormError.textContent =
      "Giỏ hàng đang trống. Hãy thêm sản phẩm trước khi đặt hàng.";
    closeCheckout();
    return;
  }

  const formData = new FormData(checkoutForm);
  const paymentMethod = formData.get("paymentMethod");
  const submitButton = checkoutConfirmButton;
  submitButton.disabled = true;
  submitButton.textContent = "Đang lưu đơn hàng...";
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shippingAddressId: selectedShippingAddressId,
        paymentMethod,
        installmentMonths: paymentMethod === "installment" ? Number(formData.get("installmentMonths")) : undefined,
        installmentProvider: paymentMethod === "installment" ? String(formData.get("installmentProvider")).trim() : undefined,
        discountCode: appliedCoupon?.code || undefined,
        items: Array.from(cart.values()).map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      }),
    });
    const result = await readAuthResponse(response, "đặt hàng");
    const customer = {
      name: result.customerName,
      phone: result.phone,
      address: result.shippingAddress,
    };
    const order = {
      id: result.id,
      createdAt: result.createdAt,
      customer,
      paymentMethod,
      paymentMethodLabel: paymentMethod === "qr"
        ? "Chuyển khoản QR (demo)"
        : paymentMethod === "installment"
          ? `Trả góp ${result.installmentMonths} tháng · ${result.installmentProvider} (chờ đối tác xác nhận)`
          : "Thanh toán khi nhận hàng (COD)",
      items: result.items.map(item => ({
        name: item.variant.product.name,
        size: item.variant.size,
        color: item.variant.color,
        quantity: item.quantity,
        price: item.price,
      })),
      total: result.totalAmount,
    };
    cart.clear();
    updateCart();
    showOrderSummary(order);
    await loadHomeProducts();
  } catch (error) {
    checkoutFormError.textContent =
      error instanceof Error ? error.message : "Không thể lưu đơn hàng. Vui lòng thử lại.";
  } finally {
    submitButton.disabled = !selectedShippingAddressId;
    submitButton.textContent = "Xác nhận đặt hàng";
  }
});

if (new URLSearchParams(window.location.search).get("checkout") === "1") {
  window.setTimeout(openCheckout, 0);
}

document.querySelector("#home-search-form").addEventListener("submit", event => {
  event.preventDefault();
  const query = productSearch.value.trim();
  window.location.href = `shop.html${query ? `?q=${encodeURIComponent(query)}` : ""}`;
});

fetch("/api/auth/session")
  .then(response => {
    if (!response.ok) throw new Error(`Session request failed with status ${response.status}`);
    return response.json();
  })
  .then(result => {
    authenticatedUser = result.user;
    refreshHomeAccount(result.user);
    document.querySelector("#admin-nav-link").hidden = result.user?.role !== "ADMIN";
  })
  .catch(error => {
    console.error("Không thể xác minh phiên tài khoản:", error);
    authenticatedUser = null;
    refreshHomeAccount(null);
    document.querySelector("#admin-nav-link").hidden = true;
  });
