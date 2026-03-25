export function getBillableTotal(hourlyRate: number, workedHours: number): number {
  return hourlyRate * workedHours
}

export function getRemainingAmount(
  totalOrBillable: number,
  paidAmount: number,
): number {
  return Math.max(0, totalOrBillable - paidAmount)
}
