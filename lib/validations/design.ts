import { z } from "zod"

export const designSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().optional(),
  size_range: z.string().optional(),
  status: z.enum(["draft", "ready"]).default("draft"),
  base_selling_price: z.number().min(0, "Price must be positive"),
  base_cost_price: z.number().min(0, "Cost must be positive").optional(),
  active: z.boolean().default(true),
  images: z.array(z.string().url()).optional(),
})

export const bomItemSchema = z.object({
  inventory_item_id: z.string().uuid(),
  quantity: z.number().positive("Quantity must be positive"),
  uom: z.string().min(1, "UOM is required"),
  wastage_pct: z.number().min(0).max(100).default(0),
  cost_override: z.number().min(0).optional().nullable(),
  sort_order: z.number().int().default(0),
})

export const designBOMSchema = z.object({
  design_id: z.string().uuid(),
  items: z.array(bomItemSchema),
})

export const labourLineSchema = z.object({
  labour_type: z.string().min(1, "Labour type is required"),
  rate: z.number().min(0, "Rate must be positive"),
  qty: z.number().positive("Quantity must be positive").default(1),
  notes: z.string().optional().nullable(),
  sort_order: z.number().int().default(0),
})

export const labourCostSchema = z.object({
  design_id: z.string().uuid(),
  cutting_cost: z.number().min(0).default(0),
  embroidery_type: z.enum(["hand", "machine", "computer"]).optional(),
  embroidery_cost: z.number().min(0).default(0),
  stitching_cost: z.number().min(0).default(0),
  finishing_cost: z.number().min(0).default(0),
})

export type DesignInput = z.infer<typeof designSchema>
export type BOMItemInput = z.infer<typeof bomItemSchema>
export type DesignBOMInput = z.infer<typeof designBOMSchema>
export type LabourLineInput = z.infer<typeof labourLineSchema>
export type LabourCostInput = z.infer<typeof labourCostSchema>

