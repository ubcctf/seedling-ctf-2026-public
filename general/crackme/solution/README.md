Find a wordlist online containing every pokemon name (e.g. [this one](https://gist.github.com/killshot13/5b45c0089c3b1a19028bec38aad8fa46)). We can then use a popular hash cracker like Hashcat or John the Ripper
and run a wordlist + mask attack to brute force the password.

For example, the following John command finds the password in under two minutes:

```
john --wordlist=pokemon.txt --mask='?w?d?d?d?d' hash.txt
```

The `hash.txt` can be extracted using a tool like `zip2john`, which comes with John the Ripper.
The final password is: `bombirdier5183`.
