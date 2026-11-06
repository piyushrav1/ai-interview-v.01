/**
 * Statistical Computation Module for Pilot Evaluation & Calibration.
 * Implements Pearson r, MAE, RMSE, and Quadratic Weighted Cohen's Kappa
 * with exhaustive boundary condition and zero-variance protection.
 */

/**
 * Calculates Pearson correlation coefficient (r) between two series.
 * Range: [-1.0, 1.0].
 */
export function calculatePearsonR(x: number[], y: number[]): number {
  if (x.length !== y.length) {
    throw new Error(`Array lengths must match: x=${x.length}, y=${y.length}`);
  }

  const n = x.length;
  if (n < 2) {
    if (n === 1) {
      return x[0] === y[0] ? 1.0 : 0.0;
    }
    return 0.0;
  }

  const firstX = x[0]!;
  const firstY = y[0]!;

  // Check if both arrays are constant and identical
  const allIdentical = x.every((val, i) => val === y[i]);
  const xConstant = x.every((val) => val === firstX);
  const yConstant = y.every((val) => val === firstY);

  if (xConstant && yConstant) {
    return allIdentical ? 1.0 : 0.0;
  }
  if (xConstant || yConstant) {
    // One is constant, the other varies -> covariance is zero
    return 0.0;
  }

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i]!;
    sumY += y[i]!;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0;
  let ssX = 0;
  let ssY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i]! - meanX;
    const diffY = y[i]! - meanY;
    numerator += diffX * diffY;
    ssX += diffX * diffX;
    ssY += diffY * diffY;
  }

  const denominator = Math.sqrt(ssX * ssY);
  if (denominator === 0) {
    return allIdentical ? 1.0 : 0.0;
  }

  const r = numerator / denominator;
  // Clamp between -1.0 and 1.0 to guard against floating-point inaccuracies
  const clamped = Math.max(-1.0, Math.min(1.0, r));
  return Math.round(clamped * 10000) / 10000;
}

/**
 * Calculates Mean Absolute Error (MAE) between actual and predicted values.
 */
export function calculateMAE(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length) {
    throw new Error(`Array lengths must match: actual=${actual.length}, predicted=${predicted.length}`);
  }
  if (actual.length === 0) return 0.0;

  let sum = 0;
  for (let i = 0; i < actual.length; i++) {
    sum += Math.abs(actual[i]! - predicted[i]!);
  }
  const mae = sum / actual.length;
  return Math.round(mae * 10000) / 10000;
}

/**
 * Calculates Root Mean Square Error (RMSE) between actual and predicted values.
 */
export function calculateRMSE(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length) {
    throw new Error(`Array lengths must match: actual=${actual.length}, predicted=${predicted.length}`);
  }
  if (actual.length === 0) return 0.0;

  let sumSq = 0;
  for (let i = 0; i < actual.length; i++) {
    const diff = actual[i]! - predicted[i]!;
    sumSq += diff * diff;
  }
  const rmse = Math.sqrt(sumSq / actual.length);
  return Math.round(rmse * 10000) / 10000;
}

/**
 * Calculates Quadratic Weighted Cohen's Kappa for ordinal ratings (default 1 to 4).
 * Gives greater penalty to ratings that differ by 2 or 3 grades than adjacent grades.
 * Range: [-1.0, 1.0], where 1.0 is perfect agreement and 0 is chance agreement.
 */
export function calculateQuadraticWeightedKappa(
  actual: number[],
  predicted: number[],
  minCategory: number = 1,
  maxCategory: number = 4
): number {
  if (actual.length !== predicted.length) {
    throw new Error(`Array lengths must match: actual=${actual.length}, predicted=${predicted.length}`);
  }
  const n = actual.length;
  if (n === 0) return 1.0;

  // Check perfect agreement
  if (actual.every((val, i) => val === predicted[i])) {
    return 1.0;
  }

  const k = maxCategory - minCategory + 1;
  if (k <= 1) return 1.0;

  // Initialize Observed matrix O of size k x k
  const O: number[][] = Array.from({ length: k }, () => Array(k).fill(0));
  const rowSums: number[] = Array(k).fill(0);
  const colSums: number[] = Array(k).fill(0);

  for (let idx = 0; idx < n; idx++) {
    const rawA = actual[idx] ?? minCategory;
    const rawP = predicted[idx] ?? minCategory;
    const a = Math.max(minCategory, Math.min(maxCategory, Math.round(rawA))) - minCategory;
    const p = Math.max(minCategory, Math.min(maxCategory, Math.round(rawP))) - minCategory;
    O[a]![p]! += 1;
    rowSums[a]! += 1;
    colSums[p]! += 1;
  }

  // Weight matrix W with quadratic penalty: w_ij = (i - j)^2 / (k - 1)^2
  const maxDiffSq = (k - 1) * (k - 1);
  let observedWeightedDisagreement = 0;
  let expectedWeightedDisagreement = 0;

  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      const weight = ((i - j) * (i - j)) / maxDiffSq;
      // Observed proportion
      const propO = (O[i]![j] ?? 0) / n;
      // Expected proportion under chance independence
      const propE = ((rowSums[i] ?? 0) * (colSums[j] ?? 0)) / (n * n);

      observedWeightedDisagreement += weight * propO;
      expectedWeightedDisagreement += weight * propE;
    }
  }

  if (expectedWeightedDisagreement === 0) {
    return observedWeightedDisagreement === 0 ? 1.0 : 0.0;
  }

  const kappa = 1.0 - observedWeightedDisagreement / expectedWeightedDisagreement;
  const clamped = Math.max(-1.0, Math.min(1.0, kappa));
  return Math.round(clamped * 10000) / 10000;
}
