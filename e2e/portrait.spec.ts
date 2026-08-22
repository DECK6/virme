import { expect, test } from '@playwright/test'

test('offers an off-by-default portrait toggle', async ({ page }) => {
  await page.goto('/')
  const toggle = page.getByTestId('portrait-toggle')

  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByTestId('central-portrait')).toHaveCount(0)
  await expect(page.getByTestId('portrait-anchor')).toHaveCount(0)
  await expect(page.getByTestId('portrait-stage')).toHaveAttribute('data-example-count', '1')
  await expect(page.locator('.mode-button')).toHaveCount(3)
  await expect(page.locator('.state-nav h1')).toContainText('장소의 잠재 장면')

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('central-portrait')).toBeVisible()
  await expect(page.getByTestId('central-portrait')).toHaveAttribute('src', '/assets/central-portrait.png')
})

test('switches between place, object, and situation latent-loop videos', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('LUCID SONIC DREAMS · REAL STYLEGAN LATENT ROUTE')).toBeVisible()
  await expect(page.locator('.control-panel')).toHaveCount(0)
  await expect(page.locator('.workspace')).toHaveClass(/single-example/)
  await expect(page.getByTestId('stylegan-layer')).toHaveAttribute('data-renderer', 'stylegan2-ada')
  await expect(page.getByTestId('stylegan-layer')).toHaveAttribute('data-render-mode', 'latent-structure')
  await expect(page.getByTestId('stylegan-layer')).toHaveAttribute('data-display-mode', 'latent-loop-video')
  await expect(page.getByTestId('latent-loop-video')).toHaveAttribute('data-source', 'stylegan-latent-loop')
  await expect(page.getByTestId('latent-loop-video')).toHaveAttribute('data-effects', 'none')
  await expect(page.getByTestId('latent-loop-video')).toHaveAttribute('data-frame-count', '144')
  await expect(page.getByTestId('latent-loop-video')).toHaveAttribute('loop', '')
  await expect(page.getByTestId('latent-loop-video')).toHaveAttribute('data-mode', 'place')
  await expect(page.getByTestId('latent-loop-video')).toHaveAttribute('src', '/assets/latent-landscape-loop.mp4')
  await expect(page.locator('.state-caption p')).toHaveText('BUILDING FIXED')

  await page.getByRole('button', { name: /사물/ }).click()
  await expect(page.getByTestId('latent-loop-video')).toHaveAttribute('data-mode', 'object')
  await expect(page.getByTestId('latent-loop-video')).toHaveAttribute('src', '/assets/latent-object-loop.mp4')
  await expect(page.locator('.state-caption p')).toHaveText('MULTI-CLASS OBJECTS')

  await page.getByRole('button', { name: /상황/ }).click()
  await expect(page.getByTestId('latent-loop-video')).toHaveAttribute('data-mode', 'situation')
  await expect(page.getByTestId('latent-loop-video')).toHaveAttribute('src', '/assets/latent-situation-loop.mp4')
  await expect(page.locator('.state-caption p')).toHaveText('MULTI-CLASS SCENES')
  await expect(page.locator('.latent-depth-surface')).toHaveCount(0)
  await expect(page.locator('.model-frame-field')).toHaveCount(0)
  await expect(page.locator('.stylegan-shards')).toHaveCount(0)
  await expect(page.locator('.stylegan-frame.refracted')).toHaveCount(0)
})

test('keeps the selected mode stable when personal data events arrive', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /사물/ }).click()
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('virtueme:personal-data', {
      detail: { stability: 0.1, novelty: 0.2, conflict: 0.96, uncertainty: 0.3, possibility: 0.4, activity: 0.72, confidence: 0.91 },
    }))
  })
  await expect(page.locator('.mode-button')).toHaveCount(3)
  await expect(page.locator('.mode-button.active')).toContainText('OBJECT')
})

test('uses a continuous latent flow without waveform, orbit, or voxel graphics', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.orbit')).toHaveCount(0)
  await expect(page.locator('.stage-grid')).toHaveCount(0)
  await expect(page.locator('.portrait-ghost')).toHaveCount(0)
  await expect(page.locator('.model-frame-field')).toHaveCount(0)
  await expect(page.getByTestId('stylegan-layer')).toHaveAttribute('data-renderer', 'stylegan2-ada')
  await expect(page.getByTestId('central-portrait')).toHaveCount(0)
})
