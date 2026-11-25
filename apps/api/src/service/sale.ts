import { Transaction } from "sequelize";
import { BusinessConfig } from "../config/config";
import { ERROR_CODES } from "../constant/error";
import { OrderType, PaymentMethod, SALE_LIMITS } from "../constant/sale";
import { OutletInterface } from "../model/outlet";
import { AssignmentRepoInterface } from "../repo/assignment";
import { InventoryRepoInterface } from "../repo/inventory";
import { NewSaleItem, SaleRecord, SaleRepoInterface, SaleSummaryRecord } from "../repo/sale";
import { Claim, ClaimKey, SaleClaimRepoInterface } from "../repo/sale-claim";
import { withDeadlockRetry } from "../repo/transaction";
import { BadRequestException } from "../web/exception/bad-request-exception";
import { ConflictException } from "../web/exception/conflict-exception";
import { ForbiddenException } from "../web/exception/forbidden-exception";
import { NotFoundException } from "../web/exception/not-found-exception";
import { UnprocessableEntityException } from "../web/exception/unprocessable-entity-exception";
import { AuthUser } from "./auth";
import { OutletServiceInterface } from "./outlet";
import { ListQuery, Page, toPage } from "./page";
import { priceOf } from "./pricing";
import {
    canViewSale,
    mergeLines,
    receiptSearchOf,
    requestHashOf,
    SaleInput,
    SaleLineInput,
    saleScopeOf,
    vatOf,
} from "./sale-rules";

export interface SaleResult {
    sale: SaleRecord;
    // True when this request had already been completed and the stored sale is returned
    replayed: boolean;
}

export interface SaleSearch {
    // Public id of one outlet; left out for all outlets
    outletId?: string;
    receipt?: string;
    from?: string;
    to?: string;
}

export interface SaleServiceInterface {
    create(outletPublicId: string, input: SaleInput, idempotencyKey: string, cashier: AuthUser): Promise<SaleResult>;
    getForViewer(outletPublicId: string, salePublicId: string, viewer: AuthUser): Promise<SaleRecord>;
    list(viewer: AuthUser, search: SaleSearch, query: ListQuery): Promise<Page<SaleSummaryRecord>>;
}

// A cart line with its internal item id and the price it is sold at
interface PricedLine extends NewSaleItem {
    publicId: string;
}

interface TakenStock {
    outletId: number;
    menuItemId: number;
    delta: number;
    quantityAfter: number;
}

const MESSAGES = {
    TABLE_ONLY_DINE_IN: "A table is only for dine-in orders",
    CASH_REQUIRED: "Enter the cash received",
    CASH_ONLY: "Cash received is only for cash payments",
    NO_CASH_REFERENCE: "A payment reference is not used for cash",
    TOO_MANY_OF_ONE: `At most ${SALE_LIMITS.QUANTITY_MAX} of one item in a sale`,
    DATES_REVERSED: "The start date is after the end date",
};

const invalid = (message: string) => new BadRequestException(ERROR_CODES.E_INVALID_DATA, message);

// Rules that join two fields of the request
const assertConsistent = ({ orderType, tableLabel, payment }: SaleInput): void => {
    if (tableLabel && orderType !== OrderType.DINE_IN) {
        throw invalid(MESSAGES.TABLE_ONLY_DINE_IN);
    }
    const isCash = payment.method === PaymentMethod.CASH;
    if (isCash && payment.cashReceivedCents === null) {
        throw invalid(MESSAGES.CASH_REQUIRED);
    }
    if (!isCash && payment.cashReceivedCents !== null) {
        throw invalid(MESSAGES.CASH_ONLY);
    }
    if (isCash && payment.reference) {
        throw invalid(MESSAGES.NO_CASH_REFERENCE);
    }
};

export class SaleService implements SaleServiceInterface {
    constructor(
        private repo: SaleRepoInterface,
        private claims: SaleClaimRepoInterface,
        private assignmentRepo: AssignmentRepoInterface,
        private inventoryRepo: InventoryRepoInterface,
        private outletService: OutletServiceInterface,
        private business: BusinessConfig
    ) {}

