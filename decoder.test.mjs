import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { decodeData, encodePc6, normalizePc6, isValidPc6 } from './decoder.js';

test('encodePc6 matcht de Python-encoder', () => {
  assert.equal(encodePc6('1271SC'), 183666);
  assert.equal(encodePc6('1000AA'), 0);
  assert.equal(encodePc6('9999ZZ'), 6083999);
});

test('normaliseren en valideren', () => {
  assert.equal(normalizePc6('1271 sc'), '1271SC');
  assert.ok(isValidPc6('1271SC'));
  assert.ok(!isValidPc6('0123AB'));
  assert.ok(!isValidPc6('1234A'));
});

test('decode echt bestand: aantal plus lid en niet-lid', () => {
  const buf = new Uint8Array(readFileSync(new URL('./data/congestie.bin', import.meta.url)));
  const set = decodeData(buf);
  assert.equal(set.size, 92361);
  assert.ok(set.has(encodePc6('1271SC')));
  assert.ok(!set.has(encodePc6('1011AB')));
});
