import { AssignmentInput, AssignmentRecord, AssignmentRepoInterface } from "../repo/assignment";
import { withTransaction } from "../repo/transaction";
import { MenuItemServiceInterface } from "./menu-item";
import { OutletServiceInterface } from "./outlet";
import { ListQuery, Page, toPage } from "./page";

export interface SaveAssignmentResult {
    assignment: AssignmentRecord;
    // False when the item was already assigned and has only been changed
    created: boolean;
}

export interface AssignmentServiceInterface {
    save(outletPublicId: string, itemPublicId: string, input: AssignmentInput): Promise<SaveAssignmentResult>;
    list(outletPublicId: string, query: ListQuery): Promise<Page<AssignmentRecord>>;
    listMenu(outletPublicId: string, query: ListQuery): Promise<Page<AssignmentRecord>>;
}

export class AssignmentService implements AssignmentServiceInterface {
    constructor(
        private repo: AssignmentRepoInterface,
        private outletService: OutletServiceInterface,
        private menuItemService: MenuItemServiceInterface
    ) {}

    // Assign an item to an outlet, or change an existing assignment. Repeating it never adds a second row.
    async save(outletPublicId: string, itemPublicId: string, input: AssignmentInput): Promise<SaveAssignmentResult> {
        const outlet = await this.outletService.getByPublicId(outletPublicId);
        const item = await this.menuItemService.getByPublicId(itemPublicId);
        const key = { outletId: outlet.id, menuItemId: item.id };

        return withTransaction(async (transaction) => {
            const created = await this.repo.insertIfMissing(key, input, transaction);
            if (!created) {
                await this.repo.update(key, input, transaction);
            }
            await this.repo.ensureStockRow(key, transaction);

            const assignment = await this.repo.findOne(key, transaction);
            if (!assignment) {
                throw new Error("The saved assignment could not be read back");
            }
            return { assignment, created };
        });
    }

    // Everything assigned to the outlet, switched on or not (head office view)
    async list(outletPublicId: string, query: ListQuery): Promise<Page<AssignmentRecord>> {
        const outlet = await this.outletService.getByPublicId(outletPublicId);
        return toPage(await this.repo.listByOutlet(outlet.id, query), query);
    }

    // What the outlet can sell (till view)
    async listMenu(outletPublicId: string, query: ListQuery): Promise<Page<AssignmentRecord>> {
        const outlet = await this.outletService.getByPublicId(outletPublicId);
        return toPage(await this.repo.listSellable(outlet.id, query), query);
    }
}

export const newAssignmentService = async (
    repo: AssignmentRepoInterface,
    outletService: OutletServiceInterface,
    menuItemService: MenuItemServiceInterface
): Promise<AssignmentService> => {
    return new AssignmentService(repo, outletService, menuItemService);
};
