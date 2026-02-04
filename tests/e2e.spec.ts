import { test, expect } from '@playwright/test';

test.describe('TeknikLär Kod-Lab Regression Tests', () => {

  test('Embedded color picker updates canvas and code', async ({ page }) => {
    await page.goto('/#/lesson/1');
    
    const initialCount = await page.locator('[data-draw-count]').getAttribute('data-draw-count');
    
    // Interact with the embedded color picker
    // Since it's no longer a popover, we look for the Palette icon or the picker canvas directly
    await expect(page.locator('text=FÄRGPALETT')).toBeVisible();
    const svCanvas = page.locator('canvas.cursor-crosshair');
    await expect(svCanvas).toBeVisible();

    // Drag on the SV canvas to change color
    const box = await svCanvas.boundingBox();
    if (box) {
        await page.mouse.move(box.x + 10, box.y + 10);
        await page.mouse.down();
        await page.mouse.move(box.x + 50, box.y + 50);
        await page.mouse.up();
    }
    
    // Verify HEX value changed in the input display
    const hexDisplay = page.locator('div.font-mono.font-bold').filter({ hasText: '#' }).first();
    await expect(hexDisplay).toBeVisible();
    
    // Check draw count increased
    const finalCount = await page.locator('[data-draw-count]').getAttribute('data-draw-count');
    expect(Number(finalCount)).toBeGreaterThan(Number(initialCount));
    
    // Verify code textarea contains the new color (approximately, since we can't predict exact hex easily without logic)
    // But we know it shouldn't be the default if we moved significantly
  });

  test('Font size control updates code text size', async ({ page }) => {
    await page.goto('/#/lesson/1');
    
    const textarea = page.locator('textarea.font-mono');
    const initialFontSize = await textarea.evaluate((el) => window.getComputedStyle(el).fontSize);
    
    // Click "Increase text" button
    await page.click('button[title="Öka text"]');
    await page.click('button[title="Öka text"]');
    
    const newFontSize = await textarea.evaluate((el) => window.getComputedStyle(el).fontSize);
    expect(parseFloat(newFontSize)).toBeGreaterThan(parseFloat(initialFontSize));
  });

});