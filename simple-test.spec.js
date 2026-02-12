import { test, expect } from "@playwright/test";

test("simple step 1 completion", async ({ page }) => {
  await page.goto("/intake");
  await page.waitForTimeout(1000);

  // Fill all Step 1 fields using evaluate method
  await page.locator("#firstName").evaluate((el) => {
    el.value = "John";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await page.locator("#lastName").evaluate((el) => {
    el.value = "Doe";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await page.locator("#email").evaluate((el) => {
    el.value = "john@example.com";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await page.locator("#mobile").evaluate((el) => {
    el.value = "0412345678";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await page.locator("#dateOfBirth").evaluate((el) => {
    el.value = "15/06/1990";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await page.locator("#occupation").evaluate((el) => {
    el.value = "Designer";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  // Try to navigate to Step 2
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  const nextBtn = page.locator("#nextBtn");
  await nextBtn.click();

  // Check if we made it to Step 2
  await page.waitForTimeout(1000);
  const stepText = await page.textContent("#stepCount");
  console.log("Current step:", stepText);

  expect(stepText).toContain("Step 2");
});
