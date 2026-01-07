import { z } from "zod"

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  measurements: z.record(z.any()).optional(),
  notes: z.string().optional(),
})

export type CustomerInput = z.infer<typeof customerSchema>

