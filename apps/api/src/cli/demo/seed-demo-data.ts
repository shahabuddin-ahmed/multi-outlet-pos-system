import { randomUUID } from "crypto";
import config from "../../config/config";
import { OrderType, PaymentMethod } from "../../constant/sale";
import { StockReason } from "../../constant/stock";
import newSequelize from "../../infra/sequelize";
import { AssignmentRepo } from "../../repo/assignment";
import { InventoryRepo } from "../../repo/inventory";
import { MenuItemRepo } from "../../repo/menu-item";
import { OutletRepo } from "../../repo/outlet";
import { SaleRepo } from "../../repo/sale";
import { SaleClaimRepo } from "../../repo/sale-claim";
import { UserRepo } from "../../repo/user";
import { AssignmentService } from "../../service/assignment";
import { AuthService, AuthUser } from "../../service/auth";
import { InventoryService } from "../../service/inventory";
import { MenuItemService } from "../../service/menu-item";
import { OutletService } from "../../service/outlet";
import { priceOf } from "../../service/pricing";
import { SaleService } from "../../service/sale";
import { SaleInput, vatOf } from "../../service/sale-rules";
import { UserService } from "../../service/user";
import {
    DEMO_ADMIN,
    DEMO_FINAL_STOCK,
    DEMO_HISTORY,
    DEMO_ITEMS,
    DEMO_OFF,
    DEMO_OUTLET_PRICES,
    DEMO_OUTLETS,
    DEMO_PASSWORD,
    demoStaffOf,
} from "./demo-data";
import { atHour, tradingDays } from "./demo-time";
import { newRandom, Random } from "./random";

// Demo data is made through the same services as real work, so stock, history, receipt numbers and
// totals are consistent by construction. Only the dates are moved into the past afterwards.

export interface DemoSummary {
    outlets: number;
    items: number;
    users: number;
    sales: number;
}

// Cash customers pay with 100 taka notes
const CASH_NOTE_CENTS = 10_000;

const newServices = () => {
    const outletRepo = new OutletRepo();
    const assignmentRepo = new AssignmentRepo();
    const inventoryRepo = new InventoryRepo();
    const userRepo = new UserRepo();
    const outlets = new OutletService(outletRepo);
    const menuItems = new MenuItemService(new MenuItemRepo());

    return {
        outlets,
        menuItems,
        assignments: new AssignmentService(assignmentRepo, outlets, menuItems),
        inventory: new InventoryService(inventoryRepo, outlets, menuItems),
        users: new UserService(userRepo, outletRepo),
        auth: new AuthService(userRepo, config.AUTH),
        sales: new SaleService(
            new SaleRepo(),
            new SaleClaimRepo(),
            assignmentRepo,
            inventoryRepo,
            outlets,
            config.BUSINESS
        ),
    };
};

type Services = ReturnType<typeof newServices>;

interface MenuLine {
    publicId: string;
    sku: string;
    priceCents: number;
    onSale: boolean;
}

interface DemoOutlet {
    code: string;
    publicId: string;
    menu: MenuLine[];
    manager: AuthUser;
    cashier: AuthUser;
}

const createOutlets = async (services: Services): Promise<DemoOutlet[]> => {
    const items = [];
    for (const item of DEMO_ITEMS) {
        items.push(await services.menuItems.create({ ...item, isActive: true }));
    }

    const outlets: DemoOutlet[] = [];
    for (const details of DEMO_OUTLETS) {
        const outlet = await services.outlets.create({ ...details, isActive: true });
        const menu: MenuLine[] = [];
        for (const item of items) {
            const priceOverrideCents = DEMO_OUTLET_PRICES[details.code]?.[item.sku] ?? null;
            const onSale = !(details.code === DEMO_OFF.outletCode && item.sku === DEMO_OFF.sku);
            await services.assignments.save(outlet.publicId, item.publicId, {
                priceOverrideCents,
                isAvailable: onSale,
            });
            const { effectivePriceCents } = priceOf(item.basePriceCents, priceOverrideCents);
            menu.push({ publicId: item.publicId, sku: item.sku, priceCents: effectivePriceCents, onSale });
        }

        const staff = demoStaffOf(details);
        const signIn = async (account: typeof staff.manager): Promise<AuthUser> => {
            await services.users.create({ ...account, password: DEMO_PASSWORD });
            return (await services.auth.login(account.email, DEMO_PASSWORD)).user;
        };
        outlets.push({
            code: details.code,
            publicId: outlet.publicId,
            menu,
            manager: await signIn(staff.manager),
            cashier: await signIn(staff.cashier),
        });
    }
    return outlets;
};

const addOpeningStock = async (services: Services, outlets: DemoOutlet[], at: Date): Promise<void> => {
    for (const outlet of outlets) {
        for (const item of outlet.menu) {
            await services.inventory.adjust(
                outlet.publicId,
                item.publicId,
                { delta: DEMO_HISTORY.OPENING_STOCK, reason: StockReason.RESTOCK, note: "Opening stock" },
                randomUUID(),
                outlet.manager.id
            );
        }
    }
    await newSequelize().query("UPDATE stock_movements SET created_at = :at WHERE reason = :reason", {
        replacements: { at, reason: StockReason.RESTOCK },
    });
};

