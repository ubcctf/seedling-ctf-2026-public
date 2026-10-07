import random

print('To solve this challenge, answer 500 math problems!')
print('Hint: write a script (e.g. `pwntools`) to automate the process.\n')

for num in range(500):
    a = random.randrange(6767)
    b = random.randrange(6767)
    c = int(input(f'Level {num + 1}: {a} + {b} = '))
    if c == a + b:
        print('Correct!')
    else:
        print('Wrong!')
        exit(1)

with open('flag.txt', 'r') as f:
    print(f.read().rstrip())
