import random
import os

INTRO = """
Welcome to Deciduous!

Deciduous is the premier prediction market platform.

You can gamble on anything ranging from Maple-chan's test scores to Maple-chan's test scores."""


FLAG = os.environ.get('FLAG', 'maple{fake_flag}')
balance = 100
FLAG_COST = 9999


M = 101

a = random.randint(0, M-1)
b = random.randint(0, M-1)

seed1 = random.randint(0, M-1)
seed2 = random.randint(0, M-1)

x1 = seed1
x2 = seed2


def get_score():
    global x1, x2
    c = 9
    x = (a*x1 + b*x2 + c) % M
    x2 = x1
    x1 = x
    return x


def menu():
    print("1. Gamble")
    print("2. Buy flag")
    print()
    opt = -1
    while opt not in [1, 2]:
        opt = int(input("> "))
    return opt


def gamble():
    global balance
    prediction = int(input("How much did maple-chan score this time: "))

    bet = int(input("How much are you betting: "))
    print()

    if bet <= 0:
        print("That's too low!")
        exit()

    if bet > balance:
        print("You don't have that much money!")
        exit()

    score = get_score()

    print(f"Maple-chan scored a {score}.")
    if prediction == score:
        print("win!")
        balance += bet
    else:
        print("lose")
        balance -= bet


def buy_flag():
    if balance >= FLAG_COST:
        print("Wow, you're rich.")
        print("Here's your flag...")
        print(FLAG)
    else:
        print("you broke :c")


if __name__ == '__main__':
    print(INTRO)
    while True:
        print()
        print(f"{balance=}")
        if balance <= 0:
            print("You lost all your money!")
            exit(-1)

        opt = menu()
        if opt == 1:
            gamble()

        elif opt == 2:
            buy_flag()
            exit()
