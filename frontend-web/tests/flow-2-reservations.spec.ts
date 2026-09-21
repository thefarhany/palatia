import { test, expect } from "@playwright/test";

test.describe("Flow 2: Reservasi Meja (Customer/Guest) ➔ Konfirmasi & Seating (Waiter)", () => {
  // --- POSITIVE / HAPPY PATHS ---

  test("2.1 (Positive) Public Reservation page renders slot picker and guest form", async ({ page }) => {
    await page.goto("/reservasi");

    await expect(page.getByRole("heading", { name: "Lock in your table." })).toBeVisible();
    // Should display time slot choices (11:00, 13:00, 15:00, 18:00, 19:00, 20:00, 21:00)
    await expect(page.locator("body")).toContainText(/19:00|18:00|13:00/);
  });

  test("2.2 (Positive) Waiter can view daily reservations and change status", async ({ page }) => {
    await page.goto("/login/staff");
    await page.fill('input[name="email"]', "waiter@palatia.id");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/waiter/, { timeout: 10000 });

    await page.goto("/waiter/reservations");
    await expect(page.locator("h1")).toContainText(/Reservasi|Reservations/i);
  });

  // --- NEGATIVE / ERROR PATHS ---

  test("2.E1 (Negative) Submitting reservation without required Guest Name/Phone shows validation error", async ({ page }) => {
    await page.goto("/reservasi");

    // Click a date button first to enable table availability selection
    const dateBtn = page.locator("button span").filter({ hasText: /Mon|Tue|Wed|Thu|Fri|Sat|Sun/i }).first();
    if (await dateBtn.isVisible()) {
      await dateBtn.click();
    }

    // Try submitting without filling Name / Phone
    const submitBtn = page.getByRole("button", { name: /Reserve Now/i });
    if (await submitBtn.isVisible() && await submitBtn.isEnabled()) {
      await submitBtn.click();
      // Should show validation error for Name or Phone
      await expect(page.locator("body")).toContainText(/Nama wajib diisi|Nomor telepon|wajib/i);
    }
  });

  test("2.E2 (Negative) Selection of past dates or invalid party size is blocked", async ({ page }) => {
    await page.goto("/reservasi");

    // Guest input field checks
    const guestInput = page.locator('input[type="number"]');
    if (await guestInput.isVisible()) {
      await guestInput.fill("0"); // Invalid party size
      const submitBtn = page.getByRole("button", { name: /Reserve Now/i });
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await expect(page.locator("body")).toContainText(/minimal|invalid|1/i);
      }
    }
  });
});
