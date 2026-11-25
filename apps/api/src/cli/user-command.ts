import { parseArgs } from "util";
import Joi from "joi";
import { USER_LIMITS, UserCommand, UserRole } from "../constant/auth";
import { PasswordResult, UserServiceInterface } from "../service/user";

// What the staff command accepts and does. user.ts connects it to the database and the screen.

export interface UserCommandInput {
    command: UserCommand;
    email: string;
    name?: string;
    role?: UserRole;
    "outlet-code"?: string;
    password?: string;
}

const email = Joi.string().trim().lowercase().max(USER_LIMITS.EMAIL_MAX).email({ tlds: false }).required();
const password = Joi.string().min(USER_LIMITS.PASSWORD_MIN).max(USER_LIMITS.PASSWORD_MAX);

const SCHEMAS: Record<UserCommand, Joi.ObjectSchema> = {
    [UserCommand.CREATE]: Joi.object({
        email,
        name: Joi.string().trim().min(1).max(USER_LIMITS.NAME_MAX).required(),
        role: Joi.string()
            .valid(...Object.values(UserRole))
            .required(),
        "outlet-code": Joi.string().trim().uppercase(),
        password,
    }),
    [UserCommand.SET_PASSWORD]: Joi.object({ email, password }),
    [UserCommand.DEACTIVATE]: Joi.object({ email }),
};

// Checked before the database is touched
export const readUserCommand = ([command, ...args]: string[]): UserCommandInput => {
    const schema = SCHEMAS[command as UserCommand];
    if (!schema) {
        throw new Error(`Unknown command "${command}". Use: ${Object.values(UserCommand).join(", ")}`);
    }
    const { values } = parseArgs({
        args,
        options: {
            email: { type: "string" },
            name: { type: "string" },
            role: { type: "string" },
            "outlet-code": { type: "string" },
            password: { type: "string" },
        },
    });
    const { value, error } = schema.validate({ ...values }, { abortEarly: false });
    if (error) {
        throw new Error(error.details.map((detail) => detail.message).join("; "));
    }
    return { ...value, command: command as UserCommand };
};

const passwordLines = ({ generatedPassword }: PasswordResult): string[] =>
    generatedPassword ? [`Password (shown only once): ${generatedPassword}`] : [];

// Returns the lines to print
export const runUserCommand = async (input: UserCommandInput, users: UserServiceInterface): Promise<string[]> => {
    switch (input.command) {
        case UserCommand.CREATE: {
            const result = await users.create({
                email: input.email,
                fullName: input.name!,
                role: input.role!,
                outletCode: input["outlet-code"],
                password: input.password,
            });
            return [`Created ${input.role} ${input.email}`, ...passwordLines(result)];
        }
        case UserCommand.SET_PASSWORD: {
            const result = await users.setPassword(input.email, input.password);
            return [`Password changed for ${input.email}. Earlier logins have ended.`, ...passwordLines(result)];
        }
        case UserCommand.DEACTIVATE: {
            await users.deactivate(input.email);
            return [`Switched off ${input.email}`];
        }
    }
};
