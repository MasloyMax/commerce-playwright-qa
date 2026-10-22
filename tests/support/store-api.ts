import { expect, type APIRequestContext } from '@playwright/test';
import { demoUser, type Customer } from '../data/customer.js';

export class StoreApi {
  constructor(private readonly request: APIRequestContext) {}

  async login() {
    const response = await this.request.post('/api/login', { data: demoUser });
    expect(response.status(), 'Вход через API для подготовки теста').toBe(200);
  }

  async logout() {
    const response = await this.request.post('/api/logout');
    // 401 допустим после UI-выхода и в тестах без авторизации.
    expect([200, 401], 'Завершение сессии после теста').toContain(response.status());
  }

  async cart() {
    return this.request.get('/api/cart');
  }

  async setQuantity(product: string, quantity: number) {
    return this.request.put('/api/cart/' + product, { data: { quantity } });
  }

  async add(product: string, quantity = 1) {
    const response = await this.setQuantity(product, quantity);
    expect(response.status(), 'Подготовка корзины через API').toBe(200);
  }

  async createOrder(data: Customer & { total?: number; price?: number }) {
    return this.request.post('/api/orders', { data });
  }

  async order(id: string) {
    const response = await this.request.get('/api/orders/' + id);
    expect(response.status(), 'Получение созданного заказа через API').toBe(200);
    return response.json();
  }
}
