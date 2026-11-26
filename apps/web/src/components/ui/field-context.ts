'use client';

import { createContext, useContext } from 'react';

// What ties a control to the label, hint and error of the Field around it
export interface FieldControl {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export const FieldContext = createContext<FieldControl | undefined>(undefined);

export const useFieldControl = () => useContext(FieldContext);
