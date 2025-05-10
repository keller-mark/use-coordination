// @ts-check
const { test, expect } = require('@playwright/test');

async function expectNumRendersAndInits(page, viewUids, numInits, numRenders) {
  for (const viewUid of viewUids) {
    const container = page.getByText(`SliderInputContainer-${viewUid}`);
    const slider = page.getByText(`SliderInput-${viewUid}`);
    await expect(container).toHaveAttribute('data-inits', numInits.toString());
    await expect(container).toHaveAttribute('data-renders', numRenders.toString());
    await expect(slider).toHaveAttribute('data-inits', numInits.toString());
    await expect(slider).toHaveAttribute('data-renders', numRenders.toString());
  }
}

test('count component initializations and renders', async ({ page }) => {

  await page.goto('http://localhost:3000/use-coordination/');

  // Expect a page title.
  await expect(page).toHaveTitle("use-coordination");

  // Expect the first slider to be visible and to have been initialized once and rendered twice.
  await expectNumRendersAndInits(page, ['slider1', 'slider2', 'slider3'], 1, 2);


  // =========== Button interactions ===========
  await page.getByText('increment-slider1').click();
  // Expect all sliders to re-render but not re-initialize.
  await expectNumRendersAndInits(page, ['slider1', 'slider2', 'slider3'], 1, 3);

  await page.getByText('increment-slider2').click();
  await expectNumRendersAndInits(page, ['slider1', 'slider2', 'slider3'], 1, 4);

  // =========== Select interactions ===========
  // Use <select/> to change the coordination scope mapping.
  await page.getByTitle('select-slider1').selectOption({ label: 'B' });
  await expectNumRendersAndInits(page, ['slider1', 'slider2', 'slider3'], 2, 3);

  await page.getByTitle('select-slider2').selectOption({ label: 'A' });
  await expectNumRendersAndInits(page, ['slider1', 'slider2', 'slider3'], 3, 3);

});
