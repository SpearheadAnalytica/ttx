import { test, expect } from '@playwright/test';

// This is a placeholder test to confirm Playwright is working.
// Replace with tests for your actual app.

test('example.com loads', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example Domain/);
});
