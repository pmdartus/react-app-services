import { expect, test } from '@playwright/test'
import { encounterList, signIn } from './fixtures'

test('saved preferences apply to notes and are kept across reloads', async ({ page }) => {
  await page.goto('/login')
  await signIn(page)

  await page.getByRole('link', { name: 'Settings' }).click()
  await page.getByRole('link', { name: 'Preferences' }).click()
  await page.getByLabel('Note language').selectOption('fr')
  await expect(page.getByRole('status')).toHaveText(/Preferences saved/)

  await page.reload()
  await expect(page.getByLabel('Note language')).toHaveValue('fr')

  await page.getByRole('link', { name: 'Back to encounters' }).click()
  await encounterList(page).getByRole('link', { name: /Emma Laurent/ }).click()
  await expect(page.getByText('SOAP · Français')).toBeVisible()
})
