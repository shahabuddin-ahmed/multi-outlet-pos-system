import { PriceSource } from "../../constant/catalog";
import { priceOf } from "../pricing";

describe("priceOf", () => {
    it("follows the master price when the outlet has none", () => {
        expect(priceOf(35000, null)).toEqual({ effectivePriceCents: 35000, priceSource: PriceSource.BASE });
    });

    it("uses the outlet price when it is set", () => {
        expect(priceOf(35000, 40000)).toEqual({ effectivePriceCents: 40000, priceSource: PriceSource.OUTLET });
    });

    it("treats 0 as a real outlet price", () => {
        expect(priceOf(35000, 0)).toEqual({ effectivePriceCents: 0, priceSource: PriceSource.OUTLET });
    });
});
