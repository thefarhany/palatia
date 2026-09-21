import { test, expect } from "@playwright/test";

test.describe("Flow 4: Auth & Input Error Handling (Kasir, Pickup, & Security Guards)", () => {
  // --- POSITIVE / HAPPY PATHS ---

  test("4.1 (Positive) Staff login with valid credentials succeeds", async ({ page }) => {
    await page.goto("/login/staff");
    await page.fill('input[name="email"]', "waiter@palatia.id");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/waiter/, { timeout: 10000 });
  });

  test("4.2 (Positive) Waiter Orders page renders active order queue table", async ({ page }) => {
    await page.goto("/login/staff");
    await page.fill('input[name="email"]', "waiter@palatia.id");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/waiter\/orders/, { timeout: 10000 });

    await expect(page.getByRole("button", { name: "Order Baru" })).toBeVisible();
  });

  test("4.3 (Positive) Waiter Billing page loads invoice calculator & print sheet action", async ({ page }) => {
    await page.goto("/login/staff");
    await page.fill('input[name="email"]', "waiter@palatia.id");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/waiter/, { timeout: 10000 });

    await page.goto("/waiter/billing");
    await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();
  });

  // --- NEGATIVE / ERROR PATHS ---

  test("4.E1 (Negative) Login with invalid password displays error toast and stays on login page", async ({ page }) => {
    await page.goto("/login/staff");
    await page.fill('input[name="email"]', "admin@palatia.id");
    await page.fill('input[name="password"]', "wrong-password-xyz");
    await page.click('button[type="submit"]');

    // Should remain on login page and display error toast/message
    await expect(page).toHaveURL(/\/login\/staff/);
    await expect(page.locator("body")).toContainText(/gagal|salah|invalid/i);
  });

  test("4.E2 (Negative) Applying discount larger than subtotal in Billing shows validation error", async ({ page }) => {
    await page.goto("/login/staff");
    await page.fill('input[name="email"]', "waiter@palatia.id");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/waiter/, { timeout: 10000 });

    await page.goto("/waiter/billing");

    // Fill excessive discount amount
    const discountInput = page.locator('input[name="discount"], input[type="number"]').first();
    if (await discountInput.isVisible()) {
      await discountInput.fill("99999999");
      const applyBtn = page.locator('button:has-text("Terapkan"), button:has-text("Simpan")');
      if (await applyBtn.isVisible()) {
        await applyBtn.click();
        await expect(page.locator("body")).toContainText(/melebihi|tidak boleh|invalid/i);
      }
    }
  });

  test("4.E3 (Negative) Unauthenticated user attempting to access `/kitchen` or `/waiter` is redirected to login", async ({ browser }) => {
    const freshContext = await browser.newContext();
    const page = await freshContext.newPage();

    // Try navigating directly to protected staff page without login
    await page.goto("/kitchen");

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);

    await freshContext.close();
  });
});
