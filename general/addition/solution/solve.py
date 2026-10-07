from pwn import *
from tqdm import trange

io = remote('localhost', 1337)

io.recvlines(2)
for _ in trange(500):
    io.recvuntil(b': ')
    a, b = map(int, io.recvuntil(b' = ', drop=True).split(b' + '))
    io.sendline(b'%d' % (a + b))

io.interactive()
