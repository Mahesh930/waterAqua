/**
 * Estimate delivery time based on pincode distance.
 * Uses a simple heuristic: first 3 digits = region, if same region → nearby.
 */
export function estimateDeliveryTime(
  supplierPincode: string | null,
  customerPincode: string
): { minutes: number; label: string; distanceKm: number } {
  if (!supplierPincode || !customerPincode) {
    return { minutes: 45, label: "30-45 min", distanceKm: 8.5 };
  }

  const sPrefix = supplierPincode.slice(0, 3);
  const cPrefix = customerPincode.slice(0, 3);

  if (supplierPincode === customerPincode) {
    // Same pincode — very close
    return { minutes: 20, label: "15-20 min", distanceKm: 1.2 };
  }

  if (sPrefix === cPrefix) {
    // Same region (first 3 digits match)
    return { minutes: 35, label: "25-35 min", distanceKm: 3.8 };
  }

  const s2 = supplierPincode.slice(0, 2);
  const c2 = customerPincode.slice(0, 2);

  if (s2 === c2) {
    // Same district area
    return { minutes: 50, label: "40-50 min", distanceKm: 7.5 };
  }

  // Different area
  return { minutes: 75, label: "60-90 min", distanceKm: 15.0 };
}
