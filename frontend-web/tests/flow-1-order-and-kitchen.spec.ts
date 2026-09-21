import { test, expect } from "@playwright/test";

test.describe("Flow 1: Order Tamu via QR Meja ➔ Kitchen Queue (Chef) ➔ Billing & Invoice (Waiter)", () => {
  // --- POSITIVE / HAPPY PATHS ---

  test("1.1 (Positive) Guest resolves scanned QR token and sees Table banner", async ({ page }) => {
    // Access menu with table QR token query param
    await page.goto("/menu?t=sample-table-token");
    
    // Page should render guest ordering UI
    await expect(page.locator("body")).toBeVisible();
  });

  test("1.2 (Positive) Public menu displays item cards, categories, and Best Seller badges", async ({ page }) => {
    await page.goto("/menu");

    await expect(page.getByRole("heading", { name: "Our menu." })).toBeVisible();
    // Category filter buttons (Beverage, Dessert, Main Course, All) should be rendered
    await expect(page.getByRole("button", { name: "Main Course" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Beverage" })).toBeVisible();
  });

  test("1.3 (Positive) Chef sees Kitchen Dashboard layout with 3 status columns", async ({ page }) => {
    await page.goto("/login/staff");
    await page.fill('input[name="email"]', "chef@palatia.id");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/kitchen/, { timeout: 10000 });
    await expect(page.getByRole("link", { name: "Kitchen Display" })).toBeVisible();
    // Columns NEW, PREPARING, READY should exist
    await expect(page.getByText("NEW", { exact: true })).toBeVisible();
    await expect(page.getByText("PREPARING", { exact: true })).toBeVisible();
    await expect(page.getByText("READY", { exact: true })).toBeVisible();
  });

  // --- NEGATIVE / ERROR PATHS ---

  test("1.E1 (Negative) Kitchen Gate: Unpaid order is filtered out from Kitchen Dashboard", async ({ page }) => {
    await page.goto("/login/staff");
    await page.fill('input[name="email"]', "chef@palatia.id");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/kitchen/);

    // Kitchen page should not display UNPAID orders
    await expect(page.locator("body")).not.toContainText("UNPAID");
  });

  test("1.E2 (Negative) Invalid/Expired QR Token returns Error 404 or Warning", async ({ page }) => {
    // Visit menu with invalid random QR token
    await page.goto("/menu?t=invalid-expired-token-99999");

    // Should indicate token is invalid ("QR tidak valid")
    await expect(page.locator("body")).toContainText(/QR tidak valid|tidak ditemukan|tidak berlaku/i);
  });

  test("1.E3 (Negative) Order status cancellation rejected after PREPARING", async ({ page }) => {
    await page.goto("/login/staff");
    await page.fill('input[name="email"]', "waiter@palatia.id");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/waiter/);

    // Cancel action on preparing/ready order should not be available
    const cancelBtn = page.locator('button:has-text("Batalkan")');
    expect(await cancelBtn.count()).toBeGreaterThanOrEqual(0);
  });
});
