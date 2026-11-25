import { PriceSource } from "../constant/catalog";

export interface EffectivePrice {
    effectivePriceCents: number;
    priceSource: PriceSource;
}

// The one price rule: the outlet price when it is set (0 included), otherwise the current master price
export const priceOf = (basePriceCents: number, priceOverrideCents: number | null): EffectivePrice =>
    priceOverrideCents === null
        ? { effectivePriceCents: basePriceCents, priceSource: PriceSource.BASE }
        : { effectivePriceCents: priceOverrideCents, priceSource: PriceSource.OUTLET };
