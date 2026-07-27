import {expect, test} from '@playwright/test'

test.describe('Studio smoke', () => {
  test('loads authenticated workspace', async ({page}) => {
    // Stay inside the project baseURL workspace (`/chromium/` or `/firefox/`).
    await page.goto('./')

    await expect(page.getByTestId('studio-navbar')).toBeVisible()
    await expect(page.getByRole('heading', {name: 'Choose login provider'})).toHaveCount(0)
  })
})
