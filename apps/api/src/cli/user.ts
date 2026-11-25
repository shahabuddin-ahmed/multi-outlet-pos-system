import initializeDBConnection from "../infra/db";
import newSequelize from "../infra/sequelize";
import { newOutletRepo } from "../repo/outlet";
import { newUserRepo } from "../repo/user";
import { newUserService } from "../service/user";
import { readUserCommand, runUserCommand } from "./user-command";

// Staff accounts are managed from the command line; there is no screen for it.
// A password is never logged. A generated one is printed once.

const run = async (args: string[]): Promise<void> => {
    try {
        const input = readUserCommand(args);
        await initializeDBConnection();
        const userService = await newUserService(await newUserRepo(), await newOutletRepo());
        for (const line of await runUserCommand(input, userService)) {
            console.log(line);
        }
    } catch (err) {
        console.error(err instanceof Error ? err.message : err);
        process.exitCode = 1;
    } finally {
        await newSequelize().close();
    }
};

run(process.argv.slice(2));
