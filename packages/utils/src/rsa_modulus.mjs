import { RandomNumber } from "./beacon.mjs";
import { powmod } from "./utils.mjs";

/**
 *
 * @param _n Number being evaluated
 * @param params rounds and bits being evaluated
 * @param r RandomNumber() generator, will default to creating a new instance (Unwanted!)
 * @returns True if `_n` is prime
 */
export const prime = async (_n, { rounds, bits }, r = 0) => {
  if (_n % 2n == 0 || _n <= 1n) return false;
  let d = _n - 1n;
  while (d % 2n == 0) d /= 2n;

  if (r == 0) {
    r = new RandomNumber();
    await r.setup(bits);
  }

  return (
    (
      await Promise.all(
        Array(rounds)
          .fill(null)
          .map(async () => {
            const rand = r.rand();
            const a = (rand % BigInt(_n - 4n)) + BigInt(2);
            let x = powmod(BigInt(a), BigInt(d), BigInt(_n));

            if (x == 1n || x == _n - 1n) return 1;

            while (d != _n - 1n) {
              x = powmod(x, 2n, _n);
              d *= 2n;

              if (x == 1n) return 0;
              if (x == _n - 1n) return 1;
            }
            return 0;
          })
      )
    ).reduce((acc, cur) => acc + cur, 0) *
      4 >=
    3 * rounds // Miller - Rabin passes with probability >= 3/4
  );
};

// Computes an RSA Modulus (bi-prime)
export const mod = async (bits, rounds = 4) => {
  const r = new RandomNumber();
  await r.setup(Math.floor(bits / 2));
  // Check if `n` is prime
  // [TODO] write test for prime

  const ans = await Promise.all(
    Array(2)
      .fill(null)
      .map(async () => {
        for (;;) {
          const rand = r.rand();
          const isPrime = await prime(rand, {
            rounds,
            bits: Math.floor(bits / 2),
            r,
          });
          if (isPrime) {
            return rand;
          }
        }
      })
  );
  console.log(ans);
  return ans.reduce((acc, cur) => acc * cur, 1n);
};
