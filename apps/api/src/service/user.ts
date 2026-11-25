import { UserRole } from "../constant/auth";
import { ERROR_CODES } from "../constant/error";
import { OutletRepoInterface } from "../repo/outlet";
import { AccountRecord, UserRepoInterface } from "../repo/user";
import { generatePassword, hashPassword } from "../utils/password";
import { BadRequestException } from "../web/exception/bad-request-exception";
import { ConflictException } from "../web/exception/conflict-exception";
import { NotFoundException } from "../web/exception/not-found-exception";

export interface NewStaff {
    email: string;
    fullName: string;
    role: UserRole;
    outletCode?: string;
    // Left out: a random password is made
    password?: string;
}

export interface PasswordResult {
    // Set only when the password was generated here, so it can be shown once
    generatedPassword: string | null;
}

export interface UserServiceInterface {
    create(staff: NewStaff): Promise<PasswordResult>;
    setPassword(email: string, password?: string): Promise<PasswordResult>;
    deactivate(email: string): Promise<void>;
}

const OUTLET_NOT_ALLOWED = "An HQ admin does not belong to an outlet";
const OUTLET_REQUIRED = "A manager or cashier needs an outlet code";

export class UserService implements UserServiceInterface {
    constructor(
        private repo: UserRepoInterface,
        private outletRepo: OutletRepoInterface
    ) {}

    async create({ email, fullName, role, outletCode, password }: NewStaff): Promise<PasswordResult> {
        const outletId = await this.outletIdFor(role, outletCode);
        if (await this.repo.findByEmail(email)) {
            throw new ConflictException(ERROR_CODES.E_DUPLICATE_EMAIL);
        }
        const secret = password ?? generatePassword();
        await this.repo.create({
            email: email.toLowerCase(),
            fullName,
            role,
            outletId,
            passwordHash: await hashPassword(secret),
        });
        return { generatedPassword: password ? null : secret };
    }

    async setPassword(email: string, password?: string): Promise<PasswordResult> {
        const account = await this.accountOf(email);
        const secret = password ?? generatePassword();
        await this.repo.updatePasswordHash(account.id, await hashPassword(secret));
        return { generatedPassword: password ? null : secret };
    }

    async deactivate(email: string): Promise<void> {
        const account = await this.accountOf(email);
        await this.repo.deactivate(account.id);
    }

    private async accountOf(email: string): Promise<AccountRecord> {
        const account = await this.repo.findByEmail(email);
        if (!account) {
            throw new NotFoundException(ERROR_CODES.E_USER_NOT_FOUND);
        }
        return account;
    }

    // Head office has no outlet; managers and cashiers belong to exactly one
    private async outletIdFor(role: UserRole, outletCode?: string): Promise<number | null> {
        if (role === UserRole.HQ_ADMIN) {
            if (outletCode) {
                throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, OUTLET_NOT_ALLOWED);
            }
            return null;
        }
        if (!outletCode) {
            throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, OUTLET_REQUIRED);
        }
        const outlet = await this.outletRepo.findByCode(outletCode);
        if (!outlet) {
            throw new NotFoundException(ERROR_CODES.E_OUTLET_NOT_FOUND);
        }
        return outlet.id;
    }
}

export const newUserService = async (
    repo: UserRepoInterface,
    outletRepo: OutletRepoInterface
): Promise<UserService> => {
    return new UserService(repo, outletRepo);
};
