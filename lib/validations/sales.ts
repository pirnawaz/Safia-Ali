import { z } from "zod"

export const salesOrderItemSchema = z.object({
  design_id: z.string().uuid(),
  quantity: z.number().int().positive("Quantity must be positive"),
  size: z.string().optional(),
  measurements: z.record(z.any()).optional(),
  custom_notes: z.string().optional(),
  base_price: z.number().min(0),
  customisation_delta: z.number().default(0),
  discount: z.number().min(0).default(0),
  tax_rate: z.number().min(0).max(100).default(0),
  delivery_date_estimate: z.string().optional(),
  requires_job_card: z.boolean().default(false),
})

export const salesOrderSchema = z.object({
  customer_id: z.string().uuid().optional(),
  items: z.array(salesOrderItemSchema).min(1, "At least one item is required"),
})

export const paymentSchema = z.object({
  sales_order_id: z.string().uuid(),
  amount: z.number().positive("Amount must be positive"),
  method: z.enum(["cash", "card", "bank_transfer"]),
  reference: z.string().optional(),
})

export type SalesOrderInput = z.infer<typeof salesOrderSchema>
export type SalesOrderItemInput = z.infer<typeof salesOrderItemSchema>
export type PaymentInput = z.infer<typeof paymentSchema>

