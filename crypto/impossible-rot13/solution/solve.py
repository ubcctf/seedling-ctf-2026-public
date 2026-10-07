from pwn import *
import string

def get_encoded_flag():
    context.log_level = 'warn'
    with remote('localhost', 1337) as io:
        io.recvuntil(b'flag(rot13): ')
        return io.recvline().decode().rstrip()

flag_len = len(get_encoded_flag())
cand = [set(string.ascii_lowercase) for _ in range(flag_len)]
while True:
    enc = get_encoded_flag()
    for i in range(flag_len):
        cand[i] -= {enc[i]}
    flag = ''.join('?' if len(c) > 1 else max(c) for c in cand)
    print(flag)
    if '?' not in flag:
        break
