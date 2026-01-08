interface BOMItem {
  inventory_item_id: string
  quantity: number
  wastage_pct?: number
  cost_override?: number | null
  weighted_avg_cost?: number
}

interface LabourLine {
  labour_type: string
  rate: number
  qty: number
}

interface LabourCosts {
  cutting_cost: number
  embroidery_cost: number
  stitching_cost: number
  finishing_cost: number
}

/**
 * Calculate base cost price from BOM items and labour lines
 */
export function calculateBaseCostPrice(
  bomItems: BOMItem[],
  labourLines: LabourLine[]
): number {
  // Material costs from BOM (with wastage)
  const materialCost = bomItems.reduce((total, item) => {
    const unitCost = item.cost_override ?? item.weighted_avg_cost ?? 0
    const wastageMultiplier = 1 + (item.wastage_pct ?? 0) / 100
    return total + item.quantity * wastageMultiplier * unitCost
  }, 0)

  // Labour costs (sum of rate * qty for all lines)
  const labourCost = labourLines.reduce((total, line) => {
    return total + line.rate * line.qty
  }, 0)

  return materialCost + labourCost
}

/**
 * Calculate base cost price from BOM items and legacy labour costs structure (for backward compatibility)
 */
export function calculateBaseCostPriceLegacy(
  bomItems: BOMItem[],
  labourCosts: LabourCosts
): number {
  // Material costs from BOM (with wastage)
  const materialCost = bomItems.reduce((total, item) => {
    const unitCost = item.cost_override ?? item.weighted_avg_cost ?? 0
    const wastageMultiplier = 1 + (item.wastage_pct ?? 0) / 100
    return total + item.quantity * wastageMultiplier * unitCost
  }, 0)

  // Labour costs
  const labourCost =
    labourCosts.cutting_cost +
    labourCosts.embroidery_cost +
    labourCosts.stitching_cost +
    labourCosts.finishing_cost

  return materialCost + labourCost
}

/**
 * Get cost breakdown for display (new structure with labour lines)
 */
export function getCostBreakdown(
  bomItems: BOMItem[],
  labourLines: LabourLine[]
) {
  const materialBreakdown = bomItems.map((item) => {
    const unitCost = item.cost_override ?? item.weighted_avg_cost ?? 0
    const wastageMultiplier = 1 + (item.wastage_pct ?? 0) / 100
    const lineCost = item.quantity * wastageMultiplier * unitCost
    return {
      ...item,
      unitCost,
      wastageMultiplier,
      cost: lineCost,
    }
  })

  const materialCost = materialBreakdown.reduce((total, item) => total + item.cost, 0)

  const labourBreakdown = labourLines.map((line) => ({
    ...line,
    cost: line.rate * line.qty,
  }))

  const labourCost = labourBreakdown.reduce((total, line) => total + line.cost, 0)

  return {
    materialCost,
    labourCost,
    totalCost: materialCost + labourCost,
    breakdown: {
      materials: materialBreakdown,
      labour: labourBreakdown,
    },
  }
}

/**
 * Get cost breakdown for display (legacy structure for backward compatibility)
 */
export function getCostBreakdownLegacy(
  bomItems: BOMItem[],
  labourCosts: LabourCosts
) {
  const materialBreakdown = bomItems.map((item) => {
    const unitCost = item.cost_override ?? item.weighted_avg_cost ?? 0
    const wastageMultiplier = 1 + (item.wastage_pct ?? 0) / 100
    const lineCost = item.quantity * wastageMultiplier * unitCost
    return {
      ...item,
      unitCost,
      wastageMultiplier,
      cost: lineCost,
    }
  })

  const materialCost = materialBreakdown.reduce((total, item) => total + item.cost, 0)

  const labourCost =
    labourCosts.cutting_cost +
    labourCosts.embroidery_cost +
    labourCosts.stitching_cost +
    labourCosts.finishing_cost

  return {
    materialCost,
    labourCost,
    totalCost: materialCost + labourCost,
    breakdown: {
      materials: materialBreakdown,
      labour: {
        cutting: labourCosts.cutting_cost,
        embroidery: labourCosts.embroidery_cost,
        stitching: labourCosts.stitching_cost,
        finishing: labourCosts.finishing_cost,
      },
    },
  }
}

