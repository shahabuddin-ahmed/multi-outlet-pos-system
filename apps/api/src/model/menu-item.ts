import { DataTypes, Model, Optional } from "sequelize";
import { MENU_ITEM_LIMITS } from "../constant/catalog";
import newSequelize from "../infra/sequelize";

export interface MenuItemInterface {
    // Internal key: it never leaves the server
    id: number;
    // The id the API shows
    publicId: string;
    sku: string;
    name: string;
    basePriceCents: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type MenuItemCreation = Optional<MenuItemInterface, "id" | "publicId" | "isActive" | "createdAt" | "updatedAt">;

class MenuItem extends Model<MenuItemInterface, MenuItemCreation> implements MenuItemInterface {
    declare id: number;
    declare publicId: string;
    declare sku: string;
    declare name: string;
    declare basePriceCents: number;
    declare isActive: boolean;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

MenuItem.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        publicId: { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4 },
        sku: { type: new DataTypes.STRING(MENU_ITEM_LIMITS.SKU_MAX), allowNull: false },
        name: { type: new DataTypes.STRING(MENU_ITEM_LIMITS.NAME_MAX), allowNull: false },
        basePriceCents: { type: DataTypes.INTEGER, allowNull: false },
        isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
    },
    {
        tableName: "menu_items",
        freezeTableName: true,
        timestamps: true,
        underscored: true,
        sequelize: newSequelize(),
        modelName: "menuItem",
    }
);

export default MenuItem;
