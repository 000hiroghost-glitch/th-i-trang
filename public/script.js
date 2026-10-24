"use strict";

const productGrid = document.querySelector("#product-grid");
const productSearch = document.querySelector("#product-search");
const productTotal = document.querySelector("#product-total");
const emptySearch = document.querySelector("#empty-search");
const categoryFilters = document.querySelector("#category-filters");
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
const qrDemoPanel = document.querySelector("#qr-demo-panel");
const qrTransferNote = document.querySelector("#qr-transfer-note");
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

const currency = new Intl.NumberFormat("vi-VN");
const cart = new Map();
const cartStorageKey = "kcj-cart-v1";
let productCards = [];
let activeCategory = "all";
let selectedProduct = null;
let selectedSize = "";
let selectedQuantity = 1;
let returnFocusElement = null;
let authReturnFocusElement = null;
let toastTimeout;
let storageAvailable = true;
let storageWarningShown = false;
let checkoutDraftOrderId = "";
let authenticatedUser = null;

try {
  localStorage.removeItem("kcj-demo-account-v1");
  localStorage.removeItem("kcj-demo-user-v1");
} catch (error) {
  console.error("Không thể xóa thông tin đăng nhập demo đã lưu:", error);
}

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

const productCatalog = [
  {
    id: "ao-thun-cotton-mem",
    name: "Áo thun cotton mềm",
    price: 329000,
    category: "ao",
    categoryLabel: "ÁO · COTTON 100%",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
    alt: "Áo thun cotton màu trắng kiểu dáng tối giản",
    material: "Cotton 100%",
    fit: "Suông thoải mái",
    care: "Giặt máy ở nhiệt độ thấp, lộn trái khi giặt.",
    description: "Áo thun mềm mại, thoáng mát, dễ kết hợp trong mọi ngày.",
    badge: "BÁN CHẠY",
  },
  {
    id: "ao-so-mi-linen",
    name: "Áo sơ mi linen",
    price: 589000,
    category: "ao",
    categoryLabel: "ÁO · LINEN PHA",
    image:
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=85",
    alt: "Áo sơ mi linen phong cách thanh lịch",
    material: "Linen pha cotton",
    fit: "Suông vừa",
    care: "Giặt nhẹ với nước mát, phơi nơi thoáng gió.",
    description: "Chất vải linen thoáng nhẹ, phù hợp với phong cách thanh lịch.",
    badge: "MỚI",
  },
  {
    id: "quan-ong-rong-thanh-lich",
    name: "Quần ống rộng thanh lịch",
    price: 649000,
    category: "quan",
    categoryLabel: "QUẦN · DÁNG RỘNG",
    image:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=85",
    alt: "Quần dài dáng rộng màu trung tính",
    material: "Cotton pha tái chế",
    fit: "Ống rộng, cạp vừa",
    care: "Giặt riêng với màu tương tự, không dùng chất tẩy.",
    description: "Phom quần rộng thoải mái, dễ phối đồ đi làm hoặc dạo phố.",
  },
  {
    id: "ao-khoac-det-nhe",
    name: "Áo khoác dệt nhẹ",
    price: 799000,
    category: "ao-khoac",
    categoryLabel: "ÁO KHOÁC · DỆT NHẸ",
    image:
      "https://images.unsplash.com/photo-1548126032-079a0fb0099d?auto=format&fit=crop&w=900&q=85",
    alt: "Áo khoác thời trang phong cách tối giản",
    material: "Cotton pha acrylic",
    fit: "Suông vừa, dễ phối lớp",
    care: "Giặt tay nhẹ nhàng, phơi ngang để giữ phom.",
    description: "Lớp khoác nhẹ nhàng cho những ngày thời tiết dịu mát.",
    badge: "-15%",
  },
  {
    id: "ao-thun-oversize-kcj",
    name: "Áo thun oversize KCJ",
    price: 359000,
    category: "ao",
    categoryLabel: "ÁO · DÁNG OVERSIZE",
    image:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85",
    alt: "Áo thun oversize phong cách đường phố",
    material: "Cotton compact 100%",
    fit: "Oversize",
    care: "Giặt máy ở nhiệt độ thấp, không sấy nóng.",
    description: "Phom rộng năng động, tạo cảm giác thoải mái suốt ngày dài.",
  },
  {
    id: "hoodie-cotton-classic",
    name: "Hoodie cotton classic",
    price: 729000,
    category: "ao",
    categoryLabel: "ÁO · NỈ COTTON",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85",
    alt: "Áo hoodie cotton dáng cơ bản",
    material: "Nỉ cotton pha",
    fit: "Suông rộng",
    care: "Lộn trái áo khi giặt và tránh ủi trực tiếp lên hình in.",
    description: "Hoodie mềm ấm, thiết kế tối giản để mặc quanh năm.",
    badge: "BÁN CHẠY",
  },
  {
    id: "ao-polo-essential",
    name: "Áo polo essential",
    price: 429000,
    category: "ao",
    categoryLabel: "ÁO · PIQUÉ COTTON",
    image:
      "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?auto=format&fit=crop&w=900&q=85",
    alt: "Áo polo cotton màu trung tính",
    material: "Cotton piqué",
    fit: "Regular fit",
    care: "Giặt nhẹ, dựng cổ áo khi phơi.",
    description: "Chiếc polo gọn gàng, phù hợp từ ngày thường đến cuối tuần.",
  },
  {
    id: "quan-jeans-straight",
    name: "Quần jeans straight",
    price: 699000,
    category: "quan",
    categoryLabel: "QUẦN · DENIM",
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=85",
    alt: "Quần jeans xanh ống đứng",
    material: "Denim cotton",
    fit: "Ống đứng, cạp vừa",
    care: "Lộn trái, giặt với nước lạnh để giữ màu denim.",
    description: "Phom ống đứng cổ điển, dễ phối với áo thun và sơ mi.",
  },
  {
    id: "quan-jeans-ong-rong",
    name: "Quần jeans ống rộng",
    price: 749000,
    category: "quan",
    categoryLabel: "QUẦN · DENIM RỘNG",
    image:
      "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=900&q=85",
    alt: "Quần jeans dáng rộng thời trang",
    material: "Denim cotton pha",
    fit: "Ống rộng, cạp cao",
    care: "Giặt riêng lần đầu, tránh phơi trực tiếp dưới nắng gắt.",
    description: "Dáng rộng hiện đại với phần cạp cao tôn dáng.",
  },
  {
    id: "chan-vay-midi",
    name: "Chân váy midi mềm",
    price: 559000,
    category: "vay",
    categoryLabel: "VÁY · MIDI",
    image:
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=900&q=85",
    alt: "Chân váy midi nữ tính",
    material: "Rayon pha",
    fit: "Dáng chữ A, dài midi",
    care: "Giặt tay hoặc giặt máy ở chế độ đồ mỏng.",
    description: "Chân váy mềm rủ nhẹ, chuyển động tự nhiên theo từng bước chân.",
    badge: "MỚI",
  },
  {
    id: "vay-linen-daily",
    name: "Váy linen daily",
    price: 829000,
    category: "vay",
    categoryLabel: "VÁY · LINEN",
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85",
    alt: "Váy linen dáng suông nhẹ",
    material: "Linen pha viscose",
    fit: "Dáng suông, dài qua gối",
    care: "Giặt nhẹ bằng nước mát, ủi ở nhiệt độ thấp.",
    description: "Thiết kế thoáng mát, nhẹ nhàng cho những ngày cần sự thoải mái.",
  },
  {
    id: "ao-khoac-denim",
    name: "Áo khoác denim vintage",
    price: 899000,
    category: "ao-khoac",
    categoryLabel: "ÁO KHOÁC · DENIM",
    image:
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=900&q=85",
    alt: "Áo khoác denim xanh kiểu vintage",
    material: "Denim cotton",
    fit: "Suông cổ điển",
    care: "Lộn trái áo khi giặt, giặt riêng với đồ sáng màu.",
    description: "Áo khoác denim cá tính, dễ dàng kết hợp nhiều phong cách.",
  },
  {
    id: "blazer-minimal",
    name: "Blazer minimal",
    price: 1090000,
    category: "ao-khoac",
    categoryLabel: "ÁO KHOÁC · BLAZER",
    image:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85",
    alt: "Áo blazer phom tối giản",
    material: "Polyester pha rayon",
    fit: "Suông nhẹ, vai tự nhiên",
    care: "Ưu tiên giặt khô để giữ phom áo.",
    description: "Blazer phom nhẹ với đường cắt gọn gàng cho phong cách hiện đại.",
  },
  {
    id: "cardigan-knit",
    name: "Cardigan knit nhẹ",
    price: 679000,
    category: "ao-khoac",
    categoryLabel: "ÁO KHOÁC · LEN DỆT",
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=85",
    alt: "Áo cardigan dệt kim nhẹ",
    material: "Cotton pha len",
    fit: "Suông thoải mái",
    care: "Giặt tay nhẹ, phơi ngang trên mặt phẳng.",
    description: "Lớp cardigan mềm nhẹ để phối cùng trang phục thường ngày.",
  },
  {
    id: "tui-tote-canvas",
    name: "Túi tote canvas KCJ",
    price: 289000,
    category: "phu-kien",
    categoryLabel: "PHỤ KIỆN · TÚI",
    image:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85",
    alt: "Túi tote vải canvas tiện dụng",
    material: "Canvas cotton dày",
    fit: "Kích thước 36 × 40 cm",
    care: "Giặt tay, không ngâm lâu.",
    description: "Túi vải gọn nhẹ, tiện mang theo khi đi học hoặc dạo phố.",
  },
  {
    id: "mu-luoi-trai-basic",
    name: "Mũ lưỡi trai basic",
    price: 249000,
    category: "phu-kien",
    categoryLabel: "PHỤ KIỆN · MŨ",
    image:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=85",
    alt: "Mũ lưỡi trai màu trung tính",
    material: "Cotton twill",
    fit: "Dây điều chỉnh, freesize",
    care: "Lau sạch bằng khăn ẩm, không giặt máy.",
    description: "Phụ kiện nhỏ gọn giúp hoàn thiện bộ trang phục mỗi ngày.",
  },
  {
    id: "tat-cotton-everyday",
    name: "Tất cotton everyday",
    price: 99000,
    category: "phu-kien",
    categoryLabel: "PHỤ KIỆN · TẤT",
    image:
      "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=900&q=85",
    alt: "Tất cotton cổ vừa màu trắng",
    material: "Cotton pha elastane",
    fit: "Cổ vừa, freesize 36–42",
    care: "Giặt với nước mát, phơi nơi thoáng khí.",
    description: "Tất mềm thoáng khí, phù hợp với nhiều kiểu giày khác nhau.",
  },
  {
    id: "sneaker-everyday",
    name: "Sneaker everyday",
    price: 899000,
    category: "giay",
    categoryLabel: "GIÀY · SNEAKER",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
    alt: "Giày sneaker phong cách năng động",
    material: "Vải dệt, đế cao su",
    fit: "Size 36–42",
    care: "Lau nhẹ bằng khăn ẩm và để khô tự nhiên.",
    description: "Đôi sneaker êm nhẹ cho nhịp sống năng động hằng ngày.",
  },
  {
    id: "sandals-minimal",
    name: "Sandals minimal",
    price: 499000,
    category: "giay",
    categoryLabel: "GIÀY · SANDALS",
    image:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85",
    alt: "Sandals thiết kế tối giản",
    material: "Da tổng hợp, đế cao su",
    fit: "Size 36–41",
    care: "Lau sạch sau khi sử dụng, tránh ngâm nước lâu.",
    description: "Sandals tối giản, nhẹ nhàng cho những chuyến đi ngày nắng.",
  },
  {
    id: "that-lung-basic",
    name: "Thắt lưng basic",
    price: 319000,
    category: "phu-kien",
    categoryLabel: "PHỤ KIỆN · THẮT LƯNG",
    image:
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=85",
    alt: "Thắt lưng màu nâu phong cách tối giản",
    material: "Da tổng hợp",
    fit: "Dài 105 cm, có thể điều chỉnh",
    care: "Lau bằng khăn mềm, bảo quản nơi khô thoáng.",
    description: "Chi tiết tinh tế giúp trang phục thường ngày thêm chỉn chu.",
  },
];

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
    if (
      !product &&
      typeof savedItem.productId === "string" &&
      typeof savedItem.name === "string" &&
      Number.isFinite(savedItem.price) &&
      savedItem.price >= 0 &&
      typeof savedItem.image === "string"
    ) {
      product = {
        id: savedItem.productId,
        name: savedItem.name,
        price: savedItem.price,
        image: savedItem.image,
        alt: savedItem.name,
        categoryLabel: "SẢN PHẨM KCJ",
        material: "Thông tin sản phẩm",
        fit: "Theo mô tả sản phẩm",
        care: "Thực hiện theo hướng dẫn trên nhãn sản phẩm.",
        description: "Sản phẩm từ bộ sưu tập Streetwear KCJ.",
      };
    }
    const validSize = ["S", "M", "L", "XL"].includes(savedItem.size);
    const validQuantity =
      Number.isSafeInteger(savedItem.quantity) &&
      savedItem.quantity > 0 &&
      savedItem.quantity <= 999;

    if (!product || !validSize || !validQuantity) {
      console.warn("Bỏ qua một sản phẩm không hợp lệ trong giỏ hàng đã lưu.");
      return;
    }

    const itemId = `${product.id}:${savedItem.size}`;
    const existing = cart.get(itemId);
    if (existing) {
      existing.quantity = Math.min(999, existing.quantity + savedItem.quantity);
      return;
    }

    cart.set(itemId, {
      id: itemId,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: savedItem.size,
      quantity: savedItem.quantity,
    });

  });
};

