/**
 * Calculate weighted average cost
 * Formula: (old_quantity * old_cost + new_quantity * new_cost) / (old_quantity + new_quantity)
 */
export function calculateWeightedAverage(
  oldQuantity: number,
  oldCost: number,
  newQuantity: number,
  newCost: number
): number {
  if (oldQuantity + newQuantity === 0) return 0
  return (
    (oldQuantity * oldCost + newQuantity * newCost) /
    (oldQuantity + newQuantity)
  )
}

/**
 * Update weighted average cost after receiving stock
 */
export function updateWeightedAverageAfterGRN(
  currentQuantity: number,
  currentWeightedAvgCost: number,
  receivedQuantity: number,
  receivedCost: number
): number {
  return calculateWeightedAverage(
    currentQuantity,
    currentWeightedAvgCost,
    receivedQuantity,
    receivedCost
  )
}

