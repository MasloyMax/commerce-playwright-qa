import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const products = [
  { id: 'headphones', name: 'Orbit Headphones', category: 'Audio', price: 12900 },
  { id: 'keyboard', name: 'Field Keyboard', category: 'Workspace', price: 8900 },
  { id: 'mouse', name: 'Arc Mouse', category: 'Workspace', price: 4900 },
];
const sessions = new Map();
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
]);
function reply(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}
async function readBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 16_384) throw new Error('Body too large');
  }
  return JSON.parse(body || '{}');
}
function cartView(session) {
  const items = [...session.cart].map(([id, quantity]) => {
    const product = products.find(p => p.id === id);
    return { ...product, quantity, subtotal: product.price * quantity };
  });
  return { items, total: items.reduce((sum, item) => sum + item.subtotal, 0) };
}
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    res.setHeader('x-content-type-options', 'nosniff');
    if (req.method === 'GET' && path === '/health') return reply(res, 200, { status: 'ok' });
    if (req.method === 'GET' && assets.has(path)) {
      const [file, type] = assets.get(path);
      res.writeHead(200, {
        'content-type': type,
        'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'",
      });
      return res.end(await readFile(new URL('./public/' + file, import.meta.url)));
    }
    const cookie = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('session='));
    const sessionId = cookie?.slice(8);
    const session = sessions.get(sessionId);
    if (path === '/api/login' && req.method === 'POST') {
      const body = await readBody(req);
      if (body.email !== 'demo@example.test' || body.password !== 'Demo-pass-123') {
        return reply(res, 401, { error: 'Incorrect email or password' });
      }
      const id = randomUUID();
      sessions.set(id, { email: body.email, cart: new Map(), orders: new Map() });
      res.setHeader('set-cookie', 'session=' + id + '; HttpOnly; SameSite=Strict; Path=/');
      return reply(res, 200, { email: body.email });
    }
    if (path === '/api/session' && req.method === 'GET') {
      return reply(res, 200, { user: session ? { email: session.email } : null });
    }
    if (path === '/api/products' && req.method === 'GET') return reply(res, 200, { products });
    if (!session) return reply(res, 401, { error: 'Please sign in' });
    if (path === '/api/logout' && req.method === 'POST') {
      sessions.delete(sessionId);
      res.setHeader('set-cookie', 'session=; Max-Age=0; HttpOnly; SameSite=Strict; Path=/');
      return reply(res, 200, { ok: true });
    }
    if (path === '/api/cart' && req.method === 'GET') return reply(res, 200, cartView(session));
    if (path === '/api/cart' && req.method === 'DELETE') {
      session.cart.clear();
      return reply(res, 200, cartView(session));
    }
    const itemMatch = path.match(/^\/api\/cart\/([a-z]+)$/);
    if (itemMatch && req.method === 'PUT') {
      const product = products.find(p => p.id === itemMatch[1]);
      if (!product) return reply(res, 404, { error: 'Product not found' });
      const { quantity } = await readBody(req);
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > 10) {
        return reply(res, 422, { error: 'Quantity must be an integer between 0 and 10' });
      }
      if (quantity === 0) session.cart.delete(product.id);
      else session.cart.set(product.id, quantity);
      return reply(res, 200, cartView(session));
    }
    if (path === '/api/orders' && req.method === 'POST') {
      const body = await readBody(req);
      if (typeof body.name !== 'string' || body.name.trim().length < 2 ||
          typeof body.address !== 'string' || body.address.trim().length < 5) {
        return reply(res, 422, { error: 'Enter a name and a delivery address' });
      }
      const cart = cartView(session);
      if (cart.items.length === 0) return reply(res, 409, { error: 'Your cart is empty' });
      const order = { id: randomUUID(), ...cart, name: body.name.trim(), address: body.address.trim() };
      session.orders.set(order.id, order);
      session.cart.clear();
      return reply(res, 201, order);
    }
    if (path.startsWith('/api/orders/') && req.method === 'GET') {
      const order = session.orders.get(path.slice('/api/orders/'.length));
      return reply(res, order ? 200 : 404, order ?? { error: 'Order not found' });
    }
    return reply(res, 404, { error: 'Route not found' });
  } catch (error) {
    if (error instanceof SyntaxError || error.message === 'Body too large') {
      return reply(res, 400, { error: 'Invalid JSON body' });
    }
    console.error(error);
    return reply(res, 500, { error: 'Unexpected server error' });
  }
});
server.listen(Number(process.env.PORT ?? 4173), '127.0.0.1', () => {
  console.log('Commerce fixture listening on ' + server.address().port);
});
