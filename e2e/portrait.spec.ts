import { expect, test } from '@playwright/test'

test('keeps the central portrait visible in the single latent example', async ({ page }) => {
  await page.goto('/')
  const portrait = page.getByTestId('central-portrait')

  await expect(portrait).toBeVisible()
  await expect(portrait).toHaveAttribute('src', '/assets/central-portrait.png')
  await expect(page.getByTestId('portrait-stage')).toHaveAttribute('data-example-count', '1')
  await expect(page.locator('.state-button')).toHaveCount(1)
  await expect(page.locator('.state-nav h1')).toContainText('하나의 얼굴,')
  await expect(page.locator('.state-nav h1')).toContainText('하나의 잠재 장면')
  const opacity = await portrait.evaluate((element) => Number.parseFloat(getComputedStyle(element.closest('figure')!).opacity))
  expect(opacity).toBeGreaterThanOrEqual(0.72)
})

test('shows one expanded latent-loop example without a control sidebar', async ({ page }) => {
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
  await expect(page.locator('.latent-depth-surface')).toHaveCount(0)
  await expect(page.locator('.model-frame-field')).toHaveCount(0)
  await expect(page.locator('.stylegan-shards')).toHaveCount(0)
  await expect(page.locator('.stylegan-frame.refracted')).toHaveCount(0)
})

test('keeps the single showcase stable when personal data events arrive', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('virtueme:personal-data', {
      detail: { stability: 0.1, novelty: 0.2, conflict: 0.96, uncertainty: 0.3, possibility: 0.4, activity: 0.72, confidence: 0.91 },
    }))
  })
  await expect(page.locator('.state-button')).toHaveCount(1)
  await expect(page.locator('.state-button')).toContainText('STABILITY')
})

test('uses a continuous personal-data flow without waveform, orbit, or voxel graphics', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.orbit')).toHaveCount(0)
  await expect(page.locator('.stage-grid')).toHaveCount(0)
  await expect(page.locator('.portrait-ghost')).toHaveCount(0)
  await expect(page.locator('.model-frame-field')).toHaveCount(0)
  await expect(page.getByTestId('stylegan-layer')).toHaveAttribute('data-renderer', 'stylegan2-ada')
  await expect(page.getByTestId('central-portrait')).toBeVisible()
})
