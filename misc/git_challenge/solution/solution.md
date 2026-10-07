There are multiple ways to solve this.

## Solution 1
Simply run `git log -p | grep "maple{"` to filter out diffs directly.

## Solution 2
1. Run `git log --diff-filter=D --summary | grep -C 2 "api"` to run a search for suspicious file names that have been deleted. This will also output the commit before which the files were deleted. Other keywords such as "key" or "api_key" could also work.
2. Copy paste the commit hash and `git checkout ...` to it.
3. From there, run `grep -r "maple{" .` to find the flag.

