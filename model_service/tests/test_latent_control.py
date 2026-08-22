import unittest

from latent_control import ModelRequest, derive_control


class LatentControlTests(unittest.TestCase):
    def test_control_is_deterministic_and_bounded(self):
        request = ModelRequest(
            signals=[0.2, 0.8, 0.1, 0.5, 0.3],
            activity=0.7,
            change=0.4,
            confidence=0.9,
            intensity=0.86,
            state="novelty",
            seed=261832,
        )

        first = derive_control(request)
        second = derive_control(request)

        self.assertEqual(first, second)
        self.assertEqual(len(first.secondary_seeds), 5)
        self.assertTrue(all(0 <= value < 2**31 for value in first.secondary_seeds))
        self.assertGreaterEqual(first.truncation, 0.35)
        self.assertLessEqual(first.truncation, 1.0)

    def test_zero_signal_profile_still_produces_normalized_weights(self):
        request = ModelRequest(
            signals=[0, 0, 0, 0, 0], activity=0, change=0,
            confidence=0, intensity=0, state="stability", seed=1,
        )
        control = derive_control(request)

        self.assertAlmostEqual(sum(control.weights), 1.0)
        self.assertTrue(all(weight >= 0 for weight in control.weights))


if __name__ == "__main__":
    unittest.main()
