// Solution 1: arithmetic series formula (constant time)
const sum_to_n_a = function (n) {
  if (!Number.isInteger(n)) {
    throw new Error("n must be an integer");
  }
  const positive_n = Math.abs(n);
  const total = (positive_n * (positive_n + 1)) / 2;
  if (n >= 0) {
    return total;
  } else {
    // For negative n, sum from 1 to n (e.g., n = -3: 1 + 0 + (-1) + (-2) + (-3))
    return 1 - total;
  }
};

// Solution 2: iterative accumulation using a simple loop (linear time)
const sum_to_n_b = function (n) {
  if (!Number.isInteger(n)) {
    throw new Error("n must be an integer");
  }
  let total = 0;
  if (n >= 0) {
    for (let i = 1; i <= n; i++) {
      total += i;
    }
  } else {
    // For negative n, sum from 1 to n (e.g., n = -3: 1 + 0 + (-1) + (-2) + (-3))
    for (let i = 1; i >= n; i -= 1) {
      total += i;
    }
  }
  return total;
};

// Solution 3: recursion with divide and conquer limits stack depth to O(log n), but overall time is O(n)
const sum_to_n_c = function (n) {
  if (!Number.isInteger(n)) {
    throw new Error("n must be an integer");
  }
  const positive_n = Math.abs(n);
  const helper = (start, end) => {
    if (start > end) return 0;
    if (start === end) return start;
    const mid = Math.floor((start + end) / 2);
    return helper(start, mid) + helper(mid + 1, end);
  };
  const total = helper(1, positive_n);
  if (n >= 0) {
    return total;
  } else {
    // For negative n, sum from 1 to n (e.g., n = -3: 1 + 0 + (-1) + (-2) + (-3))
    return 1 - total;
  }
};

export { sum_to_n_a, sum_to_n_b, sum_to_n_c };
