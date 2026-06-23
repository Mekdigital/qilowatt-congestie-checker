import os
import gzip
import unittest
from pc6 import decode_file, encode_pc6
import build_data


class TestBuild(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ints, cls.skipped = build_data.load_unique_ints()
        path = build_data.OUTPUT
        if os.path.exists(path):
            with open(path, 'rb') as f:
                cls.blob = f.read()
        else:
            cls.blob = None

    def test_unique_count(self):
        self.assertEqual(len(self.ints), 92361)

    def test_no_invalid_rows(self):
        self.assertEqual(self.skipped, 0)

    def test_known_member_present(self):
        self.assertIn(encode_pc6('1271SC'), set(self.ints))

    def test_known_nonmember_absent(self):
        # 1011AB (Amsterdam centrum) zit niet in de congestielijst
        self.assertNotIn(encode_pc6('1011AB'), set(self.ints))

    def test_output_decodes_and_size(self):
        self.assertIsNotNone(self.blob, "draai eerst: python3 build_data.py")
        self.assertEqual(decode_file(self.blob), self.ints)
        self.assertLess(len(self.blob), 120_000)
        self.assertLess(len(gzip.compress(self.blob, 9)), 40_000)


if __name__ == '__main__':
    unittest.main()
