import { calculateBaseCostPrice, getCostBreakdown } from "@/lib/calculations/cost"

describe("Cost Calculations", () => {
  const mockBOMItems = [
    {
      inventory_item_id: "1",
      quantity: 3.5,
      unit_cost_reference: 150,
      weighted_avg_cost: 150,
    },
    {
      inventory_item_id: "2",
      quantity: 2.0,
      unit_cost_reference: 25,
      weighted_avg_cost: 25,
    },
  ]

  const mockLabourCosts = {
    cutting_cost: 200,
    embroidery_cost: 800,
    stitching_cost: 500,
    finishing_cost: 300,
  }

  it("should calculate base cost price correctly", () => {
    const cost = calculateBaseCostPrice(mockBOMItems, mockLabourCosts)
    // Material: (3.5 * 150) + (2.0 * 25) = 525 + 50 = 575
    // Labour: 200 + 800 + 500 + 300 = 1800
    // Total: 575 + 1800 = 2375
    expect(cost).toBe(2375)
  })

  it("should return cost breakdown", () => {
    const breakdown = getCostBreakdown(mockBOMItems, mockLabourCosts)
    expect(breakdown.materialCost).toBe(575)
    expect(breakdown.labourCost).toBe(1800)
    expect(breakdown.totalCost).toBe(2375)
  })
})

