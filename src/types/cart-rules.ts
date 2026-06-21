export interface BulkTier {
  /** Minimum line-item quantity for this tier. */
  min: number;
  /** Maximum quantity; 0 = open-ended. */
  max: number;
  /** Discount percentage (0–100). */
  percentage: number;
}
