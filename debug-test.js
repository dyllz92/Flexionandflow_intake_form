const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto("http://localhost:3000/intake");
    await page.waitForTimeout(2000);

    // Check if nextBtn exists
    const nextBtn = await page.locator("#nextBtn");
    const count = await nextBtn.count();
    console.log("nextBtn count:", count);

    if (count > 0) {
      const isVisible = await nextBtn.isVisible();
      console.log("nextBtn is visible:", isVisible);

      const text = await nextBtn.textContent();
      console.log("nextBtn text:", text);
    }

    // Check all buttons
    const allButtons = await page.locator("button");
    const buttonCount = await allButtons.count();
    console.log("Total buttons:", buttonCount);

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = allButtons.nth(i);
      const id = await button.getAttribute("id");
      const text = await button.textContent();
      console.log(`Button ${i}: id=${id}, text=${text}`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await browser.close();
  }
})();
