const $ = selector => document.querySelector(selector);
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value / 100);
let products = [];
let cart = { items: [], total: 0 };
async function api(path, options = {}) {
  const response = await fetch('/api' + path, { ...options, headers: { 'Content-Type': 'application/json' } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Service unavailable');
  return body;
}
function renderProducts() {
  const query = $('#search').value.trim().toLowerCase();
  const sort = $('#sort').value;
  const visible = products.filter(p => p.name.toLowerCase().includes(query)).sort((a, b) =>
    sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : a.name.localeCompare(b.name));
  $('#products').replaceChildren();
  $('#no-results').hidden = visible.length > 0;
  for (const product of visible) {
    const article = document.createElement('article');
    article.setAttribute('aria-label', product.name);
    const visual = document.createElement('div');
    visual.className = 'product-art ' + product.id;
    visual.setAttribute('aria-hidden', 'true');
    visual.textContent = product.id === 'headphones' ? '◉' : product.id === 'keyboard' ? '▦' : '◒';
    const category = document.createElement('p'); category.className = 'eyebrow'; category.textContent = product.category;
    const title = document.createElement('h3'); title.textContent = product.name;
    const price = document.createElement('p'); price.textContent = money(product.price);
    const button = document.createElement('button'); button.textContent = 'Add to cart';
    button.addEventListener('click', async () => {
      button.disabled = true;
      const quantity = cart.items.find(i => i.id === product.id)?.quantity ?? 0;
      await updateCart(product.id, quantity + 1);
      button.disabled = false;
    });
    article.append(visual, category, title, price, button);
    $('#products').append(article);
  }
}
function renderCart() {
  $('#cart-items').replaceChildren();
  $('#cart-total').textContent = money(cart.total);
  $('#checkout').disabled = cart.items.length === 0;
  if (!cart.items.length) $('#cart-items').textContent = 'Your cart is empty';
  for (const item of cart.items) {
    const row = document.createElement('section');
    row.className = 'cart-row'; row.setAttribute('aria-label', item.name);
    const title = document.createElement('h3'); title.textContent = item.name;
    const amount = document.createElement('p'); amount.textContent = money(item.subtotal);
    const label = document.createElement('label'); label.textContent = 'Quantity';
    const input = document.createElement('input');
    input.type = 'number'; input.min = '1'; input.max = '10'; input.value = item.quantity;
    input.setAttribute('aria-label', 'Quantity for ' + item.name);
    input.addEventListener('change', () => updateCart(item.id, Number(input.value)));
    label.append(input);
    const remove = document.createElement('button'); remove.textContent = 'Remove';
    remove.addEventListener('click', () => updateCart(item.id, 0));
    row.append(title, amount, label, remove); $('#cart-items').append(row);
  }
}
async function updateCart(id, quantity) {
  $('#cart-error').textContent = '';
  try {
    cart = await api('/cart/' + id, { method: 'PUT', body: JSON.stringify({ quantity }) });
    renderCart();
  } catch (error) {
    $('#cart-error').textContent = error.message;
    renderCart();
  }
}
async function loadCatalog() {
  $('#catalog-error').textContent = ''; $('#retry').hidden = true;
  try { products = (await api('/products')).products; renderProducts(); }
  catch { $('#catalog-error').textContent = 'Catalog is unavailable. Please try again.'; $('#retry').hidden = false; }
}
async function showStore() {
  $('#login-view').hidden = true; $('#store-view').hidden = false; $('#logout').hidden = false;
  cart = await api('/cart'); renderCart(); await loadCatalog();
}
$('#login-form').addEventListener('submit', async event => {
  event.preventDefault(); $('#login-error').textContent = '';
  try {
    await api('/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
    await showStore();
  } catch (error) { $('#login-error').textContent = error.message; }
});
$('#logout').addEventListener('click', async () => {
  await api('/logout', { method: 'POST' }); location.reload();
});
$('#search').addEventListener('input', renderProducts);
$('#sort').addEventListener('change', renderProducts);
$('#retry').addEventListener('click', loadCatalog);
$('#checkout-form').addEventListener('submit', async event => {
  event.preventDefault(); $('#cart-error').textContent = ''; $('#checkout').disabled = true;
  try {
    const order = await api('/orders', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
    $('#order-id').textContent = order.id; $('#confirmation').hidden = false;
    cart = { items: [], total: 0 }; renderCart(); event.target.reset();
  } catch (error) { $('#cart-error').textContent = error.message; $('#checkout').disabled = cart.items.length === 0; }
});
try { if ((await api('/session')).user) await showStore(); }
catch { $('#login-error').textContent = 'Unable to reach the store. Please reload.'; }
