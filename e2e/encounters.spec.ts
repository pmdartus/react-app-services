import { expect, test } from '@playwright/test'
import { encounterList, signIn } from './fixtures'

test('browsing encounters shows each one with its note', async ({ page }) => {
  await page.goto('/login')
  await signIn(page)

  await expect(page).toHaveURL('/encounters')
  await expect(page.getByText('Select an encounter')).toBeVisible()

  await encounterList(page).getByRole('link', { name: /Emma Laurent/ }).click()
  await expect(page.getByRole('heading', { name: 'Emma Laurent' })).toBeVisible()
  await expect(page.getByText('Dry cough for 3 weeks')).toBeVisible()

  await encounterList(page).getByRole('link', { name: /Lucas Moreau/ }).click()
  await expect(page.getByRole('heading', { name: 'Lucas Moreau' })).toBeVisible()
  await expect(page.getByText('BP 138/86 on lisinopril')).toBeVisible()
})
