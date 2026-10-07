import os
from Crypto.Util.number import getPrime, bytes_to_long, long_to_bytes

FLAG = os.environ.get('FLAG', 'maple{fake_flag}')

p = getPrime(512)
q = getPrime(512)

bit = -1
while bit < 0 or bit > 511:
    bit = int(input("flip a bit? "))

# cosmic ray event ~~
p ^= 1 << bit

n = p*q
e = 65537

ct = pow(bytes_to_long(FLAG.encode()), e, n)
ct_hex = long_to_bytes(ct).hex()


print(f"{n = }")
print(f"{e = }")
print(f"{ct_hex = }")
