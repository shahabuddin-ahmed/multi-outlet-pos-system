import { createSlice, type Dispatch, type PayloadAction } from '@reduxjs/toolkit';
import { api, ApiError, errorMessage } from '@/lib/api';
import { estimateTotals } from '@/lib/estimate';
import { forgetPendingSale, readPendingSale, savePendingSale } from '@/lib/pending-sale';
import { parsePrice } from '@/lib/price-input';
import { isSettled } from '@/lib/retry';
import { newUuid } from '@/lib/uuid';
import { signedOut, type SessionState } from '@/stores/slices/session-slice';
import type {
  OrderType,
  PaymentMethod,
  PriceChange,
  Receipt,
  SaleRequest,
  StockShortage,
  UnsellableItems
} from '@/types';

// The limits the API enforces; the till stops at them instead of being refused
export const CART_LINES_MAX = 50;
export const QUANTITY_MAX = 1000;
const CASH_MAX_CENTS = 99_999_999_999;

export interface CartLine {
  menuItemId: string;
  name: string;
  // The price when the item was added, until the API reports another
  unitPriceCents: number;
  quantity: number;
}

// The sale being put together
export interface Draft {
  lines: CartLine[];
  orderType: OrderType;
  tableLabel: string;
  method: PaymentMethod;
  // As typed
  cashText: string;
  reference: string;
  // Set when the API reported another VAT rate than the one loaded with the settings
  vatBps: number | null;
}

// A sale that has been sent: exactly what was sent, with its retry key
export interface PendingSale {
  key: string;
  outletId: string;
  request: SaleRequest;
  draft: Draft;
}

// Why the API refused the last attempt; nothing was saved
export interface Problem {
  message: string;
  // By menu item id
  lines: Record<string, string>;
  cash: string;
  // Set after a price change: the total the cashier had shown
  previousTotalCents: number | null;
}

export type Checkout =
  | { status: 'editing'; problem: Problem | null }
  | { status: 'sending'; pending: PendingSale }
  // No answer: the sale may or may not be saved, and only the same request may be sent again
  | { status: 'unconfirmed'; pending: PendingSale; message: string }
  | { status: 'done'; receipt: Receipt };

export interface CartState {
  draft: Draft;
  checkout: Checkout;
  // Counts the API's answers, after which stock and prices are worth loading again
  answers: number;
}

const EMPTY_DRAFT: Draft = {
  lines: [],
  orderType: 'TAKEAWAY',
  tableLabel: '',
  method: 'CASH',
  cashText: '',
  reference: '',
  vatBps: null
};
const EDITING: Checkout = { status: 'editing', problem: null };
const NO_PROBLEM: Problem = { message: '', lines: {}, cash: '', previousTotalCents: null };

const initialState: CartState = { draft: EMPTY_DRAFT, checkout: EDITING, answers: 0 };

// While a sale is sent or unconfirmed, nothing in the cart may change
export const isLocked = (checkout: Checkout): boolean =>
  checkout.status === 'sending' || checkout.status === 'unconfirmed';

// Every change by the cashier goes through here: refused while locked, and it ends the last refusal
const edit = (state: CartState, change: (draft: Draft) => void) => {
  if (isLocked(state.checkout)) {
    return;
  }
  change(state.draft);
  state.checkout = EDITING;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    itemAdded: (state, action: PayloadAction<Omit<CartLine, 'quantity'>>) =>
      edit(state, (draft) => {
        const line = draft.lines.find((existing) => existing.menuItemId === action.payload.menuItemId);
        if (line) {
          line.quantity = Math.min(line.quantity + 1, QUANTITY_MAX);
        } else if (draft.lines.length < CART_LINES_MAX) {
          draft.lines.push({ ...action.payload, quantity: 1 });
        }
      }),
    // 0 removes the line
    quantitySet: (state, action: PayloadAction<{ menuItemId: string; quantity: number }>) =>
      edit(state, (draft) => {
        const { menuItemId, quantity } = action.payload;
        if (quantity < 1) {
          draft.lines = draft.lines.filter((line) => line.menuItemId !== menuItemId);
          return;
        }
        const line = draft.lines.find((existing) => existing.menuItemId === menuItemId);
        if (line) {
          line.quantity = Math.min(quantity, QUANTITY_MAX);
        }
      }),
    detailsSet: (
      state,
      action: PayloadAction<Partial<Pick<Draft, 'orderType' | 'tableLabel' | 'method' | 'cashText' | 'reference'>>>
    ) =>
      edit(state, (draft) => {
        Object.assign(draft, action.payload);
      }),
    cartCleared: (state) => {
      if (!isLocked(state.checkout)) {
        state.draft = EMPTY_DRAFT;
        state.checkout = EDITING;
      }
    },
    receiptClosed: (state) => {
      if (state.checkout.status === 'done') {
        state.checkout = EDITING;
      }
    },
    sending: (state, action: PayloadAction<PendingSale>) => {
      state.draft = action.payload.draft;
      state.checkout = { status: 'sending', pending: action.payload };
    },
    unconfirmed: (state, action: PayloadAction<{ pending: PendingSale; message: string }>) => {
      state.draft = action.payload.pending.draft;
      state.checkout = { status: 'unconfirmed', ...action.payload };
    },
    completed: (state, action: PayloadAction<Receipt>) => {
      state.draft = EMPTY_DRAFT;
      state.checkout = { status: 'done', receipt: action.payload };
      state.answers += 1;
    },
    refused: (state, action: PayloadAction<{ problem: Problem; repriced?: PriceChange }>) => {
      const { problem, repriced } = action.payload;
      if (repriced) {
        state.draft.vatBps = repriced.vatBps;
        for (const line of state.draft.lines) {
          const current = repriced.lines.find((priced) => priced.menuItemId === line.menuItemId);
          line.unitPriceCents = current?.unitPriceCents ?? line.unitPriceCents;
        }
      }
      state.checkout = { status: 'editing', problem };
      state.answers += 1;
    }
  },
  // The cart belongs to the person signed in. An unconfirmed sale stays written down and comes back.
  extraReducers: (builder) => {
    builder.addCase(signedOut, () => initialState);
  }
});

