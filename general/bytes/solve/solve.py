from pwn import *

io = remote("localhost", 1337)

for _ in range(50):
    io.recvuntil(b"Level ")

    line = io.recvline()

    hex_data = line.split(b": ")[1] # the <0x4a 0x1b 0x3d; Send 3 bytes> part
    hex_data = hex_data.split(b";")[0] # the 0x4a 0x1b 0x3d part

    hex_data = hex_data.replace(b"0x", b"")

    payload = bytes.fromhex(hex_data.decode())

    io.sendline(payload)

io.interactive()
