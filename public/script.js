// ── State ─────────────────────────────────────────────────────────────────────
let state = {
  user: null,
  products: [],
  filteredProducts: [],
  cart: [],
  categories: [],
  selectedCategory: 'All',
  selectedSize: {},   // productId → size
};

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  await checkAuth();
  await loadProducts();
  await loadCategories();
  if (state.user) await loadCart();
}
init();

// ── Auth ──────────────────────────────────────────────────────────────────────
async function checkAuth() {
  const res = await api('GET', '/api/auth/me');
  if (res.loggedIn) setUser(res.user);
}

function setUser(user) {
  state.user = user;
  document.getElementById('auth-area').style.display = 'none';
  const ua = document.getElementById('user-area');
  ua.classList.remove('hidden');
  ua.classList.add('flex');
  document.getElementById('user-name-display').textContent = '👋 ' + user.name.split(' ')[0];
}

function clearUser() {
  state.user = null;
  document.getElementById('auth-area').style.display = '';
  const ua = document.getElementById('user-area');
  ua.classList.add('hidden');
  ua.classList.remove('flex');
  document.getElementById('user-name-display').textContent = '';
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return toast('Fill in all fields');
  const res = await api('POST', '/api/auth/login', { email, password });
  if (res.success) {
    setUser(res.user);
    closeModal('login-modal');
    toast('Welcome back, ' + res.user.name.split(' ')[0] + '! 👋');
    await loadCart();
  } else toast(res.message, 'error');
}

async function doRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  if (!name || !email || !password) return toast('Fill in all fields');
  if (password.length < 6) return toast('Password must be at least 6 characters');
  const res = await api('POST', '/api/auth/register', { name, email, password });
  if (res.success) {
    setUser(res.user);
    closeModal('register-modal');
    toast('Account created! Welcome, ' + res.user.name.split(' ')[0] + '! 🎉');
    await loadCart();
  } else toast(res.message, 'error');
}

async function logout() {
  await api('POST', '/api/auth/logout');
  clearUser();
  state.cart = [];
  updateCartUI();
  toast('Logged out. See you soon!');
  showPage('home');
}

// ── Products ──────────────────────────────────────────────────────────────────
async function loadProducts() {
  const res = await api('GET', '/api/products');
  if (res.success) {
    state.products = res.products;
    state.filteredProducts = res.products;
    renderProducts(res.products);
  }
}

async function loadCategories() {
  const res = await api('GET', '/api/products/meta/categories');
  if (res.success) {
    state.categories = res.categories;
    renderCategoryFilters(res.categories);
  }
}

function renderCategoryFilters(cats) {
  const el = document.getElementById('category-filters');
  el.innerHTML = cats.map(c => `
    <button onclick="selectCategory('${c}')"
      class="category-btn px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${c === state.selectedCategory ? 'bg-dark text-accent border-dark' : 'border-gray-200 hover:border-dark'}"
      data-cat="${c}">${c}</button>
  `).join('');
}

function selectCategory(cat) {
  state.selectedCategory = cat;
  document.querySelectorAll('.category-btn').forEach(b => {
    const active = b.dataset.cat === cat;
    b.className = `category-btn px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${active ? 'bg-dark text-accent border-dark' : 'border-gray-200 hover:border-dark'}`;
  });
  filterProducts();
}

