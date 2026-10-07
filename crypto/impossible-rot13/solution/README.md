This challenge looks impossible at first, but we can make use of the fact that we can
connect to the server multiple times, where the flag stays the same but the alphabet changes
every time. One observation is that the `sha256` checksum is useless, since you cannot
reverse a cryptographically secure hash function (doing so would require a brute force of
`26!` over all permutations of a random alphabet, which is infeasible).

The key observation required to solve the challenge is to notice that for any particular
flag character (i.e. `flag[i]`), it will get mapped to some other random character,
**but it cannot be get mapped to itself**. Therefore, if we collect enough ciphertexts,
then for each index, the character that *never* shows up must be the original flag
character.

See the solve script in `solve.py`.
