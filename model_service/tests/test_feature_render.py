import unittest

import torch

from stylegan_runtime import FEATURE_RESOLUTION, latent_rgb_structure_fields, structure_map_to_rgb


class FeatureRenderTests(unittest.TestCase):
    def test_progressive_stage_retains_midscale_semantic_detail(self):
        self.assertGreaterEqual(FEATURE_RESOLUTION, 128)

    def test_colorizes_structure_with_a_stable_state_palette(self):
        fields = torch.stack([
            torch.linspace(0, 1, steps=16 * 16).reshape(16, 16),
            torch.linspace(-1, 1, steps=16 * 16).reshape(16, 16),
            torch.zeros(16, 16),
        ])

        first = structure_map_to_rgb(fields, state="novelty")
        repeated = structure_map_to_rgb(fields, state="novelty")
        changed_state = structure_map_to_rgb(fields, state="conflict")

        self.assertEqual(tuple(first.shape), (3, 16, 16))
        self.assertEqual(first.dtype, torch.uint8)
        self.assertTrue(torch.equal(first, repeated))
        self.assertFalse(torch.equal(first, changed_state))
        self.assertGreaterEqual(int(first.min()), 0)
        self.assertLessEqual(int(first.max()), 255)
        adjacent_change = (first[:, :, 1:].to(torch.int16) - first[:, :, :-1].to(torch.int16)).abs().max()
        self.assertGreaterEqual(int(adjacent_change), 24)

    def test_preserves_inferable_semantic_regions_between_latent_rgb_stages(self):
        images = torch.zeros(3, 3, 24, 24)
        images[0, :, 6:18, 7:17] = 0.9
        images[1, :, 5:17, 8:18] = 0.45
        images[2, :, 7:19, 6:16] = -0.25
        fields = latent_rgb_structure_fields(images, torch.tensor([0.4, 0.3, 0.3]))

        self.assertEqual(tuple(fields.shape), (3, 24, 24))
        self.assertGreaterEqual(float(fields[0].min()), 0)
        self.assertLessEqual(float(fields[0].max()), 1)
        self.assertGreaterEqual(float(fields[1].min()), -1)
        self.assertLessEqual(float(fields[1].max()), 1)

        semantic_region = float(fields[0, 6:18, 7:17].mean())
        empty_region = float(fields[0, :4, :4].mean())
        semantic_boundary = float(fields[0, 6, 7:17].mean())
        semantic_interior = float(fields[0, 10:14, 10:14].mean())
        self.assertGreater(semantic_region, empty_region + 0.35)
        self.assertGreater(semantic_boundary, semantic_interior * 1.08)

    def test_identical_latents_produce_a_neutral_field(self):
        images = torch.ones(6, 3, 12, 12)
        fields = latent_rgb_structure_fields(images, torch.ones(6))

        self.assertTrue(torch.isfinite(fields).all())
        self.assertLess(float(fields[0].std()), 1e-6)
        self.assertLess(float(fields[1].abs().max()), 1e-6)


if __name__ == "__main__":
    unittest.main()
