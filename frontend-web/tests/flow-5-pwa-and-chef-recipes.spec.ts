import { test, expect } from "@playwright/test";

test.describe("Flow 5: PWA Manifest, Service Worker & Chef Recipe Catalog", () => {
  test("5.1 (PWA) Web App Manifest route returns valid JSON PWA configuration", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toContain("Palatia");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test("5.2 (PWA) Service Worker file sw.js is accessible via HTTP 200 OK", async ({ request }) => {
    const response = await request.get("/sw.js");
    expect(response.status()).toBe(200);

    const content = await response.text();
    expect(content).toContain("CACHE_NAME");
    expect(content).toContain("PRECACHE_ASSETS");
  });

  test("5.3 (Chef) Chef accesses Recipe Catalog (/kitchen/recipe) and views dish composition", async ({ page }) => {
    await page.goto("/login/staff");
    await page.fill('input[name="email"]', "chef@palatia.id");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/kitchen/, { timeout: 10000 });

    // Navigate to Recipe tab
    await page.goto("/kitchen/recipe");
    await expect(page.getByRole("heading", { name: "Daftar Resep & Komposisi Makanan" })).toBeVisible();

    // Wait for recipe card grid to finish loading async data
    const firstCard = page.locator('.grid > div').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
  });

  test("5.4 (Staff Read-Only) Staff browsing public page sees sticky StaffTopBanner with Back to Dashboard button", async ({ page }) => {
    // Login as staff (waiter)
    await page.goto("/login/staff");
    await page.fill('input[name="email"]', "waiter@palatia.id");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/waiter/, { timeout: 10000 });

    // Visit public home page as logged in staff
    await page.goto("/");

    // Staff top banner warning should be visible with Back to Staff Dashboard button
    await expect(page.getByText("Staff Account (Waiter)")).toBeVisible();
    const backBtn = page.getByRole("link", { name: /Back to Staff Dashboard/i });
    await expect(backBtn).toBeVisible();
  });
});
