import {expect, test} from '@playwright/test'

test.describe('Studio smoke test', () => {
  test('studio loads the workspace selector', async ({page}) => {
    await page.goto('/')
    // Wait for the studio to fully render – workspace selector shows workspace links
    await expect(page.getByRole('link', {name: /kitchen-sink/i})).toBeVisible()
  })

  test('kitchen-sink workspace loads', async ({page}) => {
    await page.goto('/kitchen-sink')
    // Wait for the studio navbar to appear, which indicates the workspace has loaded
    await expect(page.getByRole('navigation')).toBeVisible()
    // The studio should show the project's main UI (structure tool is the default)
    await expect(page.getByRole('link', {name: /kitchen-sink/i})).toBeVisible()
  })
})