    // One transaction: stock, receipt number and sale are saved together, or nothing is.
    // Every query inside it uses that transaction, so a busy pool can never block itself.
    async create(
        outletPublicId: string,
        input: SaleInput,
        idempotencyKey: string,
        cashier: AuthUser
    ): Promise<SaleResult> {
        assertConsistent(input);
        const order = { ...input, items: mergeLines(input.items) };
        if (order.items.some((line) => line.quantity > SALE_LIMITS.QUANTITY_MAX)) {
            throw invalid(MESSAGES.TOO_MANY_OF_ONE);
        }
        const outlet = await this.outletService.getByPublicId(outletPublicId);
        const key = { outletId: outlet.id, idempotencyKey };
        const claim = { requestHash: requestHashOf(outlet.publicId, order), userId: cashier.id };

        return withDeadlockRetry(async (transaction) => {
            if (!(await this.claims.claim(key, claim, transaction))) {
                // Answered before any check of what can be sold now: this sale already happened
                return { sale: await this.replay(key, claim, transaction), replayed: true };
            }
            const saleId = await this.checkout(outlet, order, cashier, transaction);
            await this.claims.attachSale(key, saleId, transaction);
            return { sale: await this.savedSale(saleId, transaction), replayed: false };
        });
    }

    async getForViewer(outletPublicId: string, salePublicId: string, viewer: AuthUser): Promise<SaleRecord> {
        const outlet = await this.outletService.getByPublicId(outletPublicId);
        const sale = await this.repo.findByPublicId(salePublicId);
        if (!sale || sale.outletId !== outlet.id) {
            throw new NotFoundException(ERROR_CODES.E_SALE_NOT_FOUND);
        }
        if (!canViewSale(viewer, sale)) {
            throw new ForbiddenException(ERROR_CODES.E_FORBIDDEN);
        }
        return sale;
    }

    async list(viewer: AuthUser, search: SaleSearch, query: ListQuery): Promise<Page<SaleSummaryRecord>> {
        const { outletId, receipt, from, to } = search;
        if (from && to && from > to) {
            throw invalid(MESSAGES.DATES_REVERSED);
        }
        const outlet = outletId ? await this.outletService.getByPublicId(outletId) : null;
        const rows = await this.repo.list(
            {
                outletId: outlet?.id,
                ...saleScopeOf(viewer),
                ...(receipt ? receiptSearchOf(receipt) : {}),
                from,
                to,
                timezone: this.business.BUSINESS_TIMEZONE,
            },
            query
        );
        return toPage(rows, query);
    }

    private async replay(key: ClaimKey, claim: Omit<Claim, "saleId">, transaction: Transaction): Promise<SaleRecord> {
        const earlier = await this.claims.find(key, transaction);
        if (!earlier) {
            throw new Error("A taken retry key has no record");
        }
        if (earlier.userId !== claim.userId) {
            throw new ForbiddenException(ERROR_CODES.E_FORBIDDEN);
        }
        if (earlier.requestHash !== claim.requestHash) {
            throw new ConflictException(ERROR_CODES.E_IDEMPOTENCY_KEY_REUSED);
        }
        return this.savedSale(earlier.saleId, transaction);
    }

    private async checkout(
        outlet: OutletInterface,
        order: SaleInput,
        cashier: AuthUser,
        transaction: Transaction
    ): Promise<number> {
        if (!outlet.isActive) {
            throw new UnprocessableEntityException(ERROR_CODES.E_OUTLET_INACTIVE);
        }
        // Prices are read now, by the server; the client never sends them
        const lines = await this.priceLines(outlet.id, order.items, transaction);
        const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
        const vatBps = this.business.VAT_BPS;
        const vatCents = vatOf(subtotalCents, vatBps);
        const totalCents = subtotalCents + vatCents;

        if (totalCents !== order.expectedTotalCents) {
            // The cashier must confirm the new total with the customer first
            throw new ConflictException(ERROR_CODES.E_PRICE_CHANGED, undefined, undefined, {
                lines: lines.map(({ publicId, name, quantity, unitPriceCents, lineTotalCents }) => ({
                    menuItemId: publicId,
                    name,
                    quantity,
                    unitPriceCents,
                    lineTotalCents,
                })),
                subtotalCents,
                vatBps,
                vatCents,
                totalCents,
            });
        }
        const { method, cashReceivedCents, reference } = order.payment;
        if (cashReceivedCents !== null && cashReceivedCents < totalCents) {
            throw new UnprocessableEntityException(ERROR_CODES.E_TENDER_TOO_LOW);
        }

        const taken = await this.takeStock(outlet.id, lines, transaction);
        // Taken last: the counter is the one row every sale of the outlet waits for, so it is held briefly
        const receiptNo = await this.repo.nextReceiptNumber(outlet.id, transaction);
        const saleId = await this.repo.create(
            {
                outletId: outlet.id,
                userId: cashier.id,
                receiptNo,
                orderType: order.orderType,
                tableLabel: order.tableLabel,
                subtotalCents,
                vatBps,
                vatCents,
                totalCents,
                paymentMethod: method,
                tenderedCents: cashReceivedCents,
                paymentReference: reference,
                snapshot: {
                    companyName: this.business.COMPANY_NAME,
                    companyTaxNo: this.business.COMPANY_TAX_NO,
                    footer: this.business.RECEIPT_FOOTER,
                    currency: this.business.CURRENCY,
                    timezone: this.business.BUSINESS_TIMEZONE,
                    cashierName: cashier.fullName,
                    outlet: {
                        code: outlet.code,
                        name: outlet.name,
                        address: outlet.address,
                        phone: outlet.phone,
                    },
                },
            },
            transaction
        );
        await this.repo.addItems(saleId, outlet.id, lines, transaction);
        await this.inventoryRepo.addSaleMovements(
            taken.map((stock) => ({ ...stock, saleId, userId: cashier.id })),
            transaction
        );
        return saleId;
    }

