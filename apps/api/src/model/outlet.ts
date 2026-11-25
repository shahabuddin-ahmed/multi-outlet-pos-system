import { DataTypes, Model, Optional } from "sequelize";
import { OUTLET_LIMITS } from "../constant/catalog";
import newSequelize from "../infra/sequelize";

export interface OutletInterface {
    // Internal key: it never leaves the server
    id: number;
    // The id the API shows
    publicId: string;
    code: string;
    name: string;
    address: string | null;
    phone: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type OutletCreation = Optional<
    OutletInterface,
    "id" | "publicId" | "address" | "phone" | "isActive" | "createdAt" | "updatedAt"
>;

class Outlet extends Model<OutletInterface, OutletCreation> implements OutletInterface {
    declare id: number;
    declare publicId: string;
    declare code: string;
    declare name: string;
    declare address: string | null;
    declare phone: string | null;
    declare isActive: boolean;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

Outlet.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        publicId: { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4 },
        code: { type: new DataTypes.STRING(OUTLET_LIMITS.CODE_MAX), allowNull: false },
        name: { type: new DataTypes.STRING(OUTLET_LIMITS.NAME_MAX), allowNull: false },
        address: { type: new DataTypes.STRING(OUTLET_LIMITS.ADDRESS_MAX), allowNull: true },
        phone: { type: new DataTypes.STRING(OUTLET_LIMITS.PHONE_MAX), allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
    },
    {
        tableName: "outlets",
        freezeTableName: true,
        timestamps: true,
        // Columns are snake_case in the database (public_id), attributes are camelCase in code
        underscored: true,
        sequelize: newSequelize(),
        modelName: "outlet",
    }
);

export default Outlet;
