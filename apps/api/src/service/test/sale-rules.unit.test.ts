import { UserRole } from "../../constant/auth";
import { OrderType, PaymentMethod } from "../../constant/sale";
import { AuthUser } from "../auth";
import { canViewSale, mergeLines, receiptSearchOf, requestHashOf, SaleInput, vatOf } from "../sale-rules";

describe("vatOf", () => {
    it("rounds half up to whole minor units", () => {
        expect(vatOf(113000, 500)).toBe(5650);
        // 0.45 and 0.5
        expect(vatOf(9, 500)).toBe(0);
        expect(vatOf(10, 500)).toBe(1);
        expect(vatOf(333, 750)).toBe(25);
        expect(vatOf(113000, 0)).toBe(0);
    });
});

describe("mergeLines", () => {
    it("joins repeated items and keeps the order they were added in", () => {
        const lines = [
            { menuItemId: "B", quantity: 1 },
            { menuItemId: "a", quantity: 2 },
            { menuItemId: "b", quantity: 3 },
        ];

        expect(mergeLines(lines)).toEqual([
            { menuItemId: "b", quantity: 4 },
            { menuItemId: "a", quantity: 2 },
        ]);
    });
});

describe("requestHashOf", () => {
    const sale: SaleInput = {
        orderType: OrderType.DINE_IN,
        tableLabel: "T4",
        payment: { method: PaymentMethod.CARD, cashReceivedCents: null, reference: "1111" },
        expectedTotalCents: 1050,
        items: [
            { menuItemId: "a", quantity: 1 },
            { menuItemId: "b", quantity: 2 },
        ],
    };
    const hash = requestHashOf("outlet", sale);

    it("ignores the order of the lines", () => {
        expect(requestHashOf("outlet", { ...sale, items: [...sale.items].reverse() })).toBe(hash);
    });

    it("changes with anything the client decided", () => {
        const others: SaleInput[] = [
            { ...sale, orderType: OrderType.TAKEAWAY },
            { ...sale, tableLabel: "T5" },
            { ...sale, payment: { ...sale.payment, method: PaymentMethod.MOBILE_BANKING } },
            { ...sale, payment: { ...sale.payment, reference: "2222" } },
            { ...sale, expectedTotalCents: 1051 },
            { ...sale, items: [{ menuItemId: "a", quantity: 1 }] },
        ];

        for (const other of others) {
            expect(requestHashOf("outlet", other)).not.toBe(hash);
        }
        expect(requestHashOf("another-outlet", sale)).not.toBe(hash);
    });
});

describe("canViewSale", () => {
    const user = (role: UserRole, id: number, outletId: number | null): AuthUser => ({
        id,
        publicId: "",
        email: "",
        fullName: "",
        role,
        outlet: outletId === null ? null : { id: outletId, publicId: "", code: "", name: "", isActive: true },
    });
    const sale = { outletId: 1, userId: 10 };

    it("lets head office see all, a manager the own outlet and a cashier only own sales", () => {
        expect(canViewSale(user(UserRole.HQ_ADMIN, 1, null), sale)).toBe(true);
        expect(canViewSale(user(UserRole.OUTLET_MANAGER, 2, 1), sale)).toBe(true);
        expect(canViewSale(user(UserRole.OUTLET_MANAGER, 2, 2), sale)).toBe(false);
        expect(canViewSale(user(UserRole.CASHIER, 10, 1), sale)).toBe(true);
        expect(canViewSale(user(UserRole.CASHIER, 11, 1), sale)).toBe(false);
        expect(canViewSale(user(UserRole.CASHIER, 10, 2), sale)).toBe(false);
    });
});

describe("receiptSearchOf", () => {
    it("reads a full receipt code or only the number", () => {
        expect(receiptSearchOf("dhk-000042")).toEqual({ outletCode: "DHK", receiptNo: 42 });
        expect(receiptSearchOf("42")).toEqual({ outletCode: undefined, receiptNo: 42 });
    });
});