const pickSome = <T>(list: T[], count: number, random: Random): T[] => {
    const left = [...list];
    return Array.from({ length: count }, () => left.splice(random.between(0, left.length - 1), 1)[0]);
};

// A believable order: one to three items, a mix of order types and payment methods
const randomOrder = (menu: MenuLine[], random: Random): SaleInput => {
    const lines = pickSome(
        menu.filter((item) => item.onSale),
        random.between(1, 3),
        random
    ).map((item) => ({ item, quantity: random.between(1, 2) }));
    const subtotal = lines.reduce((sum, { item, quantity }) => sum + item.priceCents * quantity, 0);
    const total = subtotal + vatOf(subtotal, config.BUSINESS.VAT_BPS);

    const type = random.next();
    const orderType = type < 0.5 ? OrderType.DINE_IN : type < 0.8 ? OrderType.TAKEAWAY : OrderType.DELIVERY;
    const paid = random.next();
    const payment =
        paid < 0.5
            ? {
                  method: PaymentMethod.CASH,
                  cashReceivedCents: Math.ceil(total / CASH_NOTE_CENTS) * CASH_NOTE_CENTS,
                  reference: null,
              }
            : {
                  method: paid < 0.8 ? PaymentMethod.MOBILE_BANKING : PaymentMethod.CARD,
                  cashReceivedCents: null,
                  reference: `DEMO-${random.between(100000, 999999)}`,
              };

    return {
        orderType,
        tableLabel: orderType === OrderType.DINE_IN ? `T${random.between(1, DEMO_HISTORY.TABLES)}` : null,
        payment,
        expectedTotalCents: total,
        items: lines.map(({ item, quantity }) => ({ menuItemId: item.publicId, quantity })),
    };
};

const moveSaleTo = async (saleId: number, at: Date): Promise<void> => {
    const replacements = { saleId, at };
    await newSequelize().query("UPDATE sales SET created_at = :at WHERE id = :saleId", { replacements });
    await newSequelize().query("UPDATE stock_movements SET created_at = :at WHERE sale_id = :saleId", {
        replacements,
    });
};

// Sales are made oldest first, so receipt numbers follow the dates
const addSales = async (
    services: Services,
    outlets: DemoOutlet[],
    days: ReturnType<typeof tradingDays>,
    random: Random
): Promise<number> => {
    const planned = days.flatMap(({ opensAt, closesAt }) =>
        outlets.flatMap((outlet) =>
            Array.from(
                { length: random.between(DEMO_HISTORY.SALES_PER_DAY.MIN, DEMO_HISTORY.SALES_PER_DAY.MAX) },
                () => ({ outlet, at: new Date(random.between(opensAt, closesAt)) })
            )
        )
    );
    planned.sort((a, b) => a.at.getTime() - b.at.getTime());

    for (const { outlet, at } of planned) {
        const { sale } = await services.sales.create(
            outlet.publicId,
            randomOrder(outlet.menu, random),
            randomUUID(),
            outlet.cashier
        );
        await moveSaleTo(sale.id, at);
    }
    return planned.length;
};

// Throws some stock away, so one item is running low and one has run out
const setFinalStock = async (services: Services, outlets: DemoOutlet[]): Promise<void> => {
    for (const { outletCode, sku, quantity } of DEMO_FINAL_STOCK) {
        const outlet = outlets.find((candidate) => candidate.code === outletCode)!;
        const item = outlet.menu.find((line) => line.sku === sku)!;
        const stock = await services.inventory.list(outlet.publicId, { search: sku, offset: 0, limit: 1 });
        await services.inventory.adjust(
            outlet.publicId,
            item.publicId,
            { delta: quantity - stock.data[0].quantity, reason: StockReason.WASTE, note: "Demo: spoiled stock" },
            randomUUID(),
            outlet.manager.id
        );
    }
};

// null: the database already has outlets, and demo data is never mixed into a database in use
export const seedDemoData = async (now: Date = new Date()): Promise<DemoSummary | null> => {
    const services = newServices();
    if ((await services.outlets.list({ offset: 0, limit: 1 })).total > 0) {
        return null;
    }

    await services.users.create({ ...DEMO_ADMIN, password: DEMO_PASSWORD });
    const outlets = await createOutlets(services);

    const days = tradingDays(now, config.BUSINESS.BUSINESS_TIMEZONE, DEMO_HISTORY.DAYS, {
        opens: DEMO_HISTORY.OPENS_AT_HOUR,
        closes: DEMO_HISTORY.CLOSES_AT_HOUR,
    });
    await addOpeningStock(services, outlets, atHour(days[0], DEMO_HISTORY.RESTOCK_AT_HOUR));
    const sales = await addSales(services, outlets, days, newRandom(DEMO_HISTORY.RANDOM_SEED));
    await setFinalStock(services, outlets);

    return {
        outlets: outlets.length,
        items: DEMO_ITEMS.length,
        // The admin, and a manager and a cashier per outlet
        users: 1 + outlets.length * 2,
        sales,
    };
};
