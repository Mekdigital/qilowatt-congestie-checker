import unittest
from pc6 import normalize_pc6, encode_pc6, encode_file, decode_file, PC6_RE


class TestPc6(unittest.TestCase):
    def test_normalize_strips_space_and_uppercases(self):
        self.assertEqual(normalize_pc6('1271 sc'), '1271SC')
        self.assertEqual(normalize_pc6('  1271sc '), '1271SC')

    def test_encode_known_value(self):
        # (1271-1000)*676 + ('S'-'A')*26 + ('C'-'A') = 183196 + 468 + 2
        self.assertEqual(encode_pc6('1271SC'), 183666)

    def test_encode_bounds(self):
        self.assertEqual(encode_pc6('1000AA'), 0)
        self.assertEqual(encode_pc6('9999ZZ'), 6083999)
        self.assertLess(encode_pc6('9999ZZ'), 1 << 23)

    def test_regex_rejects_bad(self):
        for bad in ['0123AB', '1234A', '1234ABC', 'ABCDEF', '12 3AB']:
            self.assertIsNone(PC6_RE.match(normalize_pc6(bad)))

    def test_file_roundtrip(self):
        ints = sorted({encode_pc6(p) for p in ['1271SC', '1300FQ', '1000AA', '9999ZZ']})
        self.assertEqual(decode_file(encode_file(ints)), ints)

    def test_decode_rejects_wrong_version(self):
        bad = bytearray(encode_file([5, 9]))
        bad[0] = 99
        with self.assertRaises(AssertionError):
            decode_file(bytes(bad))


if __name__ == '__main__':
    unittest.main()
