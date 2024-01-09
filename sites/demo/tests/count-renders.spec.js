// @ts-check
const { test, expect } = require('@playwright/test');

test('has title', async ({ page }) => {

  await page.goto('http://localhost:3000/use-coordination/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle("use-coordination");
});
