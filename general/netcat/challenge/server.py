print('Q: Who is the best CTF team in Canada?')

answer = input('A: ').lower()

if answer in ('maple bacon', 'maplebacon', 'mb', 'ubc', 'ubcctf'):
    with open('flag.txt', 'r') as f:
        print(f'Correct! Here is the flag: {f.read().strip()}')
elif answer in ('uoft', 'uoftctf', 'uoft ctf', 'ggs', 'go go squid', 'go go squid!'):
    print("Ha! Don't even think about it...")
elif not answer:
    print('You gave an empty answer!')
else:
    print('Sorry, that is the wrong answer.')
