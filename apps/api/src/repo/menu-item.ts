import { col, fn, Op, where as sqlWhere, WhereOptions } from "sequelize";
import MenuItem, { MenuItemInterface } from "../model/menu-item";
import { ListQuery, Rows } from "../service/page";
import { containsPattern } from "../utils/utility";

export type NewMenuItem = Pick<MenuItemInterface, "sku" | "name" | "basePriceCents" | "isActive">;
// The SKU is not here: it identifies the item on receipts, so it never changes
export type MenuItemChanges = Partial<Pick<MenuItemInterface, "name" | "basePriceCents" | "isActive">>;

export interface MenuItemRepoInterface {
    create(item: NewMenuItem): Promise<MenuItemInterface>;
    findByPublicId(publicId: string): Promise<MenuItemInterface | null>;
    findBySku(sku: string): Promise<MenuItemInterface | null>;
    list(query: ListQuery): Promise<Rows<MenuItemInterface>>;
    update(publicId: string, changes: MenuItemChanges): Promise<MenuItemInterface | null>;
}

export class MenuItemRepo implements MenuItemRepoInterface {
    public async create(item: NewMenuItem): Promise<MenuItemInterface> {
        const created = await MenuItem.create(item);
        return created.get({ plain: true });
    }

    public async findByPublicId(publicId: string): Promise<MenuItemInterface | null> {
        const item = await MenuItem.findOne({ where: { publicId } });
        return item ? item.get({ plain: true }) : null;
    }

    // Ignores upper and lower case, like the unique index on lower(sku)
    public async findBySku(sku: string): Promise<MenuItemInterface | null> {
        const item = await MenuItem.findOne({ where: sqlWhere(fn("lower", col("sku")), sku.toLowerCase()) });
        return item ? item.get({ plain: true }) : null;
    }

    public async list({ search, offset, limit }: ListQuery): Promise<Rows<MenuItemInterface>> {
        const where: WhereOptions<MenuItemInterface> = search
            ? {
                  [Op.or]: [
                      { sku: { [Op.iLike]: containsPattern(search) } },
                      { name: { [Op.iLike]: containsPattern(search) } },
                  ],
              }
            : {};
        const { rows, count } = await MenuItem.findAndCountAll({
            where,
            offset,
            limit,
            // id breaks ties, so pages never repeat or skip rows
            order: [
                ["name", "ASC"],
                ["id", "ASC"],
            ],
        });
        return { rows: rows.map((item) => item.get({ plain: true })), total: count };
    }

    public async update(publicId: string, changes: MenuItemChanges): Promise<MenuItemInterface | null> {
        const item = await MenuItem.findOne({ where: { publicId } });
        if (!item) {
            return null;
        }
        const updated = await item.update(changes);
        return updated.get({ plain: true });
    }
}

export const newMenuItemRepo = async (): Promise<MenuItemRepoInterface> => {
    return new MenuItemRepo();
};
