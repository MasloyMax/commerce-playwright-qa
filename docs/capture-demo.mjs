import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium, expect } from '@playwright/test';

const server = spawn(process.execPath, ['app/server.mjs'], {
  env: { ...process.env, PORT: '0' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
let browser;
try {
  const [chunk] = await once(server.stdout, 'data', { signal: AbortSignal.timeout(15_000) });
  const port = chunk.toString().trim().match(/(\d+)$/)?.[1];
  if (!port) throw new Error('Fixture did not report a port');
  browser = await chromium.launch();
  for (const [name, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ baseURL: 'http://127.0.0.1:' + port, viewport });
    try {
      const login = await context.request.post('/api/login', { data: { email: 'demo@example.test', password: 'Demo-pass-123' } });
      expect(login.status()).toBe(200);
      const cart = await context.request.put('/api/cart/headphones', { data: { quantity: 1 } });
      expect(cart.status()).toBe(200);
      const page = await context.newPage();
      await page.goto('/');
      await expect(page.getByRole('article')).toHaveCount(3);
      await expect(page.getByTestId('cart-total')).toHaveText('$129.00');
      await page.screenshot({ path: 'docs/demo-' + name + '.png', fullPage: true });
    } finally { await context.close(); }
  }
} finally {
  if (browser) await browser.close();
  server.kill();
}
