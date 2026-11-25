import { ERROR_CODES } from "../constant/error";
import { LOW_STOCK_THRESHOLD, StockReason } from "../constant/stock";
import { AssignmentKey } from "../repo/assignment";
import { InventoryRepoInterface, LowStockRecord, MovementRecord, StockRecord } from "../repo/inventory";
import { withTransaction } from "../repo/transaction";
import { BadRequestException } from "../web/exception/bad-request-exception";
import { ConflictException } from "../web/exception/conflict-exception";
import { NotFoundException } from "../web/exception/not-found-exception";
import { UnprocessableEntityException } from "../web/exception/unprocessable-entity-exception";
import { MenuItemServiceInterface } from "./menu-item";
import { OutletServiceInterface } from "./outlet";
import { ListQuery, Page, toPage } from "./page";

export interface StockAdjustment {
    // Plus adds stock, minus removes it
    delta: number;
    reason: StockReason;
    note: string | null;
}

export interface InventoryServiceInterface {
    list(outletPublicId: string, query: ListQuery): Promise<Page<StockRecord>>;
    history(outletPublicId: string, itemPublicId: string, query: ListQuery): Promise<Page<MovementRecord>>;
    adjust(
        outletPublicId: string,
        itemPublicId: string,
        adjustment: StockAdjustment,
        userId: number
    ): Promise<MovementRecord>;
    lowStock(query: ListQuery): Promise<Page<LowStockRecord>>;
}

const RESTOCK_MUST_ADD = "A restock must add stock";
const WASTE_MUST_REMOVE = "Waste must remove stock";

const assertDirection = ({ reason, delta }: StockAdjustment): void => {
    if (reason === StockReason.RESTOCK && delta < 0) {
        throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, RESTOCK_MUST_ADD);
    }
    if (reason === StockReason.WASTE && delta > 0) {
        throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, WASTE_MUST_REMOVE);
    }
};

export class InventoryService implements InventoryServiceInterface {
    constructor(
        private repo: InventoryRepoInterface,
        private outletService: OutletServiceInterface,
        private menuItemService: MenuItemServiceInterface
    ) {}

    async list(outletPublicId: string, query: ListQuery): Promise<Page<StockRecord>> {
        const outlet = await this.outletService.getByPublicId(outletPublicId);
        return toPage(await this.repo.listByOutlet(outlet.id, query), query);
    }

    async history(outletPublicId: string, itemPublicId: string, query: ListQuery): Promise<Page<MovementRecord>> {
        const key = await this.stockKeyOf(outletPublicId, itemPublicId);
        return toPage(await this.repo.listMovements(key, query), query);
    }

    // The new quantity and its history row are saved together, or not at all
    async adjust(
        outletPublicId: string,
        itemPublicId: string,
        adjustment: StockAdjustment,
        userId: number
    ): Promise<MovementRecord> {
        assertDirection(adjustment);
        const key = await this.stockKeyOf(outletPublicId, itemPublicId);

        return withTransaction(async (transaction) => {
            const quantityAfter = await this.repo.changeQuantity(key, adjustment.delta, transaction);
            if (quantityAfter === null) {
                if (adjustment.delta > 0) {
                    throw new UnprocessableEntityException(ERROR_CODES.E_STOCK_ABOVE_LIMIT);
                }
                // Read in the same transaction: a second connection could leave none free under load
                const stock = await this.repo.findOne(key, transaction);
                throw new ConflictException(ERROR_CODES.E_INSUFFICIENT_STOCK, `Only ${stock?.quantity} in stock`);
            }
            return this.repo.addMovement({ ...key, ...adjustment, quantityAfter, userId }, transaction);
        });
    }

    async lowStock(query: ListQuery): Promise<Page<LowStockRecord>> {
        return toPage(await this.repo.listLowStock(LOW_STOCK_THRESHOLD, query), query);
    }

    // Stock exists only for items assigned to the outlet
    private async stockKeyOf(outletPublicId: string, itemPublicId: string): Promise<AssignmentKey> {
        const outlet = await this.outletService.getByPublicId(outletPublicId);
        const item = await this.menuItemService.getByPublicId(itemPublicId);
        const key = { outletId: outlet.id, menuItemId: item.id };
        if (!(await this.repo.findOne(key))) {
            throw new NotFoundException(ERROR_CODES.E_ITEM_NOT_ASSIGNED);
        }
        return key;
    }
}

export const newInventoryService = async (
    repo: InventoryRepoInterface,
    outletService: OutletServiceInterface,
    menuItemService: MenuItemServiceInterface
): Promise<InventoryService> => {
    return new InventoryService(repo, outletService, menuItemService);
};
