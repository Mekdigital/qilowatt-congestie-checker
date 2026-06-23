import os
import openpyxl
from pc6 import normalize_pc6, encode_pc6, encode_file, PC6_RE

INPUT = 'source/Postcodes congestie.xlsx'
SHEET = 'Alles gegroepeerd'
OUTPUT = 'data/congestie.bin'


def load_unique_ints(path=INPUT, sheet=SHEET):
    """Lees de Excel, ontdubbel, geef (gesorteerde unieke ints, aantal_overgeslagen)."""
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb[sheet]
    seen = set()
    skipped = 0
    for _focusgebied, pc in ws.iter_rows(min_row=2, values_only=True):
        if pc is None:
            continue
        norm = normalize_pc6(pc)
        if not PC6_RE.match(norm):
            skipped += 1
            continue
        seen.add(encode_pc6(norm))
    return sorted(seen), skipped


def main():
    ints, skipped = load_unique_ints()
    blob = encode_file(ints)
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, 'wb') as f:
        f.write(blob)
    print(f"unieke postcodes : {len(ints)}")
    print(f"overgeslagen     : {skipped}")
    print(f"bestandsgrootte  : {len(blob)} bytes ({len(blob)/1024:.0f} KB ruw)")


if __name__ == '__main__':
    main()
