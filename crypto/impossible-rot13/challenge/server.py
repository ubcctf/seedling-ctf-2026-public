import os
import random
import string
from hashlib import sha256

flag = os.environ.get('FLAG', 'maple{fake_flag}')
assert flag.startswith('maple{') and flag.endswith('}')
flag = flag[6:-1]

alphabet = ''.join(random.sample(string.ascii_lowercase, k=26))
encoded = ''.join(alphabet[(alphabet.index(c) + 13) % 26] for c in flag)

print('checksum:   ', sha256(encoded.encode()).hexdigest())
print('flag(rot13):', encoded)
