"use strict";

(() => {
  const CART_KEY = "kcj-cart-v1";
  const ACCOUNT_KEY = "kcj-demo-account-v1";
  const SESSION_KEY = "kcj-demo-user-v1";
  const ORDER_KEY = "kcj-order-history-v1";
  const currency = new Intl.NumberFormat("vi-VN");
  const pageName = document.body.dataset.page || "";
  let cart = [];

  const formatPrice = value => `${currency.format(value)}₫`;
  const readStoredValue = (key, fallback) => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? fallback : JSON.parse(stored);
    } catch (error) {
      console.error(`Không thể đọc dữ liệu ${key}:`, error);
      showToast("Không thể đọc dữ liệu đã lưu. Vui lòng kiểm tra bộ nhớ trình duyệt.");
      return fallback;
    }
  };
  const writeStoredValue = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Không thể lưu dữ liệu ${key}:`, error);
      showToast("Không thể lưu thay đổi trên thiết bị này. Vui lòng kiểm tra quyền lưu trữ.");
      return false;
    }
  };

  document.querySelector("#site-announcement").innerHTML =
    '<div class="announcement-bar">Miễn phí giao hàng cho đơn từ 699.000₫ <span aria-hidden="true">✦</span> Đổi trả dễ dàng trong 7 ngày</div>';
  document.querySelector("#site-header").innerHTML = `
    <div class="site-header">
      <a class="brand" href="index.html" aria-label="KCJ — Trang chủ">KCJ<span>.</span></a>
      <form class="search-form" id="site-search-form" role="search">
        <label class="sr-only" for="site-search">Tìm kiếm sản phẩm</label>
        <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 4.2 4.2"></path></svg>
        <input id="site-search" name="q" type="search" placeholder="Tìm chiếc áo bạn yêu..." autocomplete="off" />
      </form>
      <div class="header-actions">
        <button class="account-trigger" id="account-trigger" type="button" aria-label="Mở đăng nhập hoặc đăng ký">
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"></circle><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0"></path></svg>
          <span class="account-label" id="account-label">Tài khoản</span>
        </button>
        <button class="cart-trigger" id="cart-trigger" type="button" aria-label="Mở giỏ hàng" aria-controls="cart-panel" aria-expanded="false">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 8H6"></path><circle cx="10" cy="20" r="1"></circle><circle cx="18" cy="20" r="1"></circle></svg>
          <span class="cart-label">Giỏ hàng</span><span class="cart-count" id="cart-count" aria-live="polite">0</span>
        </button>
      </div>
    </div>
    <nav class="primary-nav" aria-label="Điều hướng chính">
      <a href="index.html" data-nav-page="home">Trang chủ</a>
      <a href="shop.html" data-nav-page="shop">Cửa hàng</a>
      <a href="about.html" data-nav-page="about">Giới thiệu</a>
      <a href="contact.html" data-nav-page="contact">Liên hệ</a>
      <a href="policy.html" data-nav-page="policy">Chính sách</a>
    </nav>`;
  const activeLink = document.querySelector(`[data-nav-page="${pageName}"]`);
  if (activeLink) {
    activeLink.setAttribute("aria-current", "page");
  }

  document.querySelector("#site-footer").innerHTML = `
    <footer class="site-footer">
      <div class="footer-main">
        <div class="footer-brand"><a class="brand brand-footer" href="index.html">KCJ<span>.</span></a><p>Mặc điều bạn yêu.<br />Minimalist Streetwear, dành cho nhịp sống của bạn.</p></div>
        <div class="footer-column"><h2>Liên hệ</h2><a href="mailto:000hiroghost@gmail.com">000hiroghost@gmail.com</a><a href="tel:+84929332399">0929 332 399</a></div>
        <div class="footer-column"><h2>Ghé thăm</h2><a href="contact.html">135 Nguyễn Huệ, Quận 1</a><span>TP. Hồ Chí Minh, Việt Nam</span><span>Thứ 2 – Thứ 7, 9:00 – 18:00</span></div>
        <div class="footer-column"><h2>Khám phá</h2><a href="index.html">Trang chủ</a><a href="shop.html">Cửa hàng</a><a href="about.html">Giới thiệu</a><a href="contact.html">Liên hệ</a><a href="policy.html">Chính sách</a><a href="dashboard.html">Tài khoản của tôi</a></div>
        <div class="footer-column"><h2>Theo dõi KCJ</h2><a href="https://www.facebook.com/profile.php?id=61578550865354" target="_blank" rel="noreferrer">Facebook ↗</a><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram ↗</a></div>
      </div>
      <div class="footer-bottom"><span>© 2026 KCJ. Mọi quyền được bảo lưu.</span><span>Thiết kế bằng sự trân trọng dành cho bạn.</span></div>
    </footer>`;

  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="cart-backdrop" id="cart-backdrop" hidden></div>
    <aside class="cart-panel" id="cart-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title" aria-hidden="true" inert>
      <div class="cart-panel-header"><div><p class="eyebrow">KCJ · YOUR PICKS</p><h2 id="cart-title">Giỏ hàng <span id="cart-panel-count">(0)</span></h2></div><button class="cart-close" id="cart-close" type="button" aria-label="Đóng giỏ hàng"><span aria-hidden="true">×</span></button></div>
      <div class="cart-items" id="cart-items"></div>
      <div class="cart-summary"><div class="cart-subtotal"><span>Tạm tính</span><strong id="cart-subtotal">0₫</strong></div><p>Thông tin đặt hàng sẽ tiếp tục tại trang chủ.</p><a class="checkout-button cart-checkout-link" id="checkout-link" href="index.html?checkout=1">Tiến hành đặt hàng</a></div>
    </aside>
    <div class="auth-backdrop" id="auth-modal" hidden>
      <section class="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title" aria-describedby="auth-description">
        <button class="auth-close" id="auth-close" type="button" aria-label="Đóng cửa sổ tài khoản"><span aria-hidden="true">×</span></button>
        <div class="auth-brand-mark" aria-hidden="true">KCJ<span>.</span></div><p class="eyebrow">CHÀO MỪNG BẠN ĐẾN VỚI KCJ</p>
        <h2 class="auth-title" id="auth-title">Tài khoản của bạn</h2><p class="auth-description" id="auth-description">Đăng nhập hoặc tạo tài khoản để tiếp tục hành trình cùng KCJ.</p>
        <div class="auth-tabs" role="tablist" aria-label="Đăng nhập hoặc đăng ký"><button class="auth-tab is-active" id="page-login-tab" type="button" role="tab" aria-selected="true" aria-controls="page-login-form" data-auth-view="login">Đăng nhập</button><button class="auth-tab" id="page-register-tab" type="button" role="tab" aria-selected="false" aria-controls="page-register-form" data-auth-view="register">Đăng ký</button></div>
        <form class="auth-form" id="page-login-form" role="tabpanel" aria-labelledby="page-login-tab" novalidate>
          <label class="auth-field"><span>Email</span><input name="email" type="email" autocomplete="email" maxlength="254" placeholder="ten@email.com" required /></label>
          <label class="auth-field"><span>Mật khẩu</span><input name="password" type="password" autocomplete="current-password" minlength="8" maxlength="128" placeholder="Nhập mật khẩu" required /></label>
          <p class="auth-message" id="page-login-message" role="status" aria-live="polite"></p><button class="auth-submit" type="submit">Đăng nhập</button>
          <p class="auth-switch-copy">Chưa có tài khoản? <button class="auth-switch-button" type="button" data-auth-view="register">Tạo tài khoản</button></p>
        </form>
        <form class="auth-form" id="page-register-form" role="tabpanel" aria-labelledby="page-register-tab" novalidate hidden>
          <label class="auth-field"><span>Họ và tên</span><input name="name" type="text" autocomplete="name" minlength="2" maxlength="100" placeholder="Nguyễn Minh Anh" required /></label>
          <label class="auth-field"><span>Email</span><input name="email" type="email" autocomplete="email" maxlength="254" placeholder="ten@email.com" required /></label>
          <label class="auth-field"><span>Mật khẩu</span><input name="password" type="password" autocomplete="new-password" minlength="8" maxlength="128" placeholder="Tối thiểu 8 ký tự" required /></label>
          <label class="auth-field"><span>Nhập lại mật khẩu</span><input name="passwordConfirm" type="password" autocomplete="new-password" minlength="8" maxlength="128" placeholder="Nhập lại mật khẩu" required /></label>
          <p class="auth-message" id="page-register-message" role="status" aria-live="polite"></p><button class="auth-submit" type="submit">Tạo tài khoản</button>
          <p class="auth-switch-copy">Đã có tài khoản? <button class="auth-switch-button" type="button" data-auth-view="login">Đăng nhập</button></p>
        </form>
        <p class="auth-demo-note">Tài khoản chỉ dùng để minh họa trên thiết bị này. Không nhập mật khẩu đang sử dụng ở dịch vụ khác.</p>
      </section>
    </div>
    <div class="toast" id="site-toast" role="status" aria-live="polite"></div>`
  );

  const cartTrigger = document.querySelector("#cart-trigger");
  const cartPanel = document.querySelector("#cart-panel");
  const cartBackdrop = document.querySelector("#cart-backdrop");
  const authModal = document.querySelector("#auth-modal");
  const toast = document.querySelector("#site-toast");
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }

  const readCart = () => {
    const saved = readStoredValue(CART_KEY, []);
    if (!Array.isArray(saved)) {
      console.error("Dữ liệu giỏ hàng không đúng định dạng.");
      return [];
    }
    return saved.filter(item =>
      item &&
      typeof item.productId === "string" &&
      ["S", "M", "L", "XL"].includes(item.size) &&
      Number.isSafeInteger(item.quantity) &&
      item.quantity > 0 &&
      item.quantity <= 999
    );
  };

  const saveCart = () => {
    const saved = cart.map(item => ({
      productId: item.productId,
      size: item.size,
      quantity: item.quantity,
      name: item.name,
      price: item.price,
      image: item.image,
    }));
    try {
      if (saved.length) {
        localStorage.setItem(CART_KEY, JSON.stringify(saved));
      } else {
        localStorage.removeItem(CART_KEY);
      }
    } catch (error) {
      console.error("Không thể lưu giỏ hàng:", error);
      showToast("Không thể lưu giỏ hàng trên thiết bị này.");
    }
  };

  const updateCart = () => {
    const entries = cart;
    const quantity = entries.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = entries.reduce(
      (sum, item) => sum + (Number.isFinite(item.price) ? item.price : 0) * item.quantity,
      0
    );
    document.querySelector("#cart-count").textContent = quantity;
    document.querySelector("#cart-panel-count").textContent = `(${quantity})`;
    document.querySelector("#cart-subtotal").textContent = formatPrice(subtotal);
    const list = document.querySelector("#cart-items");
    const checkoutLink = document.querySelector("#checkout-link");
    checkoutLink.classList.toggle("is-disabled", quantity === 0);
    checkoutLink.setAttribute("aria-disabled", String(quantity === 0));

    if (!entries.length) {
      list.innerHTML = '<p class="cart-empty">Giỏ hàng đang chờ món đồ bạn yêu.</p>';
      saveCart();
      return;
    }

    list.replaceChildren(...entries.map((item, index) => {
      const row = document.createElement("article");
      row.className = "cart-item";
      const image = document.createElement("img");
      image.className = "cart-item-image";
      image.src = item.image || "";
      image.alt = item.name || "Sản phẩm KCJ";
      image.loading = "lazy";
      const details = document.createElement("div");
      details.className = "cart-item-details";
      const name = document.createElement("h3");
      name.textContent = item.name || "Sản phẩm KCJ";
      const description = document.createElement("p");
      description.textContent = `${Number.isFinite(item.price) ? formatPrice(item.price) : "Giá sản phẩm"} · Size ${item.size}`;
      const quantityControl = document.createElement("div");
      quantityControl.className = "cart-item-quantity";
      const decrease = document.createElement("button");
      decrease.type = "button";
      decrease.textContent = "−";
      decrease.setAttribute("aria-label", `Giảm số lượng ${name.textContent}`);
      decrease.addEventListener("click", () => changeQuantity(index, -1));
      const quantityLabel = document.createElement("span");
      quantityLabel.textContent = item.quantity;
      const increase = document.createElement("button");
      increase.type = "button";
      increase.textContent = "+";
      increase.setAttribute("aria-label", `Tăng số lượng ${name.textContent}`);
      increase.addEventListener("click", () => changeQuantity(index, 1));
      quantityControl.append(decrease, quantityLabel, increase);
      details.append(name, description, quantityControl);
      const end = document.createElement("div");
      end.className = "cart-item-end";
      const total = document.createElement("strong");
      total.textContent = Number.isFinite(item.price) ? formatPrice(item.price * item.quantity) : "—";
      const remove = document.createElement("button");
      remove.className = "remove-item";
      remove.type = "button";
      remove.textContent = "Xóa";
      remove.addEventListener("click", () => {
        cart.splice(index, 1);
        updateCart();
      });
      end.append(total, remove);
      row.append(image, details, end);
      return row;
    }));
    saveCart();
  };

  const changeQuantity = (index, difference) => {
    if (!cart[index]) return;
    const nextQuantity = cart[index].quantity + difference;
    if (nextQuantity < 1) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = Math.min(999, nextQuantity);
    }
    updateCart();
  };

  const addToCart = (product, size = "M") => {
    if (!product || !["S", "M", "L", "XL"].includes(size)) {
      console.error("Không thể thêm sản phẩm hoặc Size không hợp lệ.");
      showToast("Sản phẩm hoặc Size không hợp lệ.");
      return false;
    }
    const existing = cart.find(item => item.productId === product.id && item.size === size);
    if (existing) {
      existing.quantity = Math.min(999, existing.quantity + 1);
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size,
        quantity: 1,
      });
    }
    updateCart();
    showToast(`Đã thêm ${product.name} vào giỏ hàng.`);
    return true;
  };

  const openCart = () => {
    cartBackdrop.hidden = false;
    requestAnimationFrame(() => cartBackdrop.classList.add("is-visible"));
    cartPanel.inert = false;
    cartPanel.setAttribute("aria-hidden", "false");
    cartPanel.classList.add("is-open");
    cartTrigger.setAttribute("aria-expanded", "true");
    document.body.classList.add("cart-open");
    document.querySelector("#cart-close").focus();
  };
  const closeCart = (restoreFocus = true) => {
    cartPanel.classList.remove("is-open");
    cartBackdrop.classList.remove("is-visible");
    cartPanel.inert = true;
    cartPanel.setAttribute("aria-hidden", "true");
    cartTrigger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("cart-open");
    window.setTimeout(() => {
      if (!cartPanel.classList.contains("is-open")) cartBackdrop.hidden = true;
    }, 260);
    if (restoreFocus) cartTrigger.focus();
  };

  const session = () => {
    const user = readStoredValue(SESSION_KEY, null);
    return user && typeof user.name === "string" && typeof user.email === "string"
      ? user
      : null;
  };
  const refreshAccount = () => {
    const user = session();
    const label = document.querySelector("#account-label");
    label.textContent = user ? user.name.split(" ")[0] : "Tài khoản";
    document.querySelector("#account-trigger").setAttribute(
      "aria-label",
      user ? `Tài khoản ${user.name}` : "Mở đăng nhập hoặc đăng ký"
    );
  };
  const dashboard = document.querySelector("#dashboard-content");
  const renderDashboard = () => {
    if (!dashboard) return;
    const user = session();
    const gate = document.querySelector("#dashboard-gate");
    const profileSection = document.querySelector("#dashboard-profile-section");
    const profileForm = document.querySelector("#dashboard-profile");
    if (!user) {
      gate.hidden = false;
      profileSection.hidden = true;
      return;
    }
    gate.hidden = true;
    profileSection.hidden = false;
    profileForm.elements.namedItem("name").value = user.name;
    profileForm.elements.namedItem("email").value = user.email;
    profileForm.elements.namedItem("phone").value = user.phone || "";
    const orderList = document.querySelector("#order-history-list");
    const allOrders = readStoredValue(ORDER_KEY, []);
    if (!Array.isArray(allOrders)) {
      console.error("Lịch sử đơn hàng đã lưu không đúng định dạng.");
      showToast("Không thể hiển thị lịch sử đơn hàng đã lưu.");
    }
    const orders = Array.isArray(allOrders)
      ? allOrders.filter(order => order && order.accountEmail === user.email)
      : [];
    document.querySelector("#dashboard-order-count").textContent = `${orders.length} đơn hàng`;
    if (!orders.length) {
      orderList.innerHTML = '<p class="empty-orders">Bạn chưa có đơn hàng nào được lưu cho tài khoản này. Khám phá cửa hàng để chọn món đồ yêu thích nhé.</p>';
      return;
    }
    orderList.replaceChildren(...orders.map(order => {
      const card = document.createElement("article");
      card.className = "history-order-card";
      const header = document.createElement("div");
      header.className = "history-order-header";
      const identifier = document.createElement("strong");
      identifier.textContent = order.id || "Đơn KCJ";
      const amount = document.createElement("strong");
      amount.textContent = formatPrice(Number(order.total) || 0);
      header.append(identifier, amount);
      const date = document.createElement("p");
      const parsedDate = new Date(order.createdAt);
      date.textContent = Number.isNaN(parsedDate.getTime())
        ? "Ngày đặt không xác định"
        : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(parsedDate);
      const items = document.createElement("p");
      items.textContent = Array.isArray(order.items)
        ? order.items.map(item => `${item.name} · ${item.size} × ${item.quantity}`).join(", ")
        : "Chi tiết sản phẩm không có sẵn.";
      const status = document.createElement("span");
      status.className = "order-demo-status";
      status.textContent = "Đơn hàng demo";
      card.append(header, date, items, status);
      return card;
    }));
  };

  const openAuth = (view = "login") => {
    authModal.hidden = false;
    document.body.classList.add("cart-open");
    setAuthView(view);
  };
  let authReturnFocus = null;
  const closeAuth = () => {
    authModal.hidden = true;
    document.body.classList.remove("cart-open");
    document.querySelector("#page-login-form").reset();
    document.querySelector("#page-register-form").reset();
    if (authReturnFocus?.isConnected) authReturnFocus.focus();
  };
  const setAuthView = view => {
    const isLogin = view === "login";
    document.querySelector("#page-login-form").hidden = !isLogin;
    document.querySelector("#page-register-form").hidden = isLogin;
    document.querySelector("#page-login-message").textContent = "";
    document.querySelector("#page-register-message").textContent = "";
    document.querySelectorAll(".auth-tab").forEach(tab => {
      const active = tab.dataset.authView === view;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    document.querySelector("#auth-title").textContent = isLogin
      ? "Chào mừng bạn trở lại"
      : "Tạo tài khoản KCJ";
    document.querySelector("#auth-description").textContent = isLogin
      ? "Đăng nhập để tiếp tục hành trình cùng KCJ."
      : "Tạo tài khoản để lưu lại những món đồ bạn yêu.";
    const form = document.querySelector(isLogin ? "#page-login-form" : "#page-register-form");
    form.querySelector("input").focus();
  };

  document.querySelector("#site-search-form").addEventListener("submit", event => {
    event.preventDefault();
    const query = document.querySelector("#site-search").value.trim();
    window.location.href = `shop.html${query ? `?q=${encodeURIComponent(query)}` : ""}`;
  });
  cartTrigger.addEventListener("click", openCart);
  document.querySelector("#cart-close").addEventListener("click", () => closeCart());
  cartBackdrop.addEventListener("click", () => closeCart());
  document.querySelector("#account-trigger").addEventListener("click", event => {
    if (session()) {
      window.location.href = "dashboard.html";
      return;
    }
    authReturnFocus = event.currentTarget;
    openAuth();
  });
  document.querySelectorAll("[data-open-auth]").forEach(button => {
    button.addEventListener("click", event => {
      authReturnFocus = event.currentTarget;
      openAuth();
    });
  });
  document.querySelector("#auth-close").addEventListener("click", closeAuth);
  document.querySelectorAll("#page-login-form, #page-register-form").forEach(form => {
    form.addEventListener("input", event => {
      event.target.setCustomValidity("");
      const message = form.querySelector(".auth-message");
      message.textContent = "";
    });
  });
  authModal.addEventListener("click", event => {
    if (event.target === authModal) {
      closeAuth();
      return;
    }
    const tab = event.target.closest("[data-auth-view]");
    if (tab) setAuthView(tab.dataset.authView);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (authModal && !authModal.hidden) closeAuth();
      else if (cartPanel.classList.contains("is-open")) closeCart();
    }
  });
  document.querySelector("#page-login-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = form.elements.namedItem("email");
    const password = form.elements.namedItem("password");
    if (!form.reportValidity()) return;
    const normalizedEmail = email.value.trim().toLocaleLowerCase("vi");
    const account = readStoredValue(ACCOUNT_KEY, null);
    const user = {
      name: account && account.email === normalizedEmail
        ? account.name
        : normalizedEmail.split("@")[0],
      email: normalizedEmail,
      phone: account?.email === normalizedEmail ? account.phone || "" : "",
    };
    if (!writeStoredValue(SESSION_KEY, user)) return;
    document.querySelector("#page-login-message").textContent =
      "Đăng nhập demo thành công. Tài khoản được lưu trên thiết bị này.";
    refreshAccount();
    renderDashboard();
    window.setTimeout(closeAuth, 650);
  });
  document.querySelector("#page-register-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.elements.namedItem("name");
    const email = form.elements.namedItem("email");
    const password = form.elements.namedItem("password");
    const passwordConfirm = form.elements.namedItem("passwordConfirm");
    passwordConfirm.setCustomValidity(
      passwordConfirm.value.length < 8
        ? "Vui lòng nhập lại mật khẩu gồm ít nhất 8 ký tự."
        : passwordConfirm.value === password.value
          ? ""
          : "Mật khẩu nhập lại chưa khớp."
    );
    name.setCustomValidity(name.value.trim().length < 2 ? "Vui lòng nhập họ tên gồm ít nhất 2 ký tự." : "");
    if (!form.reportValidity()) return;
    const user = {
      name: name.value.trim(),
      email: email.value.trim().toLocaleLowerCase("vi"),
      phone: "",
    };
    if (!writeStoredValue(ACCOUNT_KEY, user) || !writeStoredValue(SESSION_KEY, user)) return;
    document.querySelector("#page-register-message").textContent =
      "Tạo tài khoản demo thành công. Mật khẩu không được lưu trên thiết bị.";
    refreshAccount();
    renderDashboard();
    window.setTimeout(closeAuth, 650);
  });
  document.querySelector("#contact-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const submitButton = form.querySelector('button[type="submit"]');
    const status = document.querySelector("#contact-form-status");
    submitButton.disabled = true;
    status.textContent = "Đang gửi lời nhắn...";
    status.setAttribute("role", "status");

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        let detail = "";
        try {
          const result = await response.json();
          detail = Array.isArray(result.errors)
            ? result.errors.map(item => item.message).filter(Boolean).join(" ")
            : "";
        } catch (error) {
          console.error("Không đọc được phản hồi lỗi từ Formspree:", error);
        }
        throw new Error(
          detail || `Formspree phản hồi mã lỗi ${response.status}.`
        );
      }

      form.reset();
      status.textContent =
        "Cảm ơn bạn! Lời nhắn đã được gửi thành công đến KCJ.";
    } catch (error) {
      console.error("Không thể gửi biểu mẫu liên hệ:", error);
      status.textContent =
        "Chưa thể gửi lời nhắn. Vui lòng kiểm tra kết nối Internet và thử lại.";
      status.setAttribute("role", "alert");
    } finally {
      submitButton.disabled = false;
    }
  });
  document.querySelector("#dashboard-profile")?.addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const user = session();
    if (!user || !form.reportValidity()) return;
    const updatedUser = {
      name: form.elements.namedItem("name").value.trim(),
      email: user.email,
      phone: form.elements.namedItem("phone").value.trim(),
    };
    if (!writeStoredValue(SESSION_KEY, updatedUser)) return;
    const account = readStoredValue(ACCOUNT_KEY, null);
    if (account?.email === user.email) writeStoredValue(ACCOUNT_KEY, updatedUser);
    refreshAccount();
    showToast("Đã cập nhật thông tin trên thiết bị.");
  });
  document.querySelector("#dashboard-logout")?.addEventListener("click", () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error("Không thể đăng xuất tài khoản demo:", error);
      showToast("Không thể xóa phiên tài khoản trên thiết bị.");
      return;
    }
    refreshAccount();
    renderDashboard();
  });
  cart = readCart();
  updateCart();
  refreshAccount();
  renderDashboard();
  window.addEventListener("storage", event => {
    if (event.key === CART_KEY) {
      cart = readCart();
      updateCart();
    }
    if (event.key === SESSION_KEY) {
      refreshAccount();
      renderDashboard();
    }
  });

  window.KCJSite = { addToCart, showToast, updateCart };
})();
