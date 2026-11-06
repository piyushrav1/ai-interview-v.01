/**
 * Wraps or appends a driver harness to candidate code so functions can be
 * called with standard test inputs and their return values printed.
 */
export function wrapCodeWithHarness(language: string, source: string): string {
  // ─────────────────────────────────────────────────────────────────────────
  // 1. PYTHON
  // ─────────────────────────────────────────────────────────────────────────
  if (language === "python") {
    // Enable PEP 563 postponed evaluation of annotations (list[int], etc. on Python 3.8)
    const pythonHeader = "from __future__ import annotations\n";
    const srcWithHeader = source.includes("__future__") ? source : pythonHeader + source;

    if (source.includes("sys.stdin") || source.includes("input()")) {
      return srcWithHeader;
    }

    const pyHelper = `
import sys, json

def _get_func(*names):
    sol = globals().get('Solution')
    if sol:
        inst = sol() if isinstance(sol, type) else sol
        for name in names:
            if hasattr(inst, name):
                return getattr(inst, name)
    for name in names:
        if name in globals():
            return globals()[name]
    return None
`;

    if (source.includes("is_anagram") || source.includes("isAnagram") || source.toLowerCase().includes("anagram")) {
      return `${srcWithHeader}
# --- TestMeMan Test Harness ---
${pyHelper}
if __name__ == '__main__':
    raw = sys.stdin.read().splitlines()
    s = raw[0].strip().strip('"\\'') if len(raw) > 0 else ""
    t = raw[1].strip().strip('"\\'') if len(raw) > 1 else ""
    fn = _get_func('is_anagram', 'isAnagram')
    if fn:
        res = fn(s, t)
        print(str(res).lower() if isinstance(res, bool) else res)
`;
    }

    if (source.includes("two_sum") || source.includes("twoSum")) {
      return `${srcWithHeader}
# --- TestMeMan Test Harness ---
${pyHelper}
if __name__ == '__main__':
    raw = [l.strip() for l in sys.stdin.read().splitlines() if l.strip()]
    nums, target = [], 0
    if len(raw) >= 3 and not raw[0].startswith('['):
        # Format: line 0 = n, line 1 = nums, line 2 = target
        nums = [int(x) for x in raw[1].split()]
        target = int(raw[2])
    elif len(raw) >= 2:
        try: nums = json.loads(raw[0])
        except Exception: nums = [int(x) for x in raw[0].replace('[','').replace(']','').split(',') if x.strip()]
        target = int(raw[1])
    fn = _get_func('two_sum', 'twoSum')
    if fn:
        res = fn(nums, target)
        print(sorted(res))
`;
    }

    if (source.includes("is_isomorphic") || source.includes("isIsomorphic")) {
      return `${srcWithHeader}
# --- TestMeMan Test Harness ---
${pyHelper}
if __name__ == '__main__':
    raw = sys.stdin.read().splitlines()
    s = raw[0].strip().strip('"\\'') if len(raw) > 0 else ""
    t = raw[1].strip().strip('"\\'') if len(raw) > 1 else ""
    fn = _get_func('is_isomorphic', 'isIsomorphic')
    if fn:
        res = fn(s, t)
        print(str(res).lower() if isinstance(res, bool) else res)
`;
    }

    if (source.includes("reverse_string") || source.includes("reverseString")) {
      return `${srcWithHeader}
# --- TestMeMan Test Harness ---
${pyHelper}
if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    s = raw.strip('"\\'')
    fn = _get_func('reverse_string', 'reverseString')
    if fn:
        print(f'"{fn(s)}"')
`;
    }

    if (source.includes("contains_duplicate") || source.includes("containsDuplicate")) {
      return `${srcWithHeader}
# --- TestMeMan Test Harness ---
${pyHelper}
if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    nums = []
    if raw:
        try: nums = json.loads(raw)
        except Exception: nums = [int(x) for x in raw.replace('[','').replace(']','').split(',') if x.strip()]
    fn = _get_func('contains_duplicate', 'containsDuplicate')
    if fn:
        res = fn(nums)
        print(str(res).lower() if isinstance(res, bool) else res)
`;
    }

    if (source.includes("is_palindrome") || source.includes("isPalindrome")) {
      return `${srcWithHeader}
# --- TestMeMan Test Harness ---
${pyHelper}
if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    s = raw.strip('"\\'')
    fn = _get_func('is_palindrome', 'isPalindrome')
    if fn:
        res = fn(s)
        print(str(res).lower() if isinstance(res, bool) else res)
`;
    }

    if (source.includes("max_sub_array") || source.includes("maxSubArray")) {
      return `${srcWithHeader}
# --- TestMeMan Test Harness ---
${pyHelper}
if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    nums = []
    if raw:
        try: nums = json.loads(raw)
        except Exception: nums = [int(x) for x in raw.replace('[','').replace(']','').split(',') if x.strip()]
    fn = _get_func('max_sub_array', 'maxSubArray')
    if fn:
        print(fn(nums))
`;
    }

    if (source.includes("length_of_longest_substring") || source.includes("lengthOfLongestSubstring")) {
      return `${srcWithHeader}
# --- TestMeMan Test Harness ---
${pyHelper}
if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    s = raw.strip('"\\'')
    fn = _get_func('length_of_longest_substring', 'lengthOfLongestSubstring')
    if fn:
        print(fn(s))
`;
    }

    if (source.includes("coin_change") || source.includes("coinChange")) {
      return `${srcWithHeader}
# --- TestMeMan Test Harness ---
${pyHelper}
if __name__ == '__main__':
    raw = [l.strip() for l in sys.stdin.read().splitlines() if l.strip()]
    coins, amount = [], 0
    if len(raw) >= 2:
        try: coins = json.loads(raw[0])
        except Exception: coins = [int(x) for x in raw[0].replace('[','').replace(']','').split(',') if x.strip()]
        amount = int(raw[1])
    fn = _get_func('coin_change', 'coinChange')
    if fn:
        print(fn(coins, amount))
`;
    }

    if (source.includes("merge(") || source.includes("def merge")) {
      return `${srcWithHeader}
# --- TestMeMan Test Harness ---
${pyHelper}
if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    intervals = json.loads(raw) if raw else []
    fn = _get_func('merge')
    if fn:
        print(fn(intervals))
`;
    }

    if (source.includes("trap(") || source.includes("def trap")) {
      return `${srcWithHeader}
# --- TestMeMan Test Harness ---
${pyHelper}
if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    height = []
    if raw:
        try: height = json.loads(raw)
        except Exception: height = [int(x) for x in raw.replace('[','').replace(']','').split(',') if x.strip()]
    fn = _get_func('trap')
    if fn:
        print(fn(height))
`;
    }

    if (source.includes("find_median_sorted_arrays") || source.includes("findMedianSortedArrays")) {
      return `${srcWithHeader}
# --- TestMeMan Test Harness ---
${pyHelper}
if __name__ == '__main__':
    raw = [l.strip() for l in sys.stdin.read().splitlines() if l.strip()]
    nums1, nums2 = [], []
    if len(raw) >= 1:
        try: nums1 = json.loads(raw[0])
        except Exception: pass
    if len(raw) >= 2:
        try: nums2 = json.loads(raw[1])
        except Exception: pass
    fn = _get_func('find_median_sorted_arrays', 'findMedianSortedArrays')
    if fn:
        print(f"{float(fn(nums1, nums2)):.1f}")
`;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. JAVASCRIPT
  // ─────────────────────────────────────────────────────────────────────────
  if (language === "javascript") {
    if (source.includes("readline") || source.includes("fs.readFileSync")) {
      return source;
    }

    const jsHelper = `
const fs = require('fs');
const _rawInput = fs.readFileSync(0, 'utf-8');
const _lines = _rawInput.split('\\n').map(l => l.trim()).filter(Boolean);
function _clean(str) { return str.replace(/^["']|["']$/g, ''); }
function _call(fnName, ...args) {
    try {
        if (typeof Solution !== 'undefined') {
            const inst = typeof Solution === 'function' ? new Solution() : Solution;
            if (inst && typeof inst[fnName] === 'function') return inst[fnName](...args);
        }
    } catch (e) {}
    try {
        const fn = eval(fnName);
        if (typeof fn === 'function') return fn(...args);
    } catch (e) {}
    return null;
}
`;

    if (source.includes("is_anagram") || source.includes("isAnagram") || source.toLowerCase().includes("anagram")) {
      return `${source}
// --- TestMeMan Test Harness ---
${jsHelper}
if (_lines.length >= 2) {
    const s = _clean(_lines[0]);
    const t = _clean(_lines[1]);
    const fnName = typeof isAnagram === 'function' ? 'isAnagram' : 'is_anagram';
    const res = _call(fnName, s, t);
    console.log(typeof res === 'boolean' ? String(res).toLowerCase() : res);
}
`;
    }

    if (source.includes("two_sum") || source.includes("twoSum")) {
      return `${source}
// --- TestMeMan Test Harness ---
${jsHelper}
if (_lines.length >= 2) {
    let nums = [];
    let target = 0;
    if (_lines.length >= 3 && !_lines[0].startsWith('[')) {
        nums = _lines[1].split(' ').map(Number);
        target = Number(_lines[2]);
    } else {
        try { nums = JSON.parse(_lines[0]); } catch { nums = _lines[0].replace(/[\\[\\]]/g, '').split(',').map(Number); }
        target = Number(_lines[1]);
    }
    const fnName = typeof twoSum === 'function' ? 'twoSum' : 'two_sum';
    const res = _call(fnName, nums, target);
    if (Array.isArray(res)) {
        console.log(JSON.stringify(res.sort((a, b) => a - b)));
    } else {
        console.log(res);
    }
}
`;
    }

    if (source.includes("is_isomorphic") || source.includes("isIsomorphic")) {
      return `${source}
// --- TestMeMan Test Harness ---
${jsHelper}
if (_lines.length >= 2) {
    const s = _clean(_lines[0]);
    const t = _clean(_lines[1]);
    const fnName = typeof isIsomorphic === 'function' ? 'isIsomorphic' : 'is_isomorphic';
    const res = _call(fnName, s, t);
    console.log(typeof res === 'boolean' ? String(res).toLowerCase() : res);
}
`;
    }

    if (source.includes("reverse_string") || source.includes("reverseString")) {
      return `${source}
// --- TestMeMan Test Harness ---
${jsHelper}
if (_lines.length >= 1) {
    const s = _clean(_lines[0]);
    const fnName = typeof reverseString === 'function' ? 'reverseString' : 'reverse_string';
    const res = _call(fnName, s);
    console.log(JSON.stringify(res));
}
`;
    }

    if (source.includes("contains_duplicate") || source.includes("containsDuplicate")) {
      return `${source}
// --- TestMeMan Test Harness ---
${jsHelper}
if (_lines.length >= 1) {
    let nums = [];
    try { nums = JSON.parse(_lines[0]); } catch { nums = _lines[0].replace(/[\\[\\]]/g, '').split(',').map(Number); }
    const fnName = typeof containsDuplicate === 'function' ? 'containsDuplicate' : 'contains_duplicate';
    const res = _call(fnName, nums);
    console.log(typeof res === 'boolean' ? String(res).toLowerCase() : res);
}
`;
    }

    if (source.includes("is_palindrome") || source.includes("isPalindrome")) {
      return `${source}
// --- TestMeMan Test Harness ---
${jsHelper}
if (_lines.length >= 1) {
    const s = _clean(_lines[0]);
    const fnName = typeof isPalindrome === 'function' ? 'isPalindrome' : 'is_palindrome';
    const res = _call(fnName, s);
    console.log(typeof res === 'boolean' ? String(res).toLowerCase() : res);
}
`;
    }

    if (source.includes("max_sub_array") || source.includes("maxSubArray")) {
      return `${source}
// --- TestMeMan Test Harness ---
${jsHelper}
if (_lines.length >= 1) {
    let nums = [];
    try { nums = JSON.parse(_lines[0]); } catch { nums = _lines[0].replace(/[\\[\\]]/g, '').split(',').map(Number); }
    const fnName = typeof maxSubArray === 'function' ? 'maxSubArray' : 'max_sub_array';
    console.log(_call(fnName, nums));
}
`;
    }

    if (source.includes("length_of_longest_substring") || source.includes("lengthOfLongestSubstring")) {
      return `${source}
// --- TestMeMan Test Harness ---
${jsHelper}
if (_lines.length >= 1) {
    const s = _clean(_lines[0]);
    const fnName = typeof lengthOfLongestSubstring === 'function' ? 'lengthOfLongestSubstring' : 'length_of_longest_substring';
    console.log(_call(fnName, s));
}
`;
    }

    if (source.includes("coin_change") || source.includes("coinChange")) {
      return `${source}
// --- TestMeMan Test Harness ---
${jsHelper}
if (_lines.length >= 2) {
    let coins = [];
    try { coins = JSON.parse(_lines[0]); } catch { coins = _lines[0].replace(/[\\[\\]]/g, '').split(',').map(Number); }
    const amount = Number(_lines[1]);
    const fnName = typeof coinChange === 'function' ? 'coinChange' : 'coin_change';
    console.log(_call(fnName, coins, amount));
}
`;
    }

    if (source.includes("merge(") || source.includes("merge =")) {
      return `${source}
// --- TestMeMan Test Harness ---
${jsHelper}
if (_lines.length >= 1) {
    const intervals = JSON.parse(_lines[0]);
    console.log(JSON.stringify(_call('merge', intervals)));
}
`;
    }

    if (source.includes("trap(") || source.includes("trap =")) {
      return `${source}
// --- TestMeMan Test Harness ---
${jsHelper}
if (_lines.length >= 1) {
    let height = [];
    try { height = JSON.parse(_lines[0]); } catch { height = _lines[0].replace(/[\\[\\]]/g, '').split(',').map(Number); }
    console.log(_call('trap', height));
}
`;
    }

    if (source.includes("find_median_sorted_arrays") || source.includes("findMedianSortedArrays")) {
      return `${source}
// --- TestMeMan Test Harness ---
${jsHelper}
if (_lines.length >= 2) {
    let n1 = [], n2 = [];
    try { n1 = JSON.parse(_lines[0]); } catch {}
    try { n2 = JSON.parse(_lines[1]); } catch {}
    const fnName = typeof findMedianSortedArrays === 'function' ? 'findMedianSortedArrays' : 'find_median_sorted_arrays';
    console.log(Number(_call(fnName, n1, n2)).toFixed(1));
}
`;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. C++
  // ─────────────────────────────────────────────────────────────────────────
  if (language === "cpp" && !source.includes("main(")) {
    const hasSol = source.includes("class Solution");

    const cppHarnessHelpers = `
// --- TestMeMan C++ Test Harness ---
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <iomanip>
#include <map>
#include <unordered_map>
#include <set>
#include <unordered_set>

static std::vector<int> parseVectorInt(std::string str) {
    std::vector<int> res;
    for (char& c : str) {
        if (c == '[' || c == ']' || c == ',') c = ' ';
    }
    std::stringstream ss(str);
    int val;
    while (ss >> val) res.push_back(val);
    return res;
}

static std::string parseString(std::string str) {
    while (!str.empty() && (str.front() == '"' || str.front() == ' ' || str.front() == '\\r' || str.front() == '\\n')) str.erase(str.begin());
    while (!str.empty() && (str.back() == '"' || str.back() == ' ' || str.back() == '\\r' || str.back() == '\\n')) str.pop_back();
    return str;
}
`;

    if (source.includes("trap(") || source.includes("trap (")) {
      return `${source}
${cppHarnessHelpers}
int main() {
    std::string line;
    if (std::getline(std::cin, line)) {
        std::vector<int> height = parseVectorInt(line);
        ${hasSol ? "Solution sol; std::cout << sol.trap(height) << std::endl;" : "std::cout << trap(height) << std::endl;"}
    }
    return 0;
}
`;
    }

    if (source.includes("is_anagram") || source.includes("isAnagram") || source.toLowerCase().includes("anagram")) {
      const fnName = source.includes("is_anagram") ? "is_anagram" : "isAnagram";
      return `${source}
${cppHarnessHelpers}
int main() {
    std::string s, t;
    if (std::cin >> s >> t) {
        s = parseString(s);
        t = parseString(t);
        bool res = ${hasSol ? `Solution().${fnName}(s, t)` : `${fnName}(s, t)`};
        std::cout << (res ? "true" : "false") << std::endl;
    }
    return 0;
}
`;
    }

    if (source.includes("two_sum") || source.includes("twoSum")) {
      const fnName = source.includes("two_sum") ? "two_sum" : "twoSum";
      return `${source}
${cppHarnessHelpers}
int main() {
    std::string line1, line2, line3;
    if (std::getline(std::cin, line1)) {
        std::vector<int> nums;
        int target = 0;
        if (std::getline(std::cin, line2)) {
            if (std::getline(std::cin, line3)) {
                nums = parseVectorInt(line2);
                target = std::stoi(parseString(line3));
            } else {
                nums = parseVectorInt(line1);
                target = std::stoi(parseString(line2));
            }
        }
        std::vector<int> res = ${hasSol ? `Solution().${fnName}(nums, target)` : `${fnName}(nums, target)`};
        std::sort(res.begin(), res.end());
        if (res.size() >= 2) std::cout << "[" << res[0] << ", " << res[1] << "]" << std::endl;
    }
    return 0;
}
`;
    }

    if (source.includes("is_isomorphic") || source.includes("isIsomorphic")) {
      const fnName = source.includes("is_isomorphic") ? "is_isomorphic" : "isIsomorphic";
      return `${source}
${cppHarnessHelpers}
int main() {
    std::string s, t;
    if (std::cin >> s >> t) {
        s = parseString(s);
        t = parseString(t);
        bool res = ${hasSol ? `Solution().${fnName}(s, t)` : `${fnName}(s, t)`};
        std::cout << (res ? "true" : "false") << std::endl;
    }
    return 0;
}
`;
    }

    if (source.includes("reverse_string") || source.includes("reverseString")) {
      const fnName = source.includes("reverseString") ? "reverseString" : "reverse_string";
      return `${source}
${cppHarnessHelpers}
int main() {
    std::string s;
    if (std::getline(std::cin, s)) {
        s = parseString(s);
        std::string res = ${hasSol ? `Solution().${fnName}(s)` : `${fnName}(s)`};
        std::cout << "\\"" << res << "\\"" << std::endl;
    }
    return 0;
}
`;
    }

    if (source.includes("contains_duplicate") || source.includes("containsDuplicate")) {
      const fnName = source.includes("containsDuplicate") ? "containsDuplicate" : "contains_duplicate";
      return `${source}
${cppHarnessHelpers}
int main() {
    std::string line;
    if (std::getline(std::cin, line)) {
        std::vector<int> nums = parseVectorInt(line);
        bool res = ${hasSol ? `Solution().${fnName}(nums)` : `${fnName}(nums)`};
        std::cout << (res ? "true" : "false") << std::endl;
    }
    return 0;
}
`;
    }

    if (source.includes("is_palindrome") || source.includes("isPalindrome")) {
      const fnName = source.includes("isPalindrome") ? "isPalindrome" : "is_palindrome";
      return `${source}
${cppHarnessHelpers}
int main() {
    std::string s;
    if (std::getline(std::cin, s)) {
        s = parseString(s);
        bool res = ${hasSol ? `Solution().${fnName}(s)` : `${fnName}(s)`};
        std::cout << (res ? "true" : "false") << std::endl;
    }
    return 0;
}
`;
    }

    if (source.includes("max_sub_array") || source.includes("maxSubArray")) {
      const fnName = source.includes("maxSubArray") ? "maxSubArray" : "max_sub_array";
      return `${source}
${cppHarnessHelpers}
int main() {
    std::string line;
    if (std::getline(std::cin, line)) {
        std::vector<int> nums = parseVectorInt(line);
        int res = ${hasSol ? `Solution().${fnName}(nums)` : `${fnName}(nums)`};
        std::cout << res << std::endl;
    }
    return 0;
}
`;
    }

    if (source.includes("length_of_longest_substring") || source.includes("lengthOfLongestSubstring")) {
      const fnName = source.includes("lengthOfLongestSubstring") ? "lengthOfLongestSubstring" : "length_of_longest_substring";
      return `${source}
${cppHarnessHelpers}
int main() {
    std::string s;
    if (std::getline(std::cin, s)) {
        s = parseString(s);
        int res = ${hasSol ? `Solution().${fnName}(s)` : `${fnName}(s)`};
        std::cout << res << std::endl;
    }
    return 0;
}
`;
    }

    if (source.includes("coin_change") || source.includes("coinChange")) {
      const fnName = source.includes("coinChange") ? "coinChange" : "coin_change";
      return `${source}
${cppHarnessHelpers}
int main() {
    std::string line1, line2;
    if (std::getline(std::cin, line1) && std::getline(std::cin, line2)) {
        std::vector<int> coins = parseVectorInt(line1);
        int amount = std::stoi(parseString(line2));
        int res = ${hasSol ? `Solution().${fnName}(coins, amount)` : `${fnName}(coins, amount)`};
        std::cout << res << std::endl;
    }
    return 0;
}
`;
    }

    if (source.includes("find_median_sorted_arrays") || source.includes("findMedianSortedArrays")) {
      const fnName = source.includes("findMedianSortedArrays") ? "findMedianSortedArrays" : "find_median_sorted_arrays";
      return `${source}
${cppHarnessHelpers}
int main() {
    std::string line1, line2;
    if (std::getline(std::cin, line1) && std::getline(std::cin, line2)) {
        std::vector<int> nums1 = parseVectorInt(line1);
        std::vector<int> nums2 = parseVectorInt(line2);
        double res = ${hasSol ? `Solution().${fnName}(nums1, nums2)` : `${fnName}(nums1, nums2)`};
        std::cout << std::fixed << std::setprecision(1) << res << std::endl;
    }
    return 0;
}
`;
    }

    if (source.includes("merge(") || source.includes("merge (")) {
      return `${source}
${cppHarnessHelpers}
int main() {
    std::string line;
    if (std::getline(std::cin, line)) {
        std::vector<std::vector<int>> intervals;
        std::vector<int> nums = parseVectorInt(line);
        for (size_t i = 0; i + 1 < nums.size(); i += 2) {
            intervals.push_back({nums[i], nums[i+1]});
        }
        std::vector<std::vector<int>> res = ${hasSol ? "Solution().merge(intervals)" : "merge(intervals)"};
        std::cout << "[";
        for (size_t i = 0; i < res.size(); i++) {
            std::cout << "[" << res[i][0] << ", " << res[i][1] << "]" << (i + 1 < res.size() ? ", " : "");
        }
        std::cout << "]" << std::endl;
    }
    return 0;
}
`;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. JAVA
  // ─────────────────────────────────────────────────────────────────────────
  if (language === "java" && !source.includes("class Main")) {
    // If candidate used 'public class Solution', replace with 'class Solution' so Main can be public
    let cleanSource = source.replace(/public\s+class\s+Solution/g, "class Solution");

    // If source doesn't define class Solution, wrap methods inside class Solution
    if (!cleanSource.includes("class Solution")) {
      cleanSource = `class Solution {\n${cleanSource}\n}`;
    }

    const javaHarness = `
import java.util.*;
import java.io.*;

${cleanSource}

public class Main {
    private static int[] parseIntArray(String str) {
        str = str.replace("[", "").replace("]", "").trim();
        if (str.isEmpty()) return new int[0];
        String[] parts = str.split(",");
        int[] res = new int[parts.length];
        for (int i = 0; i < parts.length; i++) res[i] = Integer.parseInt(parts[i].trim());
        return res;
    }
    private static String cleanStr(String s) {
        s = s.trim();
        if (s.startsWith("\\"") && s.endsWith("\\"") && s.length() >= 2) return s.substring(1, s.length() - 1);
        if (s.startsWith("'") && s.endsWith("'") && s.length() >= 2) return s.substring(1, s.length() - 1);
        return s;
    }
    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        Solution sol = new Solution();
        List<String> lines = new ArrayList<>();
        String l;
        while ((l = reader.readLine()) != null) {
            if (!l.trim().isEmpty()) lines.add(l.trim());
        }
        if (lines.isEmpty()) return;

        // Dispatch based on problem signature in Solution
        ${source.includes("trap") ? `
            int[] height = parseIntArray(lines.get(0));
            System.out.println(sol.trap(height));
        ` : source.includes("isAnagram") || source.includes("is_anagram") ? `
            String s = cleanStr(lines.get(0));
            String t = cleanStr(lines.get(1));
            System.out.println(sol.isAnagram(s, t));
        ` : source.includes("twoSum") || source.includes("two_sum") ? `
            int[] nums;
            int target;
            if (lines.size() >= 3 && !lines.get(0).startsWith("[")) {
                nums = parseIntArray(lines.get(1).replace(" ", ","));
                target = Integer.parseInt(lines.get(2).trim());
            } else {
                nums = parseIntArray(lines.get(0));
                target = Integer.parseInt(lines.get(1).trim());
            }
            int[] res = sol.twoSum(nums, target);
            Arrays.sort(res);
            System.out.println("[" + res[0] + ", " + res[1] + "]");
        ` : source.includes("isIsomorphic") || source.includes("is_isomorphic") ? `
            String s = cleanStr(lines.get(0));
            String t = cleanStr(lines.get(1));
            System.out.println(sol.isIsomorphic(s, t));
        ` : source.includes("reverseString") || source.includes("reverse_string") ? `
            String s = cleanStr(lines.get(0));
            System.out.println("\\"" + sol.reverseString(s) + "\\"");
        ` : source.includes("containsDuplicate") || source.includes("contains_duplicate") ? `
            int[] nums = parseIntArray(lines.get(0));
            System.out.println(sol.containsDuplicate(nums));
        ` : source.includes("isPalindrome") || source.includes("is_palindrome") ? `
            String s = cleanStr(lines.get(0));
            System.out.println(sol.isPalindrome(s));
        ` : source.includes("maxSubArray") || source.includes("max_sub_array") ? `
            int[] nums = parseIntArray(lines.get(0));
            System.out.println(sol.maxSubArray(nums));
        ` : source.includes("lengthOfLongestSubstring") || source.includes("length_of_longest_substring") ? `
            String s = cleanStr(lines.get(0));
            System.out.println(sol.lengthOfLongestSubstring(s));
        ` : source.includes("coinChange") || source.includes("coin_change") ? `
            int[] coins = parseIntArray(lines.get(0));
            int amount = Integer.parseInt(lines.get(1).trim());
            System.out.println(sol.coinChange(coins, amount));
        ` : source.includes("findMedianSortedArrays") || source.includes("find_median_sorted_arrays") ? `
            int[] n1 = parseIntArray(lines.get(0));
            int[] n2 = parseIntArray(lines.get(1));
            System.out.printf(Locale.US, "%.1f\\n", sol.findMedianSortedArrays(n1, n2));
        ` : source.includes("merge") ? `
            int[] flat = parseIntArray(lines.get(0));
            int[][] intervals = new int[flat.length / 2][2];
            for (int i = 0; i < flat.length; i += 2) {
                intervals[i/2][0] = flat[i];
                intervals[i/2][1] = flat[i+1];
            }
            int[][] res = sol.merge(intervals);
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < res.length; i++) {
                sb.append("[").append(res[i][0]).append(", ").append(res[i][1]).append("]");
                if (i + 1 < res.length) sb.append(", ");
            }
            sb.append("]");
            System.out.println(sb.toString());
        ` : `
            System.out.println("No matching handler");
        `}
    }
}
`;
    return javaHarness;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. C
  // ─────────────────────────────────────────────────────────────────────────
  if (language === "c" && !source.includes("main(")) {
    const cHarness = `
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include <ctype.h>

${source}

static int* cParseArray(const char* str, int* outSize) {
    int cap = 16, count = 0;
    int* arr = (int*)malloc(cap * sizeof(int));
    const char* p = str;
    while (*p) {
        while (*p && (*p == '[' || *p == ']' || *p == ',' || *p == ' ' || *p == '\\n' || *p == '\\r')) p++;
        if (!*p) break;
        char* end;
        long val = strtol(p, &end, 10);
        if (p == end) break;
        if (count >= cap) {
            cap *= 2;
            arr = (int*)realloc(arr, cap * sizeof(int));
        }
        arr[count++] = (int)val;
        p = end;
    }
    *outSize = count;
    return arr;
}

static void cTrimQuotes(char* str) {
    int len = strlen(str);
    while (len > 0 && (str[len-1] == '\\n' || str[len-1] == '\\r' || str[len-1] == ' ' || str[len-1] == '"' || str[len-1] == '\\'')) {
        str[--len] = '\\0';
    }
    int start = 0;
    while (str[start] == '"' || str[start] == '\\'' || str[start] == ' ') start++;
    if (start > 0) {
        memmove(str, str + start, len - start + 1);
    }
}

int main() {
    ${source.includes("trap") ? `
        char buf[8192];
        if (fgets(buf, sizeof(buf), stdin)) {
            int n = 0;
            int* height = cParseArray(buf, &n);
            printf("%d\\n", trap(height, n));
            free(height);
        }
    ` : source.includes("isAnagram") || source.includes("is_anagram") ? `
        char s[1024], t[1024];
        if (scanf("%1023s %1023s", s, t) == 2) {
            cTrimQuotes(s); cTrimQuotes(t);
            bool res = isAnagram(s, t);
            printf("%s\\n", res ? "true" : "false");
        }
    ` : source.includes("twoSum") || source.includes("two_sum") ? `
        char buf1[4096], buf2[1024];
        if (fgets(buf1, sizeof(buf1), stdin) && fgets(buf2, sizeof(buf2), stdin)) {
            int n = 0;
            int* nums = cParseArray(buf1, &n);
            int target = atoi(buf2);
            int retSize = 0;
            int* res = twoSum(nums, n, target, &retSize);
            if (res && retSize >= 2) {
                if (res[0] > res[1]) { int tmp = res[0]; res[0] = res[1]; res[1] = tmp; }
                printf("[%d, %d]\\n", res[0], res[1]);
            }
            free(nums);
        }
    ` : source.includes("isIsomorphic") || source.includes("is_isomorphic") ? `
        char s[1024], t[1024];
        if (scanf("%1023s %1023s", s, t) == 2) {
            cTrimQuotes(s); cTrimQuotes(t);
            bool res = isIsomorphic(s, t);
            printf("%s\\n", res ? "true" : "false");
        }
    ` : source.includes("reverseString") || source.includes("reverse_string") ? `
        char s[4096];
        if (fgets(s, sizeof(s), stdin)) {
            cTrimQuotes(s);
            char* res = reverseString(s);
            printf("\\"%s\\"\\n", res ? res : s);
        }
    ` : source.includes("containsDuplicate") || source.includes("contains_duplicate") ? `
        char buf[8192];
        if (fgets(buf, sizeof(buf), stdin)) {
            int n = 0;
            int* nums = cParseArray(buf, &n);
            bool res = containsDuplicate(nums, n);
            printf("%s\\n", res ? "true" : "false");
            free(nums);
        }
    ` : source.includes("isPalindrome") || source.includes("is_palindrome") ? `
        char s[4096];
        if (fgets(s, sizeof(s), stdin)) {
            cTrimQuotes(s);
            bool res = isPalindrome(s);
            printf("%s\\n", res ? "true" : "false");
        }
    ` : source.includes("maxSubArray") || source.includes("max_sub_array") ? `
        char buf[8192];
        if (fgets(buf, sizeof(buf), stdin)) {
            int n = 0;
            int* nums = cParseArray(buf, &n);
            int res = maxSubArray(nums, n);
            printf("%d\\n", res);
            free(nums);
        }
    ` : source.includes("lengthOfLongestSubstring") || source.includes("length_of_longest_substring") ? `
        char s[4096];
        if (fgets(s, sizeof(s), stdin)) {
            cTrimQuotes(s);
            int res = lengthOfLongestSubstring(s);
            printf("%d\\n", res);
        }
    ` : source.includes("coinChange") || source.includes("coin_change") ? `
        char buf1[4096], buf2[1024];
        if (fgets(buf1, sizeof(buf1), stdin) && fgets(buf2, sizeof(buf2), stdin)) {
            int n = 0;
            int* coins = cParseArray(buf1, &n);
            int amount = atoi(buf2);
            int res = coinChange(coins, n, amount);
            printf("%d\\n", res);
            free(coins);
        }
    ` : source.includes("findMedianSortedArrays") || source.includes("find_median_sorted_arrays") ? `
        char buf1[4096], buf2[4096];
        if (fgets(buf1, sizeof(buf1), stdin) && fgets(buf2, sizeof(buf2), stdin)) {
            int n1 = 0, n2 = 0;
            int* a1 = cParseArray(buf1, &n1);
            int* a2 = cParseArray(buf2, &n2);
            double res = findMedianSortedArrays(a1, n1, a2, n2);
            printf("%.1f\\n", res);
            free(a1); free(a2);
        }
    ` : `
        printf("0\\n");
    `}
    return 0;
}
`;
    return cHarness;
  }

  return source;
}
