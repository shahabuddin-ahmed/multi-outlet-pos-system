import { AssignmentRepo } from "../../../../repo/assignment";
import { MenuItemRepo } from "../../../../repo/menu-item";
import { OutletRepo } from "../../../../repo/outlet";
import { AssignmentService } from "../../../../service/assignment";
import { MenuItemService } from "../../../../service/menu-item";
import { OutletService } from "../../../../service/outlet";

// Sets up records the way the app does, without going through HTTP
export const outletService = new OutletService(new OutletRepo());
export const menuItemService = new MenuItemService(new MenuItemRepo());
const assignmentService = new AssignmentService(new AssignmentRepo(), outletService, menuItemService);

export const newOutlet = (code: string) =>
    outletService.create({ code, name: `Outlet ${code}`, address: null, phone: null, isActive: true });

export const newItem = (sku: string, basePriceCents = 10000) =>
    menuItemService.create({ sku, name: `Item ${sku}`, basePriceCents, isActive: true });

export const assignItem = (outletPublicId: string, itemPublicId: string, isAvailable = true) =>
    assignmentService.save(outletPublicId, itemPublicId, { priceOverrideCents: null, isAvailable });
