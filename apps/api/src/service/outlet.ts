import { ERROR_CODES } from "../constant/error";
import { OutletInterface } from "../model/outlet";
import { NewOutlet, OutletChanges, OutletRepoInterface } from "../repo/outlet";
import { withTransaction } from "../repo/transaction";
import { ConflictException } from "../web/exception/conflict-exception";
import { NotFoundException } from "../web/exception/not-found-exception";
import { ListQuery, Page, toPage } from "./page";

export interface OutletServiceInterface {
    create(outlet: NewOutlet): Promise<OutletInterface>;
    getByPublicId(publicId: string): Promise<OutletInterface>;
    list(query: ListQuery): Promise<Page<OutletInterface>>;
    update(publicId: string, changes: OutletChanges): Promise<OutletInterface>;
}

export class OutletService implements OutletServiceInterface {
    constructor(private repo: OutletRepoInterface) {}

    async create(outlet: NewOutlet): Promise<OutletInterface> {
        // A friendly message first; the unique constraint still stops two creates at the same moment
        if (await this.repo.findByCode(outlet.code)) {
            throw new ConflictException(ERROR_CODES.E_DUPLICATE_OUTLET_CODE);
        }
        // An outlet never exists without its receipt counter
        return withTransaction(async (transaction) => {
            const created = await this.repo.create(outlet, transaction);
            await this.repo.createReceiptCounter(created.id, transaction);
            return created;
        });
    }

    async getByPublicId(publicId: string): Promise<OutletInterface> {
        const outlet = await this.repo.findByPublicId(publicId);
        if (!outlet) {
            throw new NotFoundException(ERROR_CODES.E_OUTLET_NOT_FOUND);
        }
        return outlet;
    }

    async list(query: ListQuery): Promise<Page<OutletInterface>> {
        return toPage(await this.repo.list(query), query);
    }

    async update(publicId: string, changes: OutletChanges): Promise<OutletInterface> {
        const updated = await this.repo.update(publicId, changes);
        if (!updated) {
            throw new NotFoundException(ERROR_CODES.E_OUTLET_NOT_FOUND);
        }
        return updated;
    }
}

export const newOutletService = async (repo: OutletRepoInterface): Promise<OutletService> => {
    return new OutletService(repo);
};
