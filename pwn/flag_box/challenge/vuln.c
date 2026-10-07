// gcc -std=gnu89 vuln.c -o vuln -no-pie -fno-stack-protector
#include <stdio.h>
#include <stdlib.h>
#include <signal.h>

#define FLAG_SIZE 256
#define BINSH 8

char flag_one[FLAG_SIZE];
char flag_two[FLAG_SIZE];
char flag_three[FLAG_SIZE];
char* bin = "/bin/sh";

void init() {
    setbuf(stdin, NULL);
    setbuf(stdout, NULL);
    setbuf(stderr, NULL);
}

void sigsegv_handler(int sig) {
  printf("%s\n", flag_one);
  fflush(stdout);
  exit(1);
}

void win(int arg1, int arg2) {
    FILE *flag_two_txt = fopen("flag_part_2.txt", "r");

    if (flag_two_txt == NULL) {
        puts("flag part 2 files missing");
        exit(0);
    }

    fread(flag_two, 1, FLAG_SIZE, flag_two_txt);

    if (arg1 == 0xdeadbeef && arg2 == 0x1337) {
        FILE *flag_three_txt = fopen("flag_part_3.txt", "r");
        if (flag_three_txt == NULL) {
            puts("flag part 3 files missing");
            exit(0);
        }
        fread(flag_three, 1, FLAG_SIZE, flag_three_txt);
    }

    if (arg1 == 0xdeadbeef && arg2 == 0x1337) {
        printf("%s\n", flag_three);
    } else {
        printf("%s\n", flag_two);
    }
}

void assembly() {
    __asm__("pop %rdi; ret; pop %rsi; ret; pop %rax; ret; pop %rdx; ret; syscall; ret");
}

int main() {
    init();

    FILE *flag_one_txt = fopen("flag_part_1.txt", "r");

    if (flag_one_txt == NULL) {
        puts("flag part 1 files missing");
        exit(0);
    }

    fread(flag_one, 1, FLAG_SIZE, flag_one_txt);

    signal(SIGSEGV, sigsegv_handler);

    char buf[32];
    puts("input goes here");
    gets(buf);


    return 0;
}
