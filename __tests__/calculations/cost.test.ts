import { calculateBaseCostPrice, getCostBreakdown } from "@/lib/calculations/cost"

describe("Cost Calculations", () => {
  const mockBOMItems = [
    {
      inventory_item_id: "1",
      quantity: 3.5,
      weighted_avg_cost: 150,
    },
    {
      inventory_item_id: "2",
      quantity: 2.0,
      weighted_avg_cost: 25,
    },
  ]

  const mockLabourLines = [
    { labour_type: "cutting", rate: 200, qty: 1 },
    { labour_type: "embroidery", rate: 800, qty: 1 },
    { labour_type: "stitching", rate: 500, qty: 1 },
    { labour_type: "finishing", rate: 300, qty: 1 },
  ]

  it("should calculate base cost price correctly", () => {
    const cost = calculateBaseCostPrice(mockBOMItems, mockLabourLines)
    // Material: (3.5 * 150) + (2.0 * 25) = 525 + 50 = 575
    // Labour: 200 + 800 + 500 + 300 = 1800
    // Total: 575 + 1800 = 2375
    expect(cost).toBe(2375)
  })

  it("should return cost breakdown", () => {
    const breakdown = getCostBreakdown(mockBOMItems, mockLabourLines)
    expect(breakdown.materialCost).toBe(575)
    expect(breakdown.labourCost).toBe(1800)
    expect(breakdown.totalCost).toBe(2375)
  })
})

