from pwn import *
from Crypto.Util.number import bytes_to_long, long_to_bytes, getPrime, isPrime
from sympy.ntheory.modular import solve_congruence

context.log_level = "warn"


def oracle(bit):
    with remote("localhost", 1337) as io:
        io.sendlineafter(b"flip a bit? ", b"%d" % bit)
        io.recvuntil(b"n = ")
        n = int(io.recvline())
        io.recvuntil(b"e = ")
        e = int(io.recvline())
        io.recvuntil(b"ct_hex = ")
        c = bytes_to_long(bytes.fromhex(eval(io.recvline().decode())))
        return (n, e, c)


nbits = 512

congruences = []
while True:
    n, e, c = oracle(67)
    for r in range(2, 10**4):
        if isPrime(r) and n % r == 0:
            # c = flag^e (mod n) =>
            # c = flag^e (mod r)
            flag_mod_r = next(i for i in range(r) if pow(i, e, r) == c % r)
            congruences.append((flag_mod_r, r))

    flag_partial = int(solve_congruence(*congruences)[0])
    print(long_to_bytes(flag_partial))
