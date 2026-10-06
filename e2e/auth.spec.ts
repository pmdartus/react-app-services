import { expect, test } from '@playwright/test'
import { signIn } from './fixtures'

test('signing in sends the user back to the page they asked for, and survives a reload', async ({ page }) => {
  await page.goto('/encounters/enc-2')
  await expect(page).toHaveURL(/\/login\?redirect=/)

  await signIn(page)

  await expect(page).toHaveURL('/encounters/enc-2')
  await expect(page.getByRole('heading', { name: 'Lucas Moreau' })).toBeVisible()
  await expect(page.getByRole('banner')).toContainText('CM') // initials in the top bar

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Lucas Moreau' })).toBeVisible()
})

test('logging out returns to the login page and locks the app again', async ({ page }) => {
  await page.goto('/login')
  await signIn(page)

  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page.getByText('claire.martin@clinic.example')).toBeVisible()
  await page.getByRole('main').getByRole('button', { name: 'Log out' }).click()

  await expect(page).toHaveURL('/login')
  await page.goto('/encounters')
  await expect(page).toHaveURL(/\/login\?redirect=/)
})
