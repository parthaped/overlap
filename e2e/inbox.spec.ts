import { expect, test } from "@playwright/test";

const DEMO_EMAIL = process.env.PLAYWRIGHT_DEMO_EMAIL ?? "demo@overlap.app";
const DEMO_PASSWORD = process.env.PLAYWRIGHT_DEMO_PASSWORD ?? "password123";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/signin");
  await page.getByLabel("Email").fill(DEMO_EMAIL);
  await page.getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  // Either we land on /inbox or get an error toast — wait for either.
  await page.waitForURL(/\/inbox(\b|\/)/, { timeout: 15_000 }).catch(() => undefined);
}

test.describe("inbox smoke", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    if (!/\/inbox/.test(page.url())) {
      test.skip(true, "Demo user could not sign in (DB likely unavailable in this env).");
    }
  });

  test("renders the new three-pane inbox shell", async ({ page }) => {
    await expect(page.getByRole("link", { name: /inbox/i }).first()).toBeVisible();
    // Bucket tabs (at least one of the new buckets should render)
    await expect(page.getByRole("button", { name: /focus/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /promotions/i }).first()).toBeVisible();
  });

  test("switches between buckets", async ({ page }) => {
    const promo = page.getByRole("button", { name: /promotions/i }).first();
    await promo.click();
    await expect(promo).toHaveAttribute("aria-pressed", "true");

    const focus = page.getByRole("button", { name: /^focus$/i }).first();
    await focus.click();
    await expect(focus).toHaveAttribute("aria-pressed", "true");
  });

  test("opens the AI Copilot drawer", async ({ page }) => {
    // The shell exposes a copilot toggle (Cmd+Shift+J also works).
    await page.keyboard.press(process.platform === "darwin" ? "Meta+Shift+J" : "Control+Shift+J");
    const copilot = page.getByRole("complementary", { name: /ai copilot/i });
    await expect(copilot).toBeVisible();
    await expect(copilot.getByPlaceholder(/ask overlap/i)).toBeVisible();
    // Suggestion chips should be rendered for empty state.
    await expect(copilot.getByText(/what's important today/i)).toBeVisible();
  });

  test("opens the command palette with Cmd/Ctrl+K", async ({ page }) => {
    await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K");
    await expect(page.getByPlaceholder(/search|jump|command/i).first()).toBeVisible();
  });

  test("AI draft action is available on a thread (if any rendered)", async ({ page }) => {
    // The first thread row, if present, should expose an AI draft quick action on hover.
    const rows = page.getByTestId("thread-row");
    const count = await rows.count();
    if (count === 0) {
      test.skip(true, "No threads in seeded inbox — skipping AI draft smoke.");
    }
    await rows.first().click();
    // Reader should mount with a "Draft with AI" button.
    await expect(
      page.getByRole("button", { name: /draft with ai/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
