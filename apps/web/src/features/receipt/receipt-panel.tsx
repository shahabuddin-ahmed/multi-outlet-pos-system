'use client';

import { useState, type PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReceiptPaper } from '@/features/receipt/receipt-paper';
import type { Receipt } from '@/types';

interface ReceiptPanelProps extends PropsWithChildren {
  receipt: Receipt;
  // True right after the sale: the first print is the original, everything later is a copy
  fresh?: boolean;
}

// The receipt on screen with its print button. Buttons given as children sit beside it.
export function ReceiptPanel({ receipt, fresh = false, children }: ReceiptPanelProps) {
  const [copy, setCopy] = useState(!fresh);

  const print = () => {
    window.addEventListener('afterprint', () => setCopy(true), { once: true });
    window.print();
  };

  return (
    <>
      <ReceiptPaper receipt={receipt} copy={copy} />
      {/* The only thing on paper (see globals.css). Only shown in the browser, so document exists. */}
      {createPortal(
        <div className="print-area">
          <ReceiptPaper receipt={receipt} copy={copy} />
        </div>,
        document.body
      )}
      <div className="flex justify-end gap-2.5">
        <Button variant="outline" onClick={print}>
          <Printer aria-hidden="true" className="size-4" />
          Print
        </Button>
        {children}
      </div>
    </>
  );
}
