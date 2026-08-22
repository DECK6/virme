import unittest

import torch

from latent_video import interpolate_loop, loop_coordinates


class LatentVideoTests(unittest.TestCase):
    def test_loop_coordinates_wrap_without_a_duplicate_terminal_frame(self):
        self.assertEqual(loop_coordinates(0, 120, 5), (0, 1, 0.0))
        self.assertEqual(loop_coordinates(24, 120, 5), (1, 2, 0.0))
        current, following, mix = loop_coordinates(119, 120, 5)
        self.assertEqual((current, following), (4, 0))
        self.assertGreater(mix, 0.99)
        self.assertLess(mix, 1.0)

    def test_interpolation_returns_to_the_first_latent_smoothly(self):
        keyframes = torch.arange(5, dtype=torch.float32).reshape(5, 1, 1)
        start = interpolate_loop(keyframes, 0, 120)
        near_end = interpolate_loop(keyframes, 119, 120)

        self.assertEqual(float(start), 0.0)
        self.assertLess(float(near_end), 0.01)


if __name__ == "__main__":
    unittest.main()