function filterProducts() {
  const q = document.getElementById('search-input').value.toLowerCase();
  state.filteredProducts = state.products.filter(p => {
    const matchCat = state.selectedCategory === 'All' || p.category === state.selectedCategory;
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });
  renderProducts(state.filteredProducts);
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  if (!products.length) {
    grid.innerHTML = `<div class="col-span-full text-center py-16 text-gray-400">
      <i class="fa-solid fa-shirt text-4xl mb-3 opacity-30"></i>
      <p class="text-sm">No products found</p>
    </div>`;
    return;
  }
  grid.innerHTML = products.map(p => {
    const sizes = p.sizes.split(',');
    const selectedSize = state.selectedSize[p.id] || sizes[0];
    return `
    <div class="product-card bg-white rounded-2xl overflow-hidden cursor-pointer" onclick="openProductModal(${p.id})">
      <div class="relative overflow-hidden aspect-[3/4]">
        <img src="${p.image_url}" alt="${p.name}" class="card-img w-full h-full object-cover" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80'" />
        <div class="card-overlay absolute inset-0"></div>
        <div class="badge-discount absolute top-3 left-3">${p.discount_pct}% OFF</div>
        <div class="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 card-overlay-btn transition-opacity">
          <button onclick="event.stopPropagation();quickAddToCart(${p.id})"
            class="btn-accent w-full py-2 rounded text-xs font-bold uppercase tracking-wider">
            Quick Add
          </button>
        </div>
      </div>
      <div class="p-4">
        <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">${p.category}</p>
        <h3 class="font-semibold text-sm mb-2 leading-tight">${p.name}</h3>
        <div class="flex items-center gap-2 mb-3">
          <span class="font-bold text-base">₹${p.final_price.toLocaleString('en-IN')}</span>
          <span class="text-xs text-gray-400 line-through">₹${p.original_price.toLocaleString('en-IN')}</span>
        </div>
        <div class="flex gap-1 mb-3" onclick="event.stopPropagation()">
          ${sizes.map(s => `
            <button class="size-btn text-xs border border-gray-200 px-2 py-1 rounded ${s === selectedSize ? 'active' : ''}"
              onclick="selectSize(${p.id},'${s}',this)">${s}</button>
          `).join('')}
        </div>
        <button onclick="event.stopPropagation();addToCart(${p.id})"
          class="btn-primary w-full py-2 rounded text-xs uppercase tracking-wider">
          <i class="fa-solid fa-bag-shopping mr-1"></i> Add to Cart
        </button>
      </div>
    </div>`;
  }).join('');
}

