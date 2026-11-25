import { createSlice, type Dispatch, type PayloadAction } from '@reduxjs/toolkit';
import { api, ApiError, errorMessage } from '@/lib/api';
import { clearToken, getToken, setToken } from '@/lib/token';
import type { User } from '@/types';

// Who is signed in. Nothing about it is decided here: the API checks every request.
export type SessionState =
  // Asking the API whether the stored login still works
  | { status: 'restoring' }
  // It could not be asked; the login is kept
  | { status: 'unreachable'; message: string }
  // notice: why the person was signed out, empty after a normal sign-out
  | { status: 'signedOut'; notice: string }
  | { status: 'signedIn'; user: User };

const sessionSlice = createSlice({
  name: 'session',
  initialState: { status: 'restoring' } as SessionState,
  reducers: {
    restoring: (): SessionState => ({ status: 'restoring' }),
    unreachable: (_state, action: PayloadAction<string>): SessionState => ({
      status: 'unreachable',
      message: action.payload
    }),
    signedOut: (_state, action: PayloadAction<string>): SessionState => ({
      status: 'signedOut',
      notice: action.payload
    }),
    signedIn: (_state, action: PayloadAction<User>): SessionState => ({ status: 'signedIn', user: action.payload })
  }
});

const { restoring, unreachable, signedOut, signedIn } = sessionSlice.actions;

export const signOut =
  (notice = '') =>
  (dispatch: Dispatch) => {
    clearToken();
    dispatch(signedOut(notice));
  };

export const restoreSession = () => async (dispatch: Dispatch) => {
  if (!getToken()) {
    dispatch(signedOut(''));
    return;
  }
  dispatch(restoring());
  try {
    dispatch(signedIn(await api.me()));
  } catch (error) {
    // 401: the login ended. 403: the outlet was switched off.
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      clearToken();
      dispatch(signedOut(error.message));
    } else {
      dispatch(unreachable(errorMessage(error)));
    }
  }
};

// Throws the API's error, for the login form to show
export const signIn = (email: string, password: string) => async (dispatch: Dispatch) => {
  clearToken();
  const { token, user } = await api.login(email, password);
  setToken(token);
  dispatch(signedIn(user));
};

export default sessionSlice.reducer;
