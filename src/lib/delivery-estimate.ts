/**
 * Estimate delivery time based on pincode distance.
 * Uses a simple heuristic: first 3 digits = region, if same region → nearby.
 */
export function estimateDeliveryTime(
  supplierPincode: string | null,
  customerPincode: string
): { minutes: number; label: string } {
  if (!supplierPincode || !customerPincode) {
    return { minutes: 45, label: "30-45 min" };
  }

  const sPrefix = supplierPincode.slice(0, 3);
  const cPrefix = customerPincode.slice(0, 3);

  if (supplierPincode === customerPincode) {
    // Same pincode — very close
    return { minutes: 20, label: "15-20 min" };
  }

  if (sPrefix === cPrefix) {
    // Same region (first 3 digits match)
    return { minutes: 35, label: "25-35 min" };
  }

  const s2 = supplierPincode.slice(0, 2);
  const c2 = customerPincode.slice(0, 2);

  if (s2 === c2) {
    // Same district area
    return { minutes: 50, label: "40-50 min" };
  }

  // Different area
  return { minutes: 75, label: "60-90 min" };
}