function selectSize(productId, size, btn) {
  state.selectedSize[productId] = size;
  btn.closest('.flex').querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function quickAddToCart(productId) {
  addToCart(productId);
}

async function addToCart(productId) {
  if (!state.user) { openModal('login-modal'); return toast('Please login to add to cart'); }
  const product = state.products.find(p => p.id === productId);
  const sizes = product.sizes.split(',');
  const size = state.selectedSize[productId] || sizes[0];
  const res = await api('POST', '/api/cart/add', { product_id: productId, size, quantity: 1 });
  if (res.success) {
    toast(`${product.name} added! 🛍️`);
    await loadCart();
    openCart();
  } else toast(res.message, 'error');
}

function openProductModal(productId) {
  const p = state.products.find(pr => pr.id === productId);
  if (!p) return;
  const sizes = p.sizes.split(',');
  const selectedSize = state.selectedSize[p.id] || sizes[0];
  document.getElementById('product-modal-content').innerHTML = `
    <div class="relative overflow-hidden rounded-tl-2xl rounded-bl-2xl">
      <img src="${p.image_url}" alt="${p.name}" class="w-full h-80 md:h-full object-cover" />
      <div class="badge-discount absolute top-4 left-4">${p.discount_pct}% OFF</div>
    </div>
    <div class="p-6 flex flex-col">
      <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">${p.category}</p>
      <h2 class="font-display text-3xl tracking-wider mb-3">${p.name.toUpperCase()}</h2>
      <div class="flex items-center gap-3 mb-4">
        <span class="font-bold text-2xl">₹${p.final_price.toLocaleString('en-IN')}</span>
        <span class="text-gray-400 line-through">₹${p.original_price.toLocaleString('en-IN')}</span>
        <span class="badge-discount">${p.discount_pct}% OFF</span>
      </div>
      <p class="text-gray-600 text-sm leading-relaxed mb-5">${p.description}</p>
      <div class="mb-5">
        <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Select Size</p>
        <div class="flex gap-2 flex-wrap" id="modal-sizes">
          ${sizes.map(s => `
            <button class="size-btn border border-gray-200 px-4 py-2 rounded text-sm font-medium ${s === selectedSize ? 'active' : ''}"
              onclick="selectSize(${p.id},'${s}',this)">${s}</button>
          `).join('')}
        </div>
      </div>
      <button onclick="addToCart(${p.id});closeModal('product-modal')"
        class="btn-primary py-3 rounded text-sm uppercase tracking-wider mt-auto">
        <i class="fa-solid fa-bag-shopping mr-2"></i> Add to Cart
      </button>
    </div>
  `;
  openModal('product-modal');
}

// ── Cart ──────────────────────────────────────────────────────────────────────
async function loadCart() {
  if (!state.user) return;
  const res = await api('GET', '/api/cart');
  if (res.success) { state.cart = res.items; updateCartUI(); }
}

function updateCartUI() {
  const count = state.cart.reduce((s, i) => s + i.quantity, 0);
  const countEl = document.getElementById('cart-count');
  countEl.textContent = count;
  count > 0 ? countEl.classList.remove('hidden') : countEl.classList.add('hidden');

  const list = document.getElementById('cart-items-list');
  const footer = document.getElementById('cart-footer');

  if (!state.cart.length) {
    list.innerHTML = `<div class="text-center text-gray-400 py-16">
      <i class="fa-solid fa-bag-shopping text-4xl mb-3 opacity-30"></i>
      <p class="text-sm">Your cart is empty</p>
      <button onclick="closeCart()" class="mt-4 text-xs underline text-dark">Continue Shopping</button>
    </div>`;
    footer.classList.add('hidden');
    return;
  }

  let subtotal = 0, savings = 0;
  list.innerHTML = state.cart.map(item => {
    subtotal += item.price * item.quantity;
    savings += (item.original_price - item.price) * item.quantity;
    return `
    <div class="flex gap-3 items-start">
      <img src="${item.image_url}" alt="${item.name}" class="w-16 h-20 object-cover rounded-lg flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold truncate">${item.name}</p>
        <p class="text-xs text-gray-400 mb-1">Size: ${item.size}</p>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-sm font-bold">₹${item.price.toLocaleString('en-IN')}</span>
          <span class="badge-discount text-[10px]">${item.discount_pct}% OFF</span>
        </div>
        <div class="flex items-center gap-2 mt-1">
          <button onclick="updateCartItem(${item.id}, ${item.quantity - 1})" class="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-100">−</button>
          <span class="text-sm w-4 text-center">${item.quantity}</span>
          <button onclick="updateCartItem(${item.id}, ${item.quantity + 1})" class="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-100">+</button>
          <button onclick="removeCartItem(${item.id})" class="ml-auto text-gray-400 hover:text-red-500 text-xs"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>`;
  }).join('<hr class="border-gray-100" />');

  document.getElementById('cart-subtotal').textContent = '₹' + subtotal.toLocaleString('en-IN');
  document.getElementById('cart-savings').textContent = '₹' + savings.toLocaleString('en-IN');
  document.getElementById('cart-total').textContent = '₹' + subtotal.toLocaleString('en-IN');
  footer.classList.remove('hidden');
}

async function updateCartItem(id, qty) {
  await api('PUT', `/api/cart/update/${id}`, { quantity: qty });
  await loadCart();
}
async function removeCartItem(id) {
  await api('DELETE', `/api/cart/remove/${id}`);
  await loadCart();
}

function openCart() {
  document.getElementById('cart-sidebar').classList.add('open');
  document.getElementById('cart-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cart-sidebar').classList.remove('open');
  document.getElementById('cart-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Checkout ──────────────────────────────────────────────────────────────────
function proceedToCheckout() {
  if (!state.user) { closeCart(); openModal('login-modal'); return; }
  if (!state.cart.length) return toast('Cart is empty');

  const PLATFORM_FEE = 5;
  const DELIVERY_FREE_ABOVE = 999;

  let subtotal = 0, savings = 0;
  state.cart.forEach(i => {
    subtotal += i.price * i.quantity;
    savings += (i.original_price - i.price) * i.quantity;
  });

  const deliveryFee = subtotal >= DELIVERY_FREE_ABOVE ? 0 : 49;
  const total = subtotal + PLATFORM_FEE + deliveryFee;

  document.getElementById('checkout-subtotal').textContent = '₹' + subtotal.toLocaleString('en-IN');
  document.getElementById('checkout-savings').textContent  = '₹' + savings.toLocaleString('en-IN');
  document.getElementById('checkout-platform-fee').textContent = '₹' + PLATFORM_FEE;

  if (deliveryFee === 0) {
    document.getElementById('checkout-delivery').textContent = 'FREE';
    document.getElementById('checkout-delivery').className = 'text-green-600 font-medium';
    document.getElementById('checkout-free-delivery-msg').classList.remove('hidden');
  } else {
    document.getElementById('checkout-delivery').textContent = '₹' + deliveryFee;
    document.getElementById('checkout-delivery').className = 'text-gray-700';
    document.getElementById('checkout-free-delivery-msg').classList.add('hidden');
  }

  document.getElementById('checkout-total').textContent = '₹' + total.toLocaleString('en-IN');

  // Store for placeOrder
  state.checkoutTotal = total;
  state.deliveryFee = deliveryFee;

  closeCart();
  openModal('checkout-modal');
}

async function placeOrder() {
  const address = document.getElementById('checkout-address').value.trim();
  const payment = document.getElementById('checkout-payment').value;
  if (!address) return toast('Please enter delivery address');

  const PLATFORM_FEE = 5;
  const deliveryFee = state.deliveryFee || 0;

  const res = await api('POST', '/api/orders/place', {
    address,
    payment_method: payment,
    delivery_fee: deliveryFee,
    platform_fee: PLATFORM_FEE
  });

  if (res.success) {
    closeModal('checkout-modal');
    state.cart = [];
    state.checkoutTotal = 0;
    state.deliveryFee = 0;
    updateCartUI();
    toast('Order placed successfully! 🎉');
    showPage('orders');
  } else toast(res.message, 'error');
}

// ── Orders ────────────────────────────────────────────────────────────────────
async function loadOrders() {
  if (!state.user) {
    document.getElementById('orders-list').innerHTML = `
      <div class="text-center py-16">
        <i class="fa-solid fa-lock text-4xl mb-4 opacity-30"></i>
        <p class="text-gray-500 mb-4">Login to view your orders</p>
        <button onclick="openModal('login-modal')" class="btn-primary px-8 py-3 rounded text-sm uppercase tracking-wider">Login</button>
      </div>`;
    return;
  }

  const res = await api('GET', '/api/orders/my');
  if (!res.success) return;

  const orders = res.orders;
  const ol = document.getElementById('orders-list');

  if (!orders.length) {
    ol.innerHTML = `<div class="text-center py-16">
      <i class="fa-solid fa-box-open text-4xl mb-4 opacity-30"></i>
      <p class="text-gray-500 mb-4">You haven't placed any orders yet.</p>
      <button onclick="showPage('home')" class="btn-primary px-8 py-3 rounded text-sm uppercase tracking-wider">Shop Now</button>
    </div>`;
    return;
  }

  const statusConfig = {
    Ordered:   { color: 'bg-blue-50 text-blue-600',   icon: 'fa-clock',         label: 'Ordered' },
    Shipping:  { color: 'bg-yellow-50 text-yellow-600', icon: 'fa-truck',        label: 'Out for Delivery' },
    Done:      { color: 'bg-green-50 text-green-600',  icon: 'fa-circle-check',  label: 'Delivered' },
    Cancelled: { color: 'bg-red-50 text-red-500',      icon: 'fa-circle-xmark',  label: 'Cancelled' },
  };

  ol.innerHTML = orders.map(o => {
    const cfg = statusConfig[o.status] || statusConfig.Ordered;
    const firstItem = o.items?.[0];
    return `
    <div class="bg-white border border-gray-100 rounded-2xl p-5 mb-4 hover:shadow-md transition-shadow cursor-pointer"
         onclick="openTrackingModal(${o.id})">
      <div class="flex items-start justify-between gap-3 mb-4">
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Order #${o.id}</p>
          <p class="font-semibold text-sm">${new Date(o.created_at).toLocaleDateString('en-IN', {day:'numeric', month:'long', year:'numeric'})}</p>
        </div>
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.color}">
          <i class="fa-solid ${cfg.icon} text-[10px]"></i> ${cfg.label}
        </span>
      </div>

      <!-- Mini Progress Bar -->
      ${o.status !== 'Cancelled' ? `
      <div class="flex items-center gap-0 mb-4">
        ${['Ordered','Shipping','Done'].map((s, i) => {
          const steps = ['Ordered','Shipping','Done'];
          const cur = steps.indexOf(o.status);
          const done = i <= cur;
          return `
          <div class="flex items-center ${i < 2 ? 'flex-1' : ''}">
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all
              ${done ? 'bg-dark text-accent' : 'bg-gray-100 text-gray-400'}">
              ${done ? '✓' : i+1}
            </div>
            ${i < 2 ? `<div class="flex-1 h-0.5 mx-1 ${i < cur ? 'bg-dark' : 'bg-gray-200'}"></div>` : ''}
          </div>`;
        }).join('')}
      </div>
      <div class="flex justify-between text-[10px] text-gray-400 mb-4 -mt-2">
        <span>Ordered</span><span>Shipping</span><span>Delivered</span>
      </div>` : ''}

      <!-- Item Preview -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <i class="fa-solid fa-box text-gray-300"></i>
          <span>${o.item_count} item${o.item_count > 1 ? 's' : ''}
            ${firstItem ? `— ${firstItem.product_name}${o.item_count > 1 ? ` +${o.item_count - 1} more` : ''}` : ''}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-bold text-sm">₹${o.total_amount.toLocaleString('en-IN')}</span>
          <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
        </div>
      </div>
    </div>`;
  }).join('');

  // Store orders in state for modal
  state.orders = orders;
}

function openTrackingModal(orderId) {
  const o = state.orders.find(x => x.id === orderId);
  if (!o) return;

  document.getElementById('tracking-order-id').textContent = `Order #${o.id}`;
  document.getElementById('tracking-address').textContent = o.address || 'N/A';
  document.getElementById('tracking-payment').textContent = o.payment_method || 'COD';
  document.getElementById('tracking-date').textContent = new Date(o.created_at).toLocaleString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  document.getElementById('tracking-total').textContent = '₹' + o.total_amount.toLocaleString('en-IN');

  // Items
  document.getElementById('tracking-items').innerHTML = (o.items || []).map(item => `
    <div class="flex justify-between text-sm">
      <span class="text-gray-600">${item.product_name}
        <span class="text-gray-400 text-xs">(${item.size} × ${item.quantity})</span>
      </span>
      <span class="font-medium">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
    </div>
  `).join('');

  // Steps
  const steps = [
    { key: 'Ordered',  icon: 'fa-bag-shopping', label: 'Order Placed',      desc: 'Your order has been placed' },
    { key: 'Shipping', icon: 'fa-truck',         label: 'Out for Delivery',  desc: 'Rider is on the way' },
    { key: 'Done',     icon: 'fa-circle-check',  label: 'Delivered',         desc: 'Order delivered successfully' },
  ];
  const currentIdx = o.status === 'Cancelled' ? -1 : steps.findIndex(s => s.key === o.status);

  if (o.status === 'Cancelled') {
    document.getElementById('tracking-steps').innerHTML = `
      <div class="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
        <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-circle-xmark text-red-500"></i>
        </div>
        <div>
          <p class="font-semibold text-red-600 text-sm">Order Cancelled</p>
          <p class="text-xs text-red-400">This order has been cancelled</p>
        </div>
      </div>`;
  } else {
    document.getElementById('tracking-steps').innerHTML = steps.map((s, i) => {
      const done = i < currentIdx;
      const active = i === currentIdx;
      const pending = i > currentIdx;
      return `
      <div class="flex gap-4 ${i < steps.length - 1 ? 'mb-1' : ''}">
        <div class="flex flex-col items-center">
          <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all
            ${done ? 'bg-accent border-2 border-dark' :
              active ? 'bg-dark text-accent' :
              'bg-gray-100 text-gray-300'}">
            <i class="fa-solid ${done ? 'fa-check text-dark' : s.icon + (active ? ' text-accent' : '')} text-sm"></i>
          </div>
          ${i < steps.length - 1 ? `<div class="w-0.5 h-8 mt-1 ${done ? 'bg-dark' : 'bg-gray-200'}"></div>` : ''}
        </div>
        <div class="pt-2 pb-6">
          <p class="text-sm font-semibold ${pending ? 'text-gray-400' : 'text-dark'}">${s.label}</p>
          <p class="text-xs ${pending ? 'text-gray-300' : 'text-gray-500'}">${s.desc}</p>
          ${active ? `<span class="inline-block mt-1 text-[10px] bg-accent/20 text-dark px-2 py-0.5 rounded-full font-medium">Current Status</span>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  // Cancel button
  const cancelWrap = document.getElementById('tracking-cancel-wrap');
  const cancelBtn = document.getElementById('tracking-cancel-btn');
  if (o.status === 'Ordered') {
    cancelWrap.classList.remove('hidden');
    cancelBtn.onclick = () => cancelOrder(o.id);
  } else {
    cancelWrap.classList.add('hidden');
  }

  openModal('tracking-modal');
}

  const res = await api('GET', '/api/orders/my');
  if (!res.success) return;

  const orders = res.orders;
  const ol = document.getElementById('orders-list');

  if (!orders.length) {
    ol.innerHTML = `<div class="text-center py-16">
      <i class="fa-solid fa-box-open text-4xl mb-4 opacity-30"></i>
      <p class="text-gray-500 mb-4">You haven't placed any orders yet.</p>
      <button onclick="showPage('home')" class="btn-primary px-8 py-3 rounded text-sm uppercase tracking-wider">Shop Now</button>
    </div>`;
    return;
  }

  const statusFlow = ['Ordered', 'Shipping', 'Done'];
  ol.innerHTML = orders.map(o => {
    const statusColors = { Ordered: 'status-ordered', Shipping: 'status-shipping', Done: 'status-done', Cancelled: 'status-cancelled' };
    const stepIdx = statusFlow.indexOf(o.status);
    const stepsHtml = statusFlow.map((s, i) => `
      <div class="flex flex-col items-center flex-1 ${i < statusFlow.length - 1 ? 'relative' : ''}">
        <div class="step-dot w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold z-10 transition-all
          ${o.status === 'Cancelled' ? 'border-red-300 bg-red-50 text-red-400' :
            i <= stepIdx ? 'bg-accent border-dark text-dark' : 'border-gray-200 bg-gray-50 text-gray-300'}">
          ${o.status === 'Cancelled' ? '✕' : i <= stepIdx ? '✓' : i + 1}
        </div>
        <span class="text-xs mt-1 font-medium ${i <= stepIdx && o.status !== 'Cancelled' ? 'text-dark' : 'text-gray-400'}">${s}</span>
        ${i < statusFlow.length - 1 ? `<div class="absolute top-4 left-1/2 w-full h-0.5 ${i < stepIdx && o.status !== 'Cancelled' ? 'bg-dark' : 'bg-gray-200'} z-0"></div>` : ''}
      </div>
    `).join('');

    return `
    <div class="border border-gray-100 rounded-2xl p-6 mb-4 hover:shadow-md transition-shadow">
      <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Order #${o.id}</p>
          <p class="text-sm text-gray-500">${new Date(o.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</p>
        </div>
        <div class="text-right">
          <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[o.status] || 'bg-gray-100 text-gray-500'}">${o.status}</span>
          <p class="text-xs text-gray-500 mt-1">${o.item_count} item${o.item_count > 1 ? 's' : ''}</p>
        </div>
      </div>

      ${o.status !== 'Cancelled' ? `<div class="flex items-center gap-0 mb-5">${stepsHtml}</div>` : ''}

      <div class="space-y-1.5 mb-4">
        ${(o.items || []).map(item => `
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">${item.product_name} <span class="text-gray-400">(${item.size} × ${item.quantity})</span></span>
            <span class="font-medium">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
          </div>
        `).join('')}
      </div>

      <div class="border-t pt-4 flex flex-wrap items-center justify-between gap-3">
        <div class="text-sm">
          <span class="text-gray-500">Total: </span><span class="font-bold">₹${o.total_amount.toLocaleString('en-IN')}</span>
          ${o.total_savings > 0 ? `<span class="ml-2 text-green-600 text-xs">(Saved ₹${o.total_savings.toLocaleString('en-IN')})</span>` : ''}
        </div>
        ${o.status === 'Ordered' ? `
          <button onclick="cancelOrder(${o.id})" class="text-xs text-red-500 border border-red-200 px-4 py-1.5 rounded hover:bg-red-50 transition">
            Cancel Order
          </button>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function cancelOrder(id) {
  if (!confirm('Cancel this order?')) return;
  const res = await api('PUT', `/api/orders/cancel/${id}`);
  if (res.success) { toast('Order cancelled.'); await loadOrders(); }
  else toast(res.message, 'error');
}

// ── Pages ─────────────────────────────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  window.scrollTo(0, 0);
  if (name === 'orders') loadOrders();
}

// ── Modals ────────────────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  document.body.style.overflow = '';
}
document.querySelectorAll('[id$="-modal"]').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); });
});

// ── Mobile menu ───────────────────────────────────────────────────────────────
function toggleMobileMenu() { document.getElementById('mobile-menu').classList.toggle('hidden'); }
function closeMobileMenu() { document.getElementById('mobile-menu').classList.add('hidden'); }

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer;
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.borderLeftColor = type === 'error' ? '#ef4444' : '#E8FF00';
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ── API helper ────────────────────────────────────────────────────────────────
async function api(method, url, body) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    return await res.json();
  } catch (e) {
    console.error(e);
    toast('Network error. Is the server running?', 'error');
    return {};
  }
}
