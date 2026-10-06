import { expect, test } from '@playwright/test'
import { signIn } from './fixtures'

// `?fail=<service>` makes that service fail once (see `demoFlags.ts`), so Retry then succeeds.

test('the app recovers from a failed start', async ({ page }) => {
  await page.goto('/login?fail=storage')
  await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible()

  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test('a failed session keeps the top bar usable, and recovers on retry', async ({ page }) => {
  await page.goto('/login?fail=userSettings')
  await signIn(page)

  await expect(page.getByText('userSettings failed')).toBeVisible()
  await expect(page.getByRole('banner').getByRole('link', { name: 'Settings' })).toBeVisible()

  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(page.getByText('Select an encounter')).toBeVisible()
})
