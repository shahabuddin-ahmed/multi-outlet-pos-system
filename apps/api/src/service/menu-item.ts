import { ERROR_CODES } from "../constant/error";
import { MenuItemInterface } from "../model/menu-item";
import { MenuItemChanges, MenuItemRepoInterface, NewMenuItem } from "../repo/menu-item";
import { ConflictException } from "../web/exception/conflict-exception";
import { NotFoundException } from "../web/exception/not-found-exception";
import { ListQuery, Page, toPage } from "./page";

export interface MenuItemServiceInterface {
    create(item: NewMenuItem): Promise<MenuItemInterface>;
    getByPublicId(publicId: string): Promise<MenuItemInterface>;
    list(query: ListQuery): Promise<Page<MenuItemInterface>>;
    update(publicId: string, changes: MenuItemChanges): Promise<MenuItemInterface>;
}

export class MenuItemService implements MenuItemServiceInterface {
    constructor(private repo: MenuItemRepoInterface) {}

    async create(item: NewMenuItem): Promise<MenuItemInterface> {
        // A friendly message first; the unique index still stops two creates at the same moment
        if (await this.repo.findBySku(item.sku)) {
            throw new ConflictException(ERROR_CODES.E_DUPLICATE_SKU);
        }
        return this.repo.create(item);
    }

    async getByPublicId(publicId: string): Promise<MenuItemInterface> {
        const item = await this.repo.findByPublicId(publicId);
        if (!item) {
            throw new NotFoundException(ERROR_CODES.E_MENU_ITEM_NOT_FOUND);
        }
        return item;
    }

    async list(query: ListQuery): Promise<Page<MenuItemInterface>> {
        return toPage(await this.repo.list(query), query);
    }

    async update(publicId: string, changes: MenuItemChanges): Promise<MenuItemInterface> {
        const updated = await this.repo.update(publicId, changes);
        if (!updated) {
            throw new NotFoundException(ERROR_CODES.E_MENU_ITEM_NOT_FOUND);
        }
        return updated;
    }
}

export const newMenuItemService = async (repo: MenuItemRepoInterface): Promise<MenuItemService> => {
    return new MenuItemService(repo);
};
