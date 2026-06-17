/**
 * Custom SHA-1 implementation in TypeScript.
 * Takes a message string and returns its 160-bit hex hash string.
 */
export function sha1(msg: string): string {
  function rotateLeft(n: number, s: number): number {
    return (n << s) | (n >>> (32 - s));
  }

  function cvtHex(val: number): string {
    let str = "";
    for (let i = 7; i >= 0; i--) {
      const v = (val >>> (i * 4)) & 0xf;
      str += v.toString(16);
    }
    return str;
  }

  // Convert string to bytes
  const s = unescape(encodeURIComponent(msg)); // UTF-8 encoding
  const n = s.length;
  const words: number[] = [];
  for (let i = 0; i < n; i++) {
    words[i >> 2] |= (s.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }

  // Padding
  words[n >> 2] |= 0x80 << (24 - (n % 4) * 8);
  const wordCount = ((n + 8) >> 6) * 16 + 16;
  while (words.length < wordCount) {
    words.push(0);
  }
  words[wordCount - 1] = n * 8;

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const w: number[] = new Array(80);

  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t++) {
      w[t] = words[i + t];
    }
    for (let t = 16; t < 80; t++) {
      w[t] = rotateLeft(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let t = 0; t < 80; t++) {
      let f = 0;
      let k = 0;
      if (t < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (t < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (rotateLeft(a, 5) + f + e + k + w[t]) | 0;
      e = d;
      d = c;
      c = rotateLeft(b, 30);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
  }

  return cvtHex(h0) + cvtHex(h1) + cvtHex(h2) + cvtHex(h3) + cvtHex(h4);
}

/**
 * Extracts the least significant `bits` of a SHA-1 hash and returns it as a BigInt.
 * This is used to map a key to the `[0, 2^bits - 1]` identifier space.
 */
export function getLeastBits(hashHex: string, bits: number): bigint {
  if (bits <= 0) return 0n;
  if (bits >= 160) return BigInt("0x" + hashHex);

  const fullVal = BigInt("0x" + hashHex);
  const mask = (1n << BigInt(bits)) - 1n;
  return fullVal & mask;
}
