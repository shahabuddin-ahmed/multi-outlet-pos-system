import jwt, { SignOptions } from "jsonwebtoken";
import { AuthConfig } from "../config/config";
import { UUID_PATTERN } from "../constant/api";
import { TOKEN_ALGORITHM, UserRole } from "../constant/auth";
import { ERROR_CODES } from "../constant/error";
import { AccountRecord, UserRepoInterface } from "../repo/user";
import { generatePassword, hashPassword, verifyPassword } from "../utils/password";
import { ForbiddenException } from "../web/exception/forbidden-exception";
import { UnauthorizedException } from "../web/exception/unauthorized-exception";

export interface AuthOutlet {
    id: number;
    publicId: string;
    code: string;
    name: string;
    isActive: boolean;
}

// The signed-in user of a request
export interface AuthUser {
    id: number;
    publicId: string;
    email: string;
    fullName: string;
    role: UserRole;
    // null for head office
    outlet: AuthOutlet | null;
}

export interface Session {
    token: string;
    user: AuthUser;
}

export interface AuthServiceInterface {
    login(email: string, password: string): Promise<Session>;
    authenticate(token: string): Promise<AuthUser>;
}

export class AuthService implements AuthServiceInterface {
    // Checked when the email is unknown, so that answer takes as long as a wrong password
    private decoyHash?: Promise<string>;

    constructor(
        private repo: UserRepoInterface,
        private settings: AuthConfig
    ) {}

    async login(email: string, password: string): Promise<Session> {
        const account = await this.repo.findByEmail(email);
        const matches = await verifyPassword(password, account?.passwordHash ?? (await this.decoy()));
        // One answer for every failure, so nobody can find out which emails exist
        if (!account || !matches || !account.isActive) {
            throw new UnauthorizedException(ERROR_CODES.E_INVALID_CREDENTIALS);
        }
        const user = this.toAuthUser(account);
        if (user.outlet && !user.outlet.isActive) {
            throw new ForbiddenException(ERROR_CODES.E_OUTLET_INACTIVE);
        }
        return { token: this.sign(account), user };
    }

    // The token only says who the user is and which password it was made after. Role and active state are
    // read again on every request, so switching someone off or changing a password works at once.
    async authenticate(token: string): Promise<AuthUser> {
        const { subject, version } = this.claimsOf(token);
        const account = await this.repo.findByPublicId(subject);
        if (!account || !account.isActive || account.tokenVersion !== version) {
            throw new UnauthorizedException(ERROR_CODES.E_UNAUTHENTICATED);
        }
        return this.toAuthUser(account);
    }

    private decoy(): Promise<string> {
        this.decoyHash ??= hashPassword(generatePassword());
        return this.decoyHash;
    }

    private sign({ publicId, tokenVersion }: AccountRecord): string {
        return jwt.sign({ ver: tokenVersion }, this.settings.JWT_SECRET, {
            algorithm: TOKEN_ALGORITHM,
            subject: publicId,
            expiresIn: this.settings.JWT_EXPIRES_IN as SignOptions["expiresIn"],
        });
    }

    private claimsOf(token: string): { subject: string; version: number } {
        try {
            const payload = jwt.verify(token, this.settings.JWT_SECRET, { algorithms: [TOKEN_ALGORITHM] });
            if (typeof payload !== "string" && payload.sub && UUID_PATTERN.test(payload.sub)) {
                return { subject: payload.sub, version: payload.ver };
            }
        } catch {
            // Bad signature, expired or not a token at all: all answered the same way below
        }
        throw new UnauthorizedException(ERROR_CODES.E_UNAUTHENTICATED);
    }

    private toAuthUser(account: AccountRecord): AuthUser {
        const { id, publicId, email, fullName, role, outletId, outletPublicId, outletCode, outletName } = account;
        const outlet =
            outletId === null
                ? null
                : {
                      id: outletId,
                      publicId: outletPublicId!,
                      code: outletCode!,
                      name: outletName!,
                      isActive: account.outletIsActive === true,
                  };
        return { id, publicId, email, fullName, role, outlet };
    }
}

export const newAuthService = async (repo: UserRepoInterface, settings: AuthConfig): Promise<AuthService> => {
    return new AuthService(repo, settings);
};