const persistCart = () => {
  if (!storageAvailable) {
    return false;
  }

  const savedCart = Array.from(cart.values()).map(item => ({
    productId: item.productId,
    size: item.size,
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

  const actions = createProductActions(product.name);
  footer.append(colors, actions);
  card.append(imageWrap, info, footer);
  return card;
};

const createProductActions = productName => {
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
  buyButton.textContent = "Mua ngay";

  actions.append(detailButton, buyButton);
  return actions;
};

const setupProductCards = () => {
  const existingCards = Array.from(productGrid.querySelectorAll(".product-card"));
  existingCards.forEach(card => {
    const product = productCatalog.find(item => item.id === card.dataset.id);
    if (!product) {
      return;
    }
    card.dataset.category = product.category;
    card.querySelector(".product-price").textContent = formatPrice(product.price);
    const productImage = card.querySelector(".product-image");
    productImage.src = product.image;
    productImage.alt = product.alt;

    const footer = card.querySelector(".product-footer");
    const oldBuyButton = footer.querySelector(".buy-button");
    oldBuyButton.remove();
    footer.append(createProductActions(product.name));
  });

  const existingIds = new Set(existingCards.map(card => card.dataset.id));
  productCatalog
    .filter(product => !existingIds.has(product.id))
    .forEach(product => productGrid.append(createProductCard(product)));

  productCards = Array.from(productGrid.querySelectorAll(".product-card"));
  productTotal.textContent = `${productCards.length} sản phẩm`;
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

  summaryProduct.textContent = selectedProduct.name;
  summarySize.textContent = selectedSize || "Chưa chọn";
  summaryQuantity.textContent = selectedQuantity;
  summaryTotal.textContent = formatPrice(
    selectedProduct.price * selectedQuantity
  );

  const sizeIsSelected = selectedSize.length > 0;
  detailAddButton.disabled = !sizeIsSelected;
  detailCheckoutButton.disabled = !sizeIsSelected;
  detailValidation.textContent = sizeIsSelected
    ? ""
    : "Chọn Size để thêm sản phẩm vào giỏ hàng.";
};

const openDetail = (product, focusTarget = document.activeElement, size = "") => {
  if (!product) {
    return;
  }

  if (cartPanel.classList.contains("is-open")) {
    closeCart(false);
  }

  selectedProduct = product;
  selectedSize = size;
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
  sizeOptions.querySelectorAll(".size-option").forEach(button => {
    const isSelected = button.dataset.size === selectedSize;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

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

  const itemId = `${product.id}:${size}`;
  const existing = cart.get(itemId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.set(itemId, {
      id: itemId,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size,
      quantity,
    });
  }

  updateCart();
  announce(`Đã thêm ${product.name} · Size ${size} vào giỏ hàng.`);
  return true;
};

const changeQuantity = (itemId, difference) => {
  const item = cart.get(itemId);
  if (!item) {
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
  openDetail(product, focusTarget, item.size);
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
      unitPrice.textContent = `${formatPrice(item.price)} · Size ${item.size}`;

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
  checkoutDraftOrderId = createOrderId();
  qrTransferNote.textContent = checkoutDraftOrderId;
  renderCheckoutOrder();
  checkoutBackdrop.hidden = false;
  requestAnimationFrame(() => checkoutBackdrop.classList.add("is-visible"));
  checkoutPanel.inert = false;
  checkoutPanel.setAttribute("aria-hidden", "false");
  checkoutPanel.classList.add("is-open");
  setModalScrollLock();
  document.querySelector("#customer-name").focus();
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
      description.textContent = `${item.name} · Size ${item.size} × ${item.quantity}`;

      const lineTotal = document.createElement("strong");
      lineTotal.textContent = formatPrice(item.price * item.quantity);

      row.append(description, lineTotal);
      return row;
    })
  );
  checkoutOrderTotal.textContent = formatPrice(subtotal);
};

const validateCheckoutForm = () => {
  const nameInput = checkoutForm.elements.namedItem("customerName");
  const phoneInput = checkoutForm.elements.namedItem("customerPhone");
  const addressInput = checkoutForm.elements.namedItem("customerAddress");
  const paymentInputs = checkoutForm.querySelectorAll(
    'input[name="paymentMethod"]'
  );
  const phone = phoneInput.value.trim();

  nameInput.setCustomValidity(
    nameInput.value.trim().length < 2
      ? "Vui lòng nhập họ tên gồm ít nhất 2 ký tự."
      : ""
  );
  phoneInput.setCustomValidity(
    /^(?:0|\+?84)\d{9,10}$/.test(phone)
      ? ""
      : "Vui lòng nhập số điện thoại hợp lệ bắt đầu bằng 0 hoặc +84."
  );
  addressInput.setCustomValidity(
    addressInput.value.trim().length < 8
      ? "Vui lòng nhập địa chỉ giao hàng đầy đủ."
      : ""
  );

  const hasPaymentMethod = Array.from(paymentInputs).some(input => input.checked);
  paymentInputs.forEach(input => {
    input.setCustomValidity(
      hasPaymentMethod ? "" : "Vui lòng chọn phương thức thanh toán."
    );
  });

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
      ? "Đặt hàng thành công. Đây là bản demo; chưa có giao dịch chuyển khoản nào được thực hiện."
      : "Đặt hàng thành công. Đây là bản demo; chưa có yêu cầu giao hàng thật được gửi.";
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

setupProductCards();
restoreCart();
applyFilters();
updateCart();

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

sizeOptions.addEventListener("click", event => {
  const sizeButton = event.target.closest(".size-option");
  if (!sizeButton) {
    return;
  }

  selectedSize = sizeButton.dataset.size;
  sizeOptions.querySelectorAll(".size-option").forEach(button => {
    const isSelected = button === sizeButton;
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
  if (addToCart(selectedProduct, selectedSize, selectedQuantity)) {
    closeDetail();
  }
});

detailCheckoutButton.addEventListener("click", () => {
  if (!addToCart(selectedProduct, selectedSize, selectedQuantity)) {
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
    window.location.href = "dashboard.html";
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
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Không thể đăng nhập.");
    authenticatedUser = result.user;
    refreshHomeAccount(result.user);
    loginMessage.textContent = "Đăng nhập thành công.";
    if (result.user.role === "ADMIN") window.location.assign("/admin/orders");
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
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Không thể tạo tài khoản.");
    authenticatedUser = result.user;
    refreshHomeAccount(result.user);
    registerMessage.textContent = "Tạo tài khoản thành công.";
    window.setTimeout(() => window.location.assign("/dashboard.html"), 650);
  } catch (error) {
    registerMessage.textContent = error instanceof Error ? error.message : "Không thể tạo tài khoản.";
  } finally {
    submitButton.disabled = false;
  }
});

checkoutForm.addEventListener("change", event => {
  if (event.target.name !== "paymentMethod") {
    return;
  }

  const isQrPayment = event.target.value === "qr";
  qrDemoPanel.hidden = !isQrPayment;
  if (isQrPayment) {
    qrTransferNote.textContent = checkoutDraftOrderId;
  }
});

checkoutForm.addEventListener("input", () => {
  if (checkoutForm.contains(document.activeElement)) {
    document.activeElement.setCustomValidity("");
  }
  checkoutFormError.textContent = "";
});

checkoutForm.addEventListener("submit", event => {
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
  const items = Array.from(cart.values()).map(item => ({ ...item }));
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const order = {
    id: checkoutDraftOrderId || createOrderId(),
    createdAt: new Date().toISOString(),
    accountEmail: (() => {
      return authenticatedUser?.email || "";
    })(),
    customer: {
      name: String(formData.get("customerName")).trim(),
      phone: String(formData.get("customerPhone")).trim(),
      address: String(formData.get("customerAddress")).trim(),
    },
    paymentMethod,
    paymentMethodLabel:
      paymentMethod === "qr"
        ? "Chuyển khoản QR (demo)"
        : "Thanh toán khi nhận hàng (COD)",
    items,
    total,
  };

  let orderHistory;
  try {
    orderHistory = JSON.parse(
      localStorage.getItem("kcj-order-history-v1") || "[]"
    );
    if (!Array.isArray(orderHistory)) {
      throw new TypeError("Lịch sử đơn hàng không đúng định dạng.");
    }
    localStorage.setItem(
      "kcj-order-history-v1",
      JSON.stringify([order, ...orderHistory].slice(0, 100))
    );
  } catch (error) {
    console.error("Không thể lưu lịch sử đơn hàng:", error);
    checkoutFormError.textContent =
      "Chưa thể lưu lịch sử đơn hàng trên thiết bị này. Vui lòng kiểm tra quyền lưu trữ rồi thử lại.";
    return;
  }

  if (clearStoredCartForOrder()) {
    showOrderSummary(order);
  } else {
    try {
      const savedOrders = JSON.parse(
        localStorage.getItem("kcj-order-history-v1") || "[]"
      );
      localStorage.setItem(
        "kcj-order-history-v1",
        JSON.stringify(
          Array.isArray(savedOrders)
            ? savedOrders.filter(savedOrder => savedOrder.id !== order.id)
            : []
        )
      );
    } catch (error) {
      console.error("Không thể hoàn tác lịch sử đơn chưa hoàn tất:", error);
    }
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
