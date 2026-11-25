import { QueryTypes } from "sequelize";
import { UserRole } from "../constant/auth";
import newSequelize from "../infra/sequelize";
import User, { UserInterface } from "../model/user";

// A user together with their outlet: what login and every signed-in request need to know
export interface AccountRecord {
    id: number;
    publicId: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role: UserRole;
    isActive: boolean;
    // The outlet fields are all null for head office
    outletId: number | null;
    outletPublicId: string | null;
    outletCode: string | null;
    outletName: string | null;
    outletIsActive: boolean | null;
}

export type NewUser = Pick<UserInterface, "email" | "passwordHash" | "fullName" | "role" | "outletId">;

export interface UserRepoInterface {
    create(user: NewUser): Promise<UserInterface>;
    findByEmail(email: string): Promise<AccountRecord | null>;
    findByPublicId(publicId: string): Promise<AccountRecord | null>;
    updatePasswordHash(id: number, passwordHash: string): Promise<void>;
    deactivate(id: number): Promise<void>;
}

const SELECT_ACCOUNT = `
    SELECT u.id AS "id",
           u.public_id AS "publicId",
           u.email AS "email",
           u.password_hash AS "passwordHash",
           u.full_name AS "fullName",
           u.role AS "role",
           u.is_active AS "isActive",
           u.outlet_id AS "outletId",
           o.public_id AS "outletPublicId",
           o.code AS "outletCode",
           o.name AS "outletName",
           o.is_active AS "outletIsActive"
    FROM users u
    LEFT JOIN outlets o ON o.id = u.outlet_id`;

export class UserRepo implements UserRepoInterface {
    public async create(user: NewUser): Promise<UserInterface> {
        const created = await User.create(user);
        return created.get({ plain: true });
    }

    public async findByEmail(email: string): Promise<AccountRecord | null> {
        return this.findWhere("lower(u.email) = lower(:value)", email);
    }

    public async findByPublicId(publicId: string): Promise<AccountRecord | null> {
        return this.findWhere("u.public_id = :value", publicId);
    }

    public async updatePasswordHash(id: number, passwordHash: string): Promise<void> {
        await User.update({ passwordHash }, { where: { id } });
    }

    public async deactivate(id: number): Promise<void> {
        await User.update({ isActive: false }, { where: { id } });
    }

    // The condition is fixed text from this file; the value only goes through replacements
    private async findWhere(condition: string, value: string): Promise<AccountRecord | null> {
        const rows = await newSequelize().query<AccountRecord>(`${SELECT_ACCOUNT} WHERE ${condition}`, {
            replacements: { value },
            type: QueryTypes.SELECT,
        });
        return rows[0] ?? null;
    }
}

export const newUserRepo = async (): Promise<UserRepoInterface> => {
    return new UserRepo();
};
