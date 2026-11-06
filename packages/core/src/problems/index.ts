import { ProblemSchema, type Problem } from "@testmeman/contracts";

export const VALID_ANAGRAM: Problem = ProblemSchema.parse({
  slug: "valid-anagram",
  title: "Valid Anagram",
  difficulty: "easy",
  statement:
    "Given two strings s and t, return true if t is an anagram of s, and false otherwise. An anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
  examples: [
    {
      input: 's = "anagram", t = "nagaram"',
      output: "true",
      explanation: "Both strings contain the exact same characters with the same frequencies.",
    },
    {
      input: 's = "rat", t = "car"',
      output: "false",
      explanation: "The characters do not match ('r' vs 'c').",
    },
  ],
  tests: [
    { input: '"anagram"\n"nagaram"', expected: "true", hidden: false },
    { input: '"rat"\n"car"', expected: "false", hidden: false },
    { input: '"listen"\n"silent"', expected: "true", hidden: true },
    { input: '"ab"\n"a"', expected: "false", hidden: true },
    { input: '"aacc"\n"ccac"', expected: "false", hidden: true },
    { input: '"a"\n"a"', expected: "true", hidden: true },
  ],
  starterCode: {
    python: "def is_anagram(s: str, t: str) -> bool:\n    # Write your solution here\n    pass",
    javascript: "function isAnagram(s, t) {\n    // Write your solution here\n}",
    cpp: "bool isAnagram(std::string s, std::string t) {\n    // Write your solution here\n}",
    java: "public boolean isAnagram(String s, String t) {\n    // Write your solution here\n}",
    c: "bool isAnagram(char* s, char* t) {\n    // Write your solution here\n}",
  },
  topics: ["strings", "hash-table", "sorting"],
  timeLimitMs: 2000,
});

