import { test, expect } from '@playwright/test';

test.describe('AquaHome E2E Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept and mock all backend API requests
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (url.includes('/auth/register') && method === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              token: 'mock_jwt_token_e2e',
              user: {
                _id: 'customer_e2e_123',
                name: 'E2E Customer',
                email: 'e2e@example.com',
                role: 'customer',
                phone: '9876543210',
                pincode: '411001',
                address: '123 E2E Street'
              }
            }
          })
        });
      }

      if (url.includes('/auth/login') && method === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              token: 'mock_jwt_token_e2e',
              user: {
                _id: 'customer_e2e_123',
                name: 'E2E Customer',
                email: 'e2e@example.com',
                role: 'customer',
                phone: '9876543210',
                pincode: '411001',
                address: '123 E2E Street'
              }
            }
          })
        });
      }

      if (url.includes('/auth/me') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              _id: 'customer_e2e_123',
              name: 'E2E Customer',
              email: 'e2e@example.com',
              role: 'customer',
              phone: '9876543210',
              pincode: '411001',
              address: '123 E2E Street'
            }
          })
        });
      }

      if (url.includes('/suppliers') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              results: [
                {
                  _id: 'supplier_e2e_123',
                  businessName: 'E2E Water Supplier Ltd',
                  serviceAreas: ['411001'],
                  rating: 4.8,
                  user: {
                    name: 'Ramesh Supplier',
                    phone: '9988776655'
                  }
                }
              ],
              pagination: { page: 1, limit: 10, total: 1, pages: 1 }
            }
          })
        });
      }

      if (url.includes('/products') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              results: [
                {
                  _id: 'product_e2e_123',
                  name: 'AquaHome Premium 20L Can',
                  description: 'Purified water jar with minerals.',
                  price: 60,
                  stock: 20,
                  isActive: true,
                  supplier: 'supplier_e2e_123'
                }
              ],
              pagination: { page: 1, limit: 10, total: 1, pages: 1 }
            }
          })
        });
      }

      if (url.includes('/cart') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: []
          })
        });
      }

      if (url.includes('/orders') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              results: [],
              pagination: { page: 1, limit: 10, total: 0, pages: 1 }
            }
          })
        });
      }

      if (url.includes('/notifications') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              results: [],
              pagination: { page: 1, limit: 10, total: 0, pages: 1 }
            }
          })
        });
      }

      // Default fallback for unhandled mocked routes
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} })
      });
    });
  });

  test('should navigate to login page and successfully log in', async ({ page }) => {
    await page.goto('/login');

    // Verify page content
    await expect(page.locator('h2')).toContainText('Welcome Back');

    // Fill the login form
    await page.fill('#email', 'e2e@example.com');
    await page.fill('#password', 'Password@123');

    // Click the submit button
    await page.click('button[type="submit"]');

    // Should redirect to customer dashboard
    await page.waitForURL('**/customer');
    await expect(page).toHaveURL(/.*customer/);
  });

  test('should navigate to register page and register as customer', async ({ page }) => {
    await page.goto('/register');

    // Verify page title
    await expect(page.locator('h2')).toContainText('Create Account');

    // Fill form
    await page.fill('#name', 'E2E Customer');
    await page.fill('#phone', '9876543210');
    await page.fill('#pincode', '411001');
    await page.fill('#email', 'e2e@example.com');
    await page.fill('#password', 'Password@123'); // Password policy: min 8, 1 uppercase, 1 number, 1 special
    await page.fill('#address', '123 E2E Street');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to customer dashboard
    await page.waitForURL('**/customer');
    await expect(page).toHaveURL(/.*customer/);
  });
});
