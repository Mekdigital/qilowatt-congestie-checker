import re

VERSION = 1
PC6_RE = re.compile(r'^[1-9][0-9]{3}[A-Z]{2}$')


def normalize_pc6(raw):
    """Strip alle whitespace, uppercase. Resultaat kan nog ongeldig zijn."""
    return re.sub(r'\s+', '', str(raw)).upper()


def encode_pc6(pc):
    """Encode een genormaliseerde, geldige PC6 'DDDDLL' naar een 23-bits int."""
    digits = int(pc[:4]) - 1000
    a = ord(pc[4]) - 65
    b = ord(pc[5]) - 65
    return digits * 676 + a * 26 + b


def write_uvarint(out, value):
    """Voeg een unsigned LEB128 varint toe aan bytearray out."""
    while True:
        byte = value & 0x7F
        value >>= 7
        if value:
            out.append(byte | 0x80)
        else:
            out.append(byte)
            break


def read_uvarint(buf, pos):
    """Lees een unsigned LEB128 varint uit buf op positie pos. Geeft (waarde, nieuwe_pos)."""
    result = 0
    shift = 0
    while True:
        byte = buf[pos]
        pos += 1
        result |= (byte & 0x7F) << shift
        if not (byte & 0x80):
            return result, pos
        shift += 7


def encode_file(ints):
    """ints: gesorteerde lijst unieke ints. Geeft bytes: versie, aantal, delta-varints."""
    out = bytearray()
    out.append(VERSION)
    write_uvarint(out, len(ints))
    prev = 0
    for v in ints:
        write_uvarint(out, v - prev)
        prev = v
    return bytes(out)


def decode_file(buf):
    """Inverse van encode_file. Geeft gesorteerde lijst ints."""
    assert buf[0] == VERSION, f"onbekende versie {buf[0]}"
    pos = 1
    count, pos = read_uvarint(buf, pos)
    ints = []
    prev = 0
    for _ in range(count):
        delta, pos = read_uvarint(buf, pos)
        prev += delta
        ints.append(prev)
    return ints
