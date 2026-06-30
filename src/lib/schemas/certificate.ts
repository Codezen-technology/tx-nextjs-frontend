import { z } from "zod";

export const certificateOrderSchema = z.object({
  course_id: z.number().int().positive(),
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().max(30).optional().or(z.literal("")),
  address_line_1: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required"),
  postcode: z.string().min(2, "Postcode is required"),
  country: z.string().min(2, "Country is required"),
  delivery_notes: z.string().max(500).optional().or(z.literal("")),
  website: z.string().optional(),
});

export type CertificateOrderInput = z.infer<typeof certificateOrderSchema>;
