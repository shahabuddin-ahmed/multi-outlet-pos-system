import { MenuItemInterface } from "../../model/menu-item";

export interface MenuItemDto {
    id: string;
    sku: string;
    name: string;
    basePriceCents: number;
    isActive: boolean;
    createdAt: Date;
}

export const toMenuItemDto = (item: MenuItemInterface): MenuItemDto => ({
    id: item.publicId,
    sku: item.sku,
    name: item.name,
    basePriceCents: item.basePriceCents,
    isActive: item.isActive,
    createdAt: item.createdAt,
});
