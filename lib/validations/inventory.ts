import { z } from "zod"

export const inventoryItemSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  uom: z.string().min(1, "UOM is required"),
  reorder_level: z.number().min(0).default(0),
  weighted_avg_cost: z.number().min(0).default(0),
  active: z.boolean().default(true),
})

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>