    private async priceLines(
        outletId: number,
        items: SaleLineInput[],
        transaction: Transaction
    ): Promise<PricedLine[]> {
        const found = await this.assignmentRepo.findForSale(
            outletId,
            items.map((line) => line.menuItemId),
            transaction
        );
        const sources = new Map(found.map((source) => [source.publicId, source]));
        const refused = items
            .map(({ menuItemId }) => ({ menuItemId, source: sources.get(menuItemId) }))
            .filter(({ source }) => !source || !source.isAvailable || !source.itemIsActive);
        if (refused.length > 0) {
            throw new UnprocessableEntityException(ERROR_CODES.E_ITEM_NOT_SELLABLE, undefined, undefined, {
                items: refused.map(({ menuItemId, source }) => ({ menuItemId, name: source?.name ?? null })),
            });
        }

        return items.map(({ menuItemId, quantity }) => {
            const source = sources.get(menuItemId)!;
            const unitPriceCents = priceOf(source.basePriceCents, source.priceOverrideCents).effectivePriceCents;
            return {
                publicId: source.publicId,
                menuItemId: source.id,
                name: source.name,
                sku: source.sku,
                quantity,
                unitPriceCents,
                lineTotalCents: unitPriceCents * quantity,
            };
        });
    }

    // Every sale locks stock rows in the same order (internal item id), so two sales cannot wait for each other
    private async takeStock(outletId: number, lines: PricedLine[], transaction: Transaction): Promise<TakenStock[]> {
        const taken: TakenStock[] = [];
        const short: { menuItemId: string; name: string; requested: number; available: number }[] = [];

        for (const line of [...lines].sort((a, b) => a.menuItemId - b.menuItemId)) {
            const key = { outletId, menuItemId: line.menuItemId };
            const quantityAfter = await this.inventoryRepo.changeQuantity(key, -line.quantity, transaction);
            if (quantityAfter === null) {
                const stock = await this.inventoryRepo.findOne(key, transaction);
                short.push({
                    menuItemId: line.publicId,
                    name: line.name,
                    requested: line.quantity,
                    available: stock?.quantity ?? 0,
                });
            } else {
                taken.push({ ...key, delta: -line.quantity, quantityAfter });
            }
        }

        if (short.length > 0) {
            // Throwing rolls back what was already taken
            throw new ConflictException(
                ERROR_CODES.E_INSUFFICIENT_STOCK,
                undefined,
                short.map(({ name, available }) => `${name}: ${available} left`),
                { items: short }
            );
        }
        return taken;
    }

    private async savedSale(saleId: number, transaction: Transaction): Promise<SaleRecord> {
        const sale = await this.repo.findById(saleId, transaction);
        if (!sale) {
            throw new Error("The saved sale could not be read back");
        }
        return sale;
    }
}

export const newSaleService = async (
    repo: SaleRepoInterface,
    claims: SaleClaimRepoInterface,
    assignmentRepo: AssignmentRepoInterface,
    inventoryRepo: InventoryRepoInterface,
    outletService: OutletServiceInterface,
    business: BusinessConfig
): Promise<SaleService> => {
    return new SaleService(repo, claims, assignmentRepo, inventoryRepo, outletService, business);
};
