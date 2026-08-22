import unittest

from latent_modes import MULTI_CLASS_MODES


class LatentModesTests(unittest.TestCase):
    def test_object_and_situation_use_distinct_multi_class_routes(self):
        self.assertEqual([mode.mode_id for mode in MULTI_CLASS_MODES], ["object", "situation"])
        self.assertEqual(len({mode.output_name for mode in MULTI_CLASS_MODES}), 2)
        for mode in MULTI_CLASS_MODES:
            self.assertGreaterEqual(len(mode.classes), 5)
            self.assertEqual(len(mode.classes), len(mode.seeds))
            self.assertEqual(len(set(mode.classes)), len(mode.classes))

    def test_routes_match_the_poc_class_contract(self):
        object_mode, situation_mode = MULTI_CLASS_MODES
        self.assertEqual(object_mode.classes, (414, 504, 559, 732, 892, 968))
        self.assertEqual(situation_mode.classes, (424, 454, 582, 624, 762, 819, 978))


if __name__ == "__main__":
    unittest.main()
