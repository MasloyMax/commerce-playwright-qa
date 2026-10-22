import { expect, type APIRequestContext } from '@playwright/test';
import { demoUser } from '../data/customer.js';
export class StoreApi {
  constructor(private readonly request: APIRequestContext) {}
  async login() {
    const response = await this.request.post('/api/login', { data: demoUser });
    expect(response.status(), 'fixture login').toBe(200);
  }
  async add(product: string, quantity = 1) {
    const response = await this.request.put('/api/cart/' + product, { data: { quantity } });
    expect(response.status(), 'fixture cart setup').toBe(200);
  }
  async order(id: string) {
    const response = await this.request.get('/api/orders/' + id);
    expect(response.status()).toBe(200);
    return response.json();
  }
}
