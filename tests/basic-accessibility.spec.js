const { test, expect } = require("@playwright/test");

test("Basic form accessibility test", async ({ page }) => {
  console.log("Testing /intake route...");

  // Navigate to form with more generous timeout
  await page.goto("http://localhost:3000/intake", {
    waitUntil: "networkidle",
    timeout: 10000,
  });

  // Take a screenshot to see what's actually loading
  await page.screenshot({ path: "test-intake-form.png", fullPage: true });

  console.log("Page loaded, checking basic elements...");

  // Check if we can find any form element
  const anyInput = await page.locator("input").first();
  if ((await anyInput.count()) > 0) {
    console.log("Found input elements on page");
  } else {
    console.log("No input elements found");
  }

  // Check if we can find the firstName field with a longer wait
  try {
    await page.waitForSelector("#firstName", { timeout: 15000 });
    console.log("firstName field found successfully");
  } catch (error) {
    console.log("firstName field not found:", error.message);

    // Try to find it by different selectors
    const byName = await page.locator('[name="firstName"]');
    const byTestId = await page.locator('[data-testid="firstName"]');
    const byPlaceholder = await page.locator('input[placeholder*="First"]');

    console.log("Alternative searches:");
    console.log("- By name:", await byName.count());
    console.log("- By test ID:", await byTestId.count());
    console.log("- By placeholder:", await byPlaceholder.count());
  }

  // Check the page title to confirm we're on the right page
  const title = await page.title();
  console.log("Page title:", title);

  // Check for any console errors
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  // Wait a bit to catch any errors
  await page.waitForTimeout(3000);

  if (errors.length > 0) {
    console.log("Console errors found:");
    errors.forEach((err) => console.log("- " + err));
  } else {
    console.log("No console errors detected");
  }
});
