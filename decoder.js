const VERSION = 1;
const PC6_RE = /^[1-9][0-9]{3}[A-Z]{2}$/;

export function normalizePc6(raw) {
  return String(raw).replace(/\s+/g, '').toUpperCase();
}

export function isValidPc6(pc) {
  return PC6_RE.test(pc);
}

export function encodePc6(pc) {
  const digits = parseInt(pc.slice(0, 4), 10) - 1000;
  const a = pc.charCodeAt(4) - 65;
  const b = pc.charCodeAt(5) - 65;
  return digits * 676 + a * 26 + b;
}

function readUvarint(buf, pos) {
  let result = 0;
  let shift = 0;
  let byte;
  do {
    byte = buf[pos++];
    result |= (byte & 0x7f) << shift;
    shift += 7;
  } while (byte & 0x80);
  return [result >>> 0, pos];
}

export function decodeData(buf) {
  if (buf[0] !== VERSION) throw new Error('onbekende dataversie ' + buf[0]);
  let pos = 1;
  let count;
  [count, pos] = readUvarint(buf, pos);
  const set = new Set();
  let prev = 0;
  for (let i = 0; i < count; i++) {
    let delta;
    [delta, pos] = readUvarint(buf, pos);
    prev += delta;
    set.add(prev);
  }
  return set;
}
