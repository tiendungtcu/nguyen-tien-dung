// O(1) using arithmetic series formula
export function sum_to_n_a(n: number): number {
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
}

// O(n) iterative accumulation
export function sum_to_n_b(n: number): number {
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
}

// O(log n) recursion depth via divide-and-conquer summation
export function sum_to_n_c(n: number): number {
  if (!Number.isInteger(n)) {
    throw new Error("n must be an integer");
  }
  const positive_n = Math.abs(n);
  const helper = (start: number, end: number): number => {
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
}
