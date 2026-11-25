import { DataTypes, Model, Optional } from "sequelize";
import { USER_LIMITS, UserRole } from "../constant/auth";
import newSequelize from "../infra/sequelize";

export interface UserInterface {
    // Internal key: it never leaves the server
    id: number;
    // The id the API shows
    publicId: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role: UserRole;
    // NULL only for head office
    outletId: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type UserCreation = Optional<UserInterface, "id" | "publicId" | "isActive" | "createdAt" | "updatedAt">;

class User extends Model<UserInterface, UserCreation> implements UserInterface {
    declare id: number;
    declare publicId: string;
    declare email: string;
    declare passwordHash: string;
    declare fullName: string;
    declare role: UserRole;
    declare outletId: number | null;
    declare isActive: boolean;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

User.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        publicId: { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4 },
        email: { type: new DataTypes.STRING(USER_LIMITS.EMAIL_MAX), allowNull: false },
        passwordHash: { type: new DataTypes.STRING(200), allowNull: false },
        fullName: { type: new DataTypes.STRING(USER_LIMITS.NAME_MAX), allowNull: false },
        role: { type: new DataTypes.STRING(14), allowNull: false },
        outletId: { type: DataTypes.INTEGER, allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
    },
    {
        tableName: "users",
        freezeTableName: true,
        timestamps: true,
        underscored: true,
        sequelize: newSequelize(),
        modelName: "user",
    }
);

export default User;
