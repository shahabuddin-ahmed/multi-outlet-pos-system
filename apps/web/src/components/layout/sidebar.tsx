import Link from 'next/link';
import { Brand } from '@/components/layout/brand';
import { NavLinks } from '@/components/layout/nav-links';

// On a wide screen. Narrower ones have the slide-out menu instead.
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-0.5 overflow-y-auto border-r bg-card px-3 py-4 lg:flex">
      <Link href="/" className="self-start px-2.5 pb-4">
        <Brand caption="HQ and outlets" />
      </Link>
      <NavLinks />
    </aside>
  );
}
