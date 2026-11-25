import { parseArgs } from "util";
import Joi from "joi";
import { USER_LIMITS, UserCommand, UserRole } from "../constant/auth";
import initializeDBConnection from "../infra/db";
import newSequelize from "../infra/sequelize";
import { newOutletRepo } from "../repo/outlet";
import { newUserRepo } from "../repo/user";
import { newUserService, PasswordResult } from "../service/user";

// Staff accounts are managed from the command line; there is no screen for it.
// A password is never logged. A generated one is printed once.

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

const readInput = (command: UserCommand, args: string[]) => {
    const schema = SCHEMAS[command];
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
    return value;
};

const showPassword = ({ generatedPassword }: PasswordResult): void => {
    if (generatedPassword) {
        console.log(`Password (shown only once): ${generatedPassword}`);
    }
};

const run = async ([command, ...args]: string[]): Promise<void> => {
    try {
        const input = readInput(command as UserCommand, args);
        await initializeDBConnection();
        const userService = await newUserService(await newUserRepo(), await newOutletRepo());

        switch (command) {
            case UserCommand.CREATE: {
                const { name, role, password } = input;
                const result = await userService.create({
                    email: input.email,
                    fullName: name,
                    role,
                    outletCode: input["outlet-code"],
                    password,
                });
                console.log(`Created ${role} ${input.email}`);
                showPassword(result);
                break;
            }
            case UserCommand.SET_PASSWORD: {
                const result = await userService.setPassword(input.email, input.password);
                console.log(`Password changed for ${input.email}`);
                showPassword(result);
                break;
            }
            default: {
                await userService.deactivate(input.email);
                console.log(`Switched off ${input.email}`);
            }
        }
    } catch (err) {
        console.error(err instanceof Error ? err.message : err);
        process.exitCode = 1;
    } finally {
        await newSequelize().close();
    }
};

run(process.argv.slice(2));
