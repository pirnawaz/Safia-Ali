import {
  calculateWeightedAverage,
  updateWeightedAverageAfterGRN,
} from "@/lib/inventory/weighted-average"

describe("Weighted Average Calculations", () => {
  it("should calculate weighted average correctly", () => {
    const avg = calculateWeightedAverage(100, 10, 50, 15)
    // (100 * 10 + 50 * 15) / (100 + 50) = (1000 + 750) / 150 = 11.67
    expect(avg).toBeCloseTo(11.67, 2)
  })

  it("should update weighted average after GRN", () => {
    const newAvg = updateWeightedAverageAfterGRN(100, 10, 50, 15)
    expect(newAvg).toBeCloseTo(11.67, 2)
  })

  it("should handle zero quantities", () => {
    const avg = calculateWeightedAverage(0, 0, 0, 0)
    expect(avg).toBe(0)
  })
})

