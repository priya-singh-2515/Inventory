import { z } from "zod";
import { GSTIN_REGEX, PINCODE_REGEX, HSN_SAC_REGEX } from "@/common/regex";
import { VALID_GST_RATES } from "@/lib/constants";

export const gstinSchema = z
  .string()
  .toUpperCase()
  .regex(GSTIN_REGEX, { message: "Invalid 15-character Indian GSTIN format" });

export const pincodeSchema = z
  .string()
  .regex(PINCODE_REGEX, { message: "Pincode must be a 6-digit number" });

export const hsnSacSchema = z
  .string()
  .regex(HSN_SAC_REGEX, { message: "HSN/SAC code must be 4, 6, or 8 digits" });

export const gstRateSchema = z
  .number()
  .refine((val) => VALID_GST_RATES.includes(val), {
    message: "Invalid GST tax rate percentage",
  });
