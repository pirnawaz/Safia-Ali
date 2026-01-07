interface BOMItem {
  inventory_item_id: string
  quantity: number
  unit_cost_reference?: number
  weighted_avg_cost?: number
}

interface LabourCosts {
  cutting_cost: number
  embroidery_cost: number
  stitching_cost: number
  finishing_cost: number
}

/**
 * Calculate base cost price from BOM items and labour costs
 */
export function calculateBaseCostPrice(
  bomItems: BOMItem[],
  labourCosts: LabourCosts
): number {
  // Material costs from BOM
  const materialCost = bomItems.reduce((total, item) => {
    const unitCost = item.unit_cost_reference ?? item.weighted_avg_cost ?? 0
    return total + item.quantity * unitCost
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
 * Get cost breakdown for display
 */
export function getCostBreakdown(
  bomItems: BOMItem[],
  labourCosts: LabourCosts
) {
  const materialCost = bomItems.reduce((total, item) => {
    const unitCost = item.unit_cost_reference ?? item.weighted_avg_cost ?? 0
    return total + item.quantity * unitCost
  }, 0)

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
      materials: bomItems.map((item) => ({
        ...item,
        cost: item.quantity * (item.unit_cost_reference ?? item.weighted_avg_cost ?? 0),
      })),
      labour: {
        cutting: labourCosts.cutting_cost,
        embroidery: labourCosts.embroidery_cost,
        stitching: labourCosts.stitching_cost,
        finishing: labourCosts.finishing_cost,
      },
    },
  }
}

