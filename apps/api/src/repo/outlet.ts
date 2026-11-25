import { Op, Transaction, WhereOptions } from "sequelize";
import newSequelize from "../infra/sequelize";
import Outlet, { OutletInterface } from "../model/outlet";
import { ListQuery, Rows } from "../service/page";
import { containsPattern } from "../utils/utility";

export type NewOutlet = Pick<OutletInterface, "code" | "name" | "address" | "phone" | "isActive">;
// The code is not here: it is printed on receipts, so it never changes
export type OutletChanges = Partial<Pick<OutletInterface, "name" | "address" | "phone" | "isActive">>;

export interface OutletRepoInterface {
    create(outlet: NewOutlet, transaction: Transaction): Promise<OutletInterface>;
    createReceiptCounter(outletId: number, transaction: Transaction): Promise<void>;
    findByPublicId(publicId: string): Promise<OutletInterface | null>;
    findByCode(code: string): Promise<OutletInterface | null>;
    list(query: ListQuery): Promise<Rows<OutletInterface>>;
    update(publicId: string, changes: OutletChanges): Promise<OutletInterface | null>;
}

export class OutletRepo implements OutletRepoInterface {
    public async create(outlet: NewOutlet, transaction: Transaction): Promise<OutletInterface> {
        const created = await Outlet.create(outlet, { transaction });
        return created.get({ plain: true });
    }

    public async createReceiptCounter(outletId: number, transaction: Transaction): Promise<void> {
        await newSequelize().query("INSERT INTO outlet_receipt_counters (outlet_id) VALUES (:outletId)", {
            replacements: { outletId },
            transaction,
        });
    }

    public async findByPublicId(publicId: string): Promise<OutletInterface | null> {
        const outlet = await Outlet.findOne({ where: { publicId } });
        return outlet ? outlet.get({ plain: true }) : null;
    }

    public async findByCode(code: string): Promise<OutletInterface | null> {
        const outlet = await Outlet.findOne({ where: { code } });
        return outlet ? outlet.get({ plain: true }) : null;
    }

    public async list({ search, offset, limit }: ListQuery): Promise<Rows<OutletInterface>> {
        const where: WhereOptions<OutletInterface> = search
            ? {
                  [Op.or]: [
                      { code: { [Op.iLike]: containsPattern(search) } },
                      { name: { [Op.iLike]: containsPattern(search) } },
                  ],
              }
            : {};
        const { rows, count } = await Outlet.findAndCountAll({ where, offset, limit, order: [["code", "ASC"]] });
        return { rows: rows.map((outlet) => outlet.get({ plain: true })), total: count };
    }

    public async update(publicId: string, changes: OutletChanges): Promise<OutletInterface | null> {
        const outlet = await Outlet.findOne({ where: { publicId } });
        if (!outlet) {
            return null;
        }
        const updated = await outlet.update(changes);
        return updated.get({ plain: true });
    }
}

export const newOutletRepo = async (): Promise<OutletRepoInterface> => {
    return new OutletRepo();
};