export const TWO_SUM: Problem = ProblemSchema.parse({
  slug: "two-sum",
  title: "Two Sum",
  difficulty: "easy",
  statement:
    "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
  examples: [
    {
      input: "[2, 7, 11, 15]\n9",
      output: "[0, 1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
    {
      input: "[3, 2, 4]\n6",
      output: "[1, 2]",
      explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
    },
  ],
  tests: [
    { input: "[2, 7, 11, 15]\n9", expected: "[0, 1]", hidden: false },
    { input: "[3, 2, 4]\n6", expected: "[1, 2]", hidden: true },
    { input: "[3, 3]\n6", expected: "[0, 1]", hidden: true },
  ],
  starterCode: {
    python:
      "def two_sum(nums: list[int], target: int) -> list[int]:\n    # Write your solution here\n    pass",
    cpp: "std::vector<int> twoSum(std::vector<int>& nums, int target) {\n    // Write your solution here\n}",
    c: "int* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    // Write your solution here\n}",
    java: "public int[] twoSum(int[] nums, int target) {\n    // Write your solution here\n}",
    javascript:
      "function twoSum(nums, target) {\n    // Write your solution here\n}",
  },
  topics: ["arrays", "hashing", "two-pointers"],
  timeLimitMs: 2000,
});

export const ISOMORPHIC_STRINGS: Problem = ProblemSchema.parse({
  slug: "isomorphic-strings",
  title: "Isomorphic Strings",
  difficulty: "easy",
  statement:
    "Two strings s and t are isomorphic if the characters in s can be replaced to get t. All occurrences of a character must be replaced with another character while preserving the order of characters. No two characters may map to the same character, but a character may map to itself.",
  examples: [
    {
      input: 's = "egg", t = "add"',
      output: "true",
      explanation: "e maps to a, and g maps to d.",
    },
    {
      input: 's = "foo", t = "bar"',
      output: "false",
      explanation: "o cannot map to both a and r.",
    },
    {
      input: 's = "paper", t = "title"',
      output: "true",
      explanation: "p maps to t, a maps to i, e maps to l, r maps to e.",
    },
  ],
  tests: [
    { input: '"egg"\n"add"', expected: "true", hidden: false },
    { input: '"foo"\n"bar"', expected: "false", hidden: false },
    { input: '"paper"\n"title"', expected: "true", hidden: false },
    { input: '"badc"\n"baba"', expected: "false", hidden: true },
    { input: '"a"\n"a"', expected: "true", hidden: true },
    { input: '"ab"\n"aa"', expected: "false", hidden: true },
  ],
  starterCode: {
    python: "def is_isomorphic(s: str, t: str) -> bool:\n    # Write your solution here\n    pass",
    javascript: "function isIsomorphic(s, t) {\n    // Write your solution here\n}",
    cpp: "bool isIsomorphic(std::string s, std::string t) {\n    // Write your solution here\n}",
    java: "public boolean isIsomorphic(String s, String t) {\n    // Write your solution here\n}",
    c: "bool isIsomorphic(char* s, char* t) {\n    // Write your solution here\n}",
  },
  topics: ["strings", "hash-table"],
  timeLimitMs: 2000,
});

export const REVERSE_STRING: Problem = ProblemSchema.parse({
  slug: "reverse-string",
  title: "Reverse String",
  difficulty: "easy",
  statement: "Write a function that reverses a string. A string can be reviewed as a character array.",
  examples: [
    {
      input: '"hello"',
      output: '"olleh"',
      explanation: "The string 'hello' reversed is 'olleh'.",
    },
  ],
  tests: [
    { input: '"hello"', expected: '"olleh"', hidden: false },
    { input: '""', expected: '""', hidden: true },
    { input: '"a"', expected: '"a"', hidden: true },
    { input: '"ab"', expected: '"ba"', hidden: true },
  ],
  starterCode: {
    python: "def reverse_string(s: str) -> str:\n    # Write your solution here\n    pass",
    cpp: "std::string reverseString(std::string s) {\n    // Write your solution here\n}",
    c: "char* reverseString(char* s) {\n    // Write your solution here\n}",
    java: "public String reverseString(String s) {\n    // Write your solution here\n}",
    javascript: "function reverseString(s) {\n    // Write your solution here\n}",
  },
  topics: ["strings", "two-pointers"],
  timeLimitMs: 1000,
});

export const CONTAINS_DUPLICATE: Problem = ProblemSchema.parse({
  slug: "contains-duplicate",
  title: "Contains Duplicate",
  difficulty: "easy",
  statement:
    "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
  examples: [
    {
      input: "nums = [1, 2, 3, 1]",
      output: "true",
      explanation: "The element 1 occurs at index 0 and index 3.",
    },
    {
      input: "nums = [1, 2, 3, 4]",
      output: "false",
      explanation: "All elements are distinct.",
    },
  ],
  tests: [
    { input: "[1, 2, 3, 1]", expected: "true", hidden: false },
    { input: "[1, 2, 3, 4]", expected: "false", hidden: false },
    { input: "[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]", expected: "true", hidden: false },
    { input: "[]", expected: "false", hidden: true },
    { input: "[42]", expected: "false", hidden: true },
    { input: "[0, 0]", expected: "true", hidden: true },
  ],
  starterCode: {
    python: "def contains_duplicate(nums: list[int]) -> bool:\n    # Write your solution here\n    pass",
    javascript: "function containsDuplicate(nums) {\n    // Write your solution here\n}",
    cpp: "bool containsDuplicate(std::vector<int>& nums) {\n    // Write your solution here\n}",
    java: "public boolean containsDuplicate(int[] nums) {\n    // Write your solution here\n}",
    c: "bool containsDuplicate(int* nums, int numsSize) {\n    // Write your solution here\n}",
  },
  topics: ["arrays", "hash-table", "sorting"],
  timeLimitMs: 2000,
});

export const VALID_PALINDROME: Problem = ProblemSchema.parse({
  slug: "valid-palindrome",
  title: "Valid Palindrome",
  difficulty: "easy",
  statement:
    "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string s, return true if it is a palindrome, or false otherwise.",
  examples: [
    {
      input: 's = "A man, a plan, a canal: Panama"',
      output: "true",
      explanation: '"amanaplanacanalpanama" is a palindrome.',
    },
    {
      input: 's = "race a car"',
      output: "false",
      explanation: '"raceacar" is not a palindrome.',
    },
  ],
  tests: [
    { input: '"A man, a plan, a canal: Panama"', expected: "true", hidden: false },
    { input: '"race a car"', expected: "false", hidden: false },
    { input: '" "', expected: "true", hidden: false },
    { input: '"0P"', expected: "false", hidden: true },
    { input: '"a."', expected: "true", hidden: true },
    { input: '"ab_a"', expected: "true", hidden: true },
  ],
  starterCode: {
    python: "def is_palindrome(s: str) -> bool:\n    # Write your solution here\n    pass",
    javascript: "function isPalindrome(s) {\n    // Write your solution here\n}",
    cpp: "bool isPalindrome(std::string s) {\n    // Write your solution here\n}",
    java: "public boolean isPalindrome(String s) {\n    // Write your solution here\n}",
    c: "bool isPalindrome(char* s) {\n    // Write your solution here\n}",
  },
  topics: ["strings", "two-pointers"],
  timeLimitMs: 2000,
});

export const MAXIMUM_SUBARRAY: Problem = ProblemSchema.parse({
  slug: "maximum-subarray",
  title: "Maximum Subarray",
  difficulty: "medium",
  statement:
    "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
  examples: [
    {
      input: "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
      output: "6",
      explanation: "The subarray [4, -1, 2, 1] has the largest sum 6.",
    },
    {
      input: "nums = [1]",
      output: "1",
      explanation: "The subarray [1] has the largest sum 1.",
    },
    {
      input: "nums = [5, 4, -1, 7, 8]",
      output: "23",
      explanation: "The subarray [5, 4, -1, 7, 8] has the largest sum 23.",
    },
  ],
  tests: [
    { input: "[-2, 1, -3, 4, -1, 2, 1, -5, 4]", expected: "6", hidden: false },
    { input: "[1]", expected: "1", hidden: false },
    { input: "[5, 4, -1, 7, 8]", expected: "23", hidden: false },
    { input: "[-1]", expected: "-1", hidden: true },
    { input: "[-3, -2, -1]", expected: "-1", hidden: true },
    { input: "[0, -3, 1, 1]", expected: "2", hidden: true },
  ],
  starterCode: {
    python: "def max_sub_array(nums: list[int]) -> int:\n    # Write your solution here\n    pass",
    javascript: "function maxSubArray(nums) {\n    // Write your solution here\n}",
    cpp: "int maxSubArray(std::vector<int>& nums) {\n    // Write your solution here\n}",
    java: "public int maxSubArray(int[] nums) {\n    // Write your solution here\n}",
    c: "int maxSubArray(int* nums, int numsSize) {\n    // Write your solution here\n}"
  },
  topics: ["arrays", "dynamic-programming", "divide-and-conquer"],
  timeLimitMs: 2000,
});

export const LONGEST_SUBSTRING_WITHOUT_REPEATING_CHARACTERS: Problem = ProblemSchema.parse({
  slug: "longest-substring-without-repeating-characters",
  title: "Longest Substring Without Repeating Characters",
  difficulty: "medium",
  statement:
    "Given a string s, find the length of the longest substring without repeating characters.",
  examples: [
    {
      input: 's = "abcabcbb"',
      output: "3",
      explanation: 'The answer is "abc", with the length of 3.',
    },
    {
      input: 's = "bbbbb"',
      output: "1",
      explanation: 'The answer is "b", with the length of 1.',
    },
    {
      input: 's = "pwwkew"',
      output: "3",
      explanation: 'The answer is "wke", with the length of 3.',
    },
  ],
  tests: [
    { input: '"abcabcbb"', expected: "3", hidden: false },
    { input: '"bbbbb"', expected: "1", hidden: false },
    { input: '"pwwkew"', expected: "3", hidden: false },
    { input: '""', expected: "0", hidden: true },
    { input: '" "', expected: "1", hidden: true },
    { input: '"dvdf"', expected: "3", hidden: true },
  ],
  starterCode: {
    python: "def length_of_longest_substring(s: str) -> int:\n    # Write your solution here\n    pass",
    javascript: "function lengthOfLongestSubstring(s) {\n    // Write your solution here\n}",
    cpp: "int lengthOfLongestSubstring(std::string s) {\n    // Write your solution here\n}",
    java: "public int lengthOfLongestSubstring(String s) {\n    // Write your solution here\n}",
    c: "int lengthOfLongestSubstring(char* s) {\n    // Write your solution here\n}"
  },
  topics: ["strings", "sliding-window", "hash-table"],
  timeLimitMs: 2000,
});

export const COIN_CHANGE: Problem = ProblemSchema.parse({
  slug: "coin-change",
  title: "Coin Change",
  difficulty: "medium",
  statement:
    "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.",
  examples: [
    {
      input: "coins = [1, 2, 5], amount = 11",
      output: "3",
      explanation: "11 = 5 + 5 + 1",
    },
    {
      input: "coins = [2], amount = 3",
      output: "-1",
      explanation: "The amount 3 cannot be made with coins of denomination 2.",
    },
  ],
  tests: [
    { input: "[1, 2, 5]\n11", expected: "3", hidden: false },
    { input: "[2]\n3", expected: "-1", hidden: false },
    { input: "[1]\n0", expected: "0", hidden: false },
    { input: "[1, 3, 4, 5]\n7", expected: "2", hidden: true },
    { input: "[2, 5, 10, 1]\n27", expected: "4", hidden: true },
  ],
  starterCode: {
    python: "def coin_change(coins: list[int], amount: int) -> int:\n    # Write your solution here\n    pass",
    javascript: "function coinChange(coins, amount) {\n    // Write your solution here\n}",
    cpp: "int coinChange(std::vector<int>& coins, int amount) {\n    // Write your solution here\n}",
    java: "public int coinChange(int[] coins, int amount) {\n    // Write your solution here\n}",
    c: "int coinChange(int* coins, int coinsSize, int amount) {\n    // Write your solution here\n}"
  },
  topics: ["dynamic-programming", "breadth-first-search"],
  timeLimitMs: 2000,
});

export const MERGE_INTERVALS: Problem = ProblemSchema.parse({
  slug: "merge-intervals",
  title: "Merge Intervals",
  difficulty: "medium",
  statement:
    "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
  examples: [
    {
      input: "intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]",
      output: "[[1, 6], [8, 10], [15, 18]]",
      explanation: "Since intervals [1, 3] and [2, 6] overlap, merge them into [1, 6].",
    },
    {
      input: "intervals = [[1, 4], [4, 5]]",
      output: "[[1, 5]]",
      explanation: "Intervals [1, 4] and [4, 5] are considered overlapping.",
    },
  ],
  tests: [
    { input: "[[1, 3], [2, 6], [8, 10], [15, 18]]", expected: "[[1, 6], [8, 10], [15, 18]]", hidden: false },
    { input: "[[1, 4], [4, 5]]", expected: "[[1, 5]]", hidden: false },
    { input: "[[1, 4], [0, 4]]", expected: "[[0, 4]]", hidden: true },
    { input: "[]", expected: "[]", hidden: true },
  ],
  starterCode: {
    python: "def merge(intervals: list[list[int]]) -> list[list[int]]:\n    # Write your solution here\n    pass",
    javascript: "function merge(intervals) {\n    // Write your solution here\n}",
    cpp: "std::vector<std::vector<int>> merge(std::vector<std::vector<int>>& intervals) {\n    // Write your solution here\n}",
    java: "public int[][] merge(int[][] intervals) {\n    // Write your solution here\n}",
    c: "int** merge(int** intervals, int intervalsSize, int* intervalsColSize, int* returnSize, int** returnColumnSizes) {\n    // Write your solution here\n}"
  },
  topics: ["arrays", "sorting"],
  timeLimitMs: 2000,
});

export const TRAPPING_RAIN_WATER: Problem = ProblemSchema.parse({
  slug: "trapping-rain-water",
  title: "Trapping Rain Water",
  difficulty: "hard",
  statement:
    "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
  examples: [
    {
      input: "height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]",
      output: "6",
      explanation: "The elevation map [0,1,0,2,1,0,1,3,2,1,2,1] can trap 6 units of rain water.",
    },
    {
      input: "height = [4, 2, 0, 3, 2, 5]",
      output: "9",
      explanation: "The elevation map traps 9 units of rain water.",
    },
  ],
  tests: [
    { input: "[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]", expected: "6", hidden: false },
    { input: "[4, 2, 0, 3, 2, 5]", expected: "9", hidden: false },
    { input: "[]", expected: "0", hidden: true },
    { input: "[3]", expected: "0", hidden: true },
    { input: "[2, 0, 2]", expected: "2", hidden: true },
  ],
  starterCode: {
    python: "def trap(height: list[int]) -> int:\n    # Write your solution here\n    pass",
    javascript: "function trap(height) {\n    // Write your solution here\n}",
    cpp: "int trap(std::vector<int>& height) {\n    // Write your solution here\n}",
    java: "public int trap(int[] height) {\n    // Write your solution here\n}",
    c: "int trap(int* height, int heightSize) {\n    // Write your solution here\n}"
  },
  topics: ["arrays", "two-pointers", "dynamic-programming", "stack"],
  timeLimitMs: 2000,
});

export const MEDIAN_OF_TWO_SORTED_ARRAYS: Problem = ProblemSchema.parse({
  slug: "median-of-two-sorted-arrays",
  title: "Median of Two Sorted Arrays",
  difficulty: "hard",
  statement:
    "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).",
  examples: [
    {
      input: "nums1 = [1, 3], nums2 = [2]",
      output: "2.0",
      explanation: "merged array = [1, 2, 3] and median is 2.",
    },
    {
      input: "nums1 = [1, 2], nums2 = [3, 4]",
      output: "2.5",
      explanation: "merged array = [1, 2, 3, 4] and median is (2 + 3) / 2 = 2.5.",
    },
  ],
  tests: [
    { input: "[1, 3]\n[2]", expected: "2.0", hidden: false },
    { input: "[1, 2]\n[3, 4]", expected: "2.5", hidden: false },
    { input: "[0, 0]\n[0, 0]", expected: "0.0", hidden: true },
    { input: "[]\n[1]", expected: "1.0", hidden: true },
  ],
  starterCode: {
    python: "def find_median_sorted_arrays(nums1: list[int], nums2: list[int]) -> float:\n    # Write your solution here\n    pass",
    javascript: "function findMedianSortedArrays(nums1, nums2) {\n    // Write your solution here\n}",
    cpp: "double findMedianSortedArrays(std::vector<int>& nums1, std::vector<int>& nums2) {\n    // Write your solution here\n}",
    java: "public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n    // Write your solution here\n}",
    c: "double findMedianSortedArrays(int* nums1, int nums1Size, int* nums2, int nums2Size) {\n    // Write your solution here\n}"
  },
  topics: ["arrays", "binary-search", "divide-and-conquer"],
  timeLimitMs: 2000,
});

export const PROBLEMS: Record<string, Problem> = {
  "valid-anagram": VALID_ANAGRAM,
  "two-sum": TWO_SUM,
  "isomorphic-strings": ISOMORPHIC_STRINGS,
  "reverse-string": REVERSE_STRING,
  "contains-duplicate": CONTAINS_DUPLICATE,
  "valid-palindrome": VALID_PALINDROME,
  "maximum-subarray": MAXIMUM_SUBARRAY,
  "longest-substring-without-repeating-characters": LONGEST_SUBSTRING_WITHOUT_REPEATING_CHARACTERS,
  "coin-change": COIN_CHANGE,
  "merge-intervals": MERGE_INTERVALS,
  "trapping-rain-water": TRAPPING_RAIN_WATER,
  "median-of-two-sorted-arrays": MEDIAN_OF_TWO_SORTED_ARRAYS,
};

export const DEFAULT_PROBLEM_SLUG = "valid-anagram";

/** Retrieve a problem by slug with fallback to DEFAULT_PROBLEM_SLUG. */
export function getProblem(slug?: string): Problem {
  if (!slug) return PROBLEMS[DEFAULT_PROBLEM_SLUG]!;
  const problem = PROBLEMS[slug];
  if (!problem) {
    return PROBLEMS[DEFAULT_PROBLEM_SLUG]!;
  }
  return problem;
}

/** List all available problems for selection. */
export function listProblems(): Array<{
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  topics: string[];
}> {
  return Object.values(PROBLEMS).map((p) => ({
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    topics: p.topics,
  }));
}
