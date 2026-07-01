import { DiscountType } from "@prisma/client";

export function computeFinalPriceInr(priceInr: number, discountType: DiscountType, discountValue: number) {
  if (discountType === DiscountType.PERCENTAGE) {
    return Math.max(0, Math.round(priceInr * (1 - discountValue / 100)));
  }
  if (discountType === DiscountType.FIXED) {
    return Math.max(0, priceInr - discountValue);
  }
  return priceInr;
}

export function withFinalPrice<T extends { priceInr: number; discountType: DiscountType; discountValue: number }>(plan: T) {
  return { ...plan, finalPriceInr: computeFinalPriceInr(plan.priceInr, plan.discountType, plan.discountValue) };
}
