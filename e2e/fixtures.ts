import { expect, type Page } from '@playwright/test'

export const EMAIL = 'claire.martin@clinic.example'

/** Signs in from the login page (any email works), and waits until the app has left it. */
export async function signIn(page: Page, email = EMAIL) {
  await page.getByLabel('Email').fill(email)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

export function encounterList(page: Page) {
  return page.getByRole('navigation').filter({ has: page.getByRole('link', { name: /Emma Laurent/ }) })
}
