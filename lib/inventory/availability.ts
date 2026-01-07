interface StockLevel {
  quantity: number
  reserved_quantity: number
}

/**
 * Calculate available quantity (quantity - reserved_quantity)
 */
export function getAvailableQuantity(stockLevel: StockLevel): number {
  return Math.max(0, stockLevel.quantity - stockLevel.reserved_quantity)
}

/**
 * Check if requested quantity is available
 */
export function isQuantityAvailable(
  stockLevel: StockLevel,
  requestedQuantity: number
): boolean {
  return getAvailableQuantity(stockLevel) >= requestedQuantity
}

/**
 * Check if quantity can be issued (with optional override)
 */
export function canIssueQuantity(
  stockLevel: StockLevel,
  requestedQuantity: number,
  allowOverride: boolean = false
): { canIssue: boolean; available: number; requiresOverride: boolean } {
  const available = getAvailableQuantity(stockLevel)
  const canIssue = available >= requestedQuantity
  const requiresOverride = !canIssue && allowOverride

  return {
    canIssue: canIssue || requiresOverride,
    available,
    requiresOverride: !canIssue && requestedQuantity > available,
  }
}