export const { itemAdded, quantitySet, detailsSet, cartCleared, receiptClosed } = cartSlice.actions;
const { sending, unconfirmed, completed, refused } = cartSlice.actions;

type GetState = () => { cart: CartState; session: SessionState };

// The request for a draft, or what the cashier still has to enter
function requestOf(draft: Draft, vatBps: number): { request: SaleRequest } | { problem: Problem } {
  const cash = draft.method === 'CASH';
  const cashReceivedCents = cash ? parsePrice(draft.cashText, CASH_MAX_CENTS) : null;
  if (cash && cashReceivedCents === null) {
    const message = draft.cashText.trim() ? 'Enter an amount without commas' : 'Enter the cash received';
    return { problem: { ...NO_PROBLEM, cash: message } };
  }
  return {
    request: {
      orderType: draft.orderType,
      tableLabel: draft.orderType === 'DINE_IN' ? draft.tableLabel.trim() || null : null,
      payment: {
        method: draft.method,
        cashReceivedCents,
        reference: cash ? null : draft.reference.trim() || null
      },
      expectedTotalCents: estimateTotals(draft.lines, draft.vatBps ?? vatBps).totalCents,
      items: draft.lines.map(({ menuItemId, quantity }) => ({ menuItemId, quantity }))
    }
  };
}

// What to show for a refused sale
function refusalOf(error: ApiError, sent: PendingSale): { problem: Problem; repriced?: PriceChange } {
  switch (error.code) {
    case 'E_PRICE_CHANGED':
      return {
        problem: { ...NO_PROBLEM, previousTotalCents: sent.request.expectedTotalCents },
        repriced: error.details as PriceChange
      };
    case 'E_INSUFFICIENT_STOCK': {
      const lines = (error.details as StockShortage).items.map(({ menuItemId, available }) => [
        menuItemId,
        available === 0 ? 'Out of stock' : `Only ${available} left`
      ]);
      return {
        problem: { ...NO_PROBLEM, message: 'Not enough stock. Nothing was saved.', lines: Object.fromEntries(lines) }
      };
    }
    case 'E_ITEM_NOT_SELLABLE': {
      const lines = (error.details as UnsellableItems).items.map(({ menuItemId }) => [
        menuItemId,
        'No longer sold here. Remove it.'
      ]);
      return { problem: { ...NO_PROBLEM, message: error.message, lines: Object.fromEntries(lines) } };
    }
    case 'E_TENDER_TOO_LOW':
      return { problem: { ...NO_PROBLEM, cash: error.message } };
    default:
      return { problem: { ...NO_PROBLEM, message: error.message } };
  }
}

// Sends the cart as a sale, or sends an unconfirmed sale again, unchanged and with the same key
export const completeSale = (vatBps: number) => async (dispatch: Dispatch, getState: GetState) => {
  const { cart, session } = getState();
  if (session.status !== 'signedIn' || !session.user.outlet || cart.checkout.status === 'sending') {
    return;
  }
  const userId = session.user.id;
  const retrying = cart.checkout.status === 'unconfirmed';

  let pending: PendingSale;
  if (cart.checkout.status === 'unconfirmed') {
    pending = cart.checkout.pending;
  } else {
    const built = requestOf(cart.draft, vatBps);
    if ('problem' in built) {
      dispatch(refused(built));
      return;
    }
    pending = { key: newUuid(), outletId: session.user.outlet.id, request: built.request, draft: cart.draft };
  }
  savePendingSale(userId, pending);
  dispatch(sending(pending));
  // The person may have signed out while waiting; then the screen is no longer this sale's
  const onScreen = () => {
    const { checkout } = getState().cart;
    return checkout.status === 'sending' && checkout.pending.key === pending.key;
  };

  try {
    const receipt = await api.createSale(pending.outletId, pending.key, pending.request);
    forgetPendingSale(userId, pending.key);
    if (onScreen()) {
      dispatch(completed(receipt));
    }
  } catch (error) {
    if (!isSettled(error, retrying)) {
      if (onScreen()) {
        dispatch(unconfirmed({ pending, message: errorMessage(error) }));
      }
      return;
    }
    forgetPendingSale(userId, pending.key);
    if (onScreen()) {
      dispatch(refused(refusalOf(error as ApiError, pending)));
    }
  }
};

// Brings back a sale that was never answered, after a reload or a new sign-in
export const restorePendingSale = () => (dispatch: Dispatch, getState: GetState) => {
  const { cart, session } = getState();
  if (session.status !== 'signedIn' || isLocked(cart.checkout)) {
    return;
  }
  const pending = readPendingSale(session.user.id);
  if (pending) {
    dispatch(unconfirmed({ pending, message: 'The last sale was sent but not confirmed.' }));
  }
};

export default cartSlice.reducer;
