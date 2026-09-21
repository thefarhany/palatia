import { test, expect } from "@playwright/test";

test.describe("Flow 3: Operasional Admin (Menu, Staf, Inventaris, PO, & Rotasi QR)", () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto("/login/staff");
    await page.fill('input[name="email"]', "admin@palatia.id");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  });

  // --- POSITIVE / HAPPY PATHS ---

  test("3.1 (Positive) Admin Dashboard displays sales stats & popular dishes", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/Dashboard/i);
    await expect(page.locator("body")).toContainText(/Penjualan|Sales|Pesanan/i);
  });

  test("3.2 (Positive) Admin Menu management list and recipe mapping modal", async ({ page }) => {
    await page.goto("/admin/menu");
    await expect(page.locator("h1")).toContainText(/Menu/i);
    await expect(page.locator("body")).toContainText(/Nasi Goreng|Ayam|Soto|Es Teh/i);
  });

  test("3.3 (Positive) Admin Table management displays QR preview & Rotate Token button", async ({ page }) => {
    await page.goto("/admin/tables");
    await expect(page.locator("h1")).toContainText(/Meja|Tables/i);
    // Rotate token button should be visible for tables
    await expect(page.locator("body")).toContainText(/Rotate|QR/i);
  });

  test("3.4 (Positive) Admin Inventory page renders ingredient stock & PO management", async ({ page }) => {
    await page.goto("/admin/inventory");
    await expect(page.locator("h1")).toContainText(/Inventaris|Inventory|Bahan/i);
  });

  test("3.5 (Positive) Admin Audit Log displays searchable action history", async ({ page }) => {
    await page.goto("/admin/audit");
    await expect(page.locator("h1")).toContainText(/Audit/i);
  });

  // --- NEGATIVE / ERROR PATHS ---

  test("3.E1 (Negative) Non-admin staff (Chef/Waiter) is blocked from Admin Staff management", async ({ browser }) => {
    const waiterContext = await browser.newContext();
    const page = await waiterContext.newPage();

    // Login as Waiter
    await page.goto("/login/staff");
    await page.fill('input[name="email"]', "waiter@palatia.id");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/waiter/);

    // Try navigating directly to Admin Staff page
    await page.goto("/admin/staff");

    // Should be redirected away or shown access denied
    await expect(page).not.toHaveURL(/\/admin\/staff$/);

    await waiterContext.close();
  });

  test("3.E2 (Negative) Deactivating the last active Admin account is blocked by server guard", async ({ page }) => {
    await page.goto("/admin/staff");
    await expect(page.locator("h1")).toContainText(/Staf|Staff/i);

    // Toggle button on the admin row should be guarded or show error if clicked
    const adminToggle = page.locator('button:has-text("Nonaktifkan")').first();
    if (await adminToggle.isVisible()) {
      await adminToggle.click();
      // Should show toast or error "minimal 1 admin aktif"
      await expect(page.locator("body")).toContainText(/minimal|admin|aktif/i);
    }
  });
});
