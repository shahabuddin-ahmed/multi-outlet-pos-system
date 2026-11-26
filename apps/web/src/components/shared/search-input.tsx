'use client';

import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// A search box with its icon and a clear button, the same in every browser. Escape clears it too.
export function SearchInput({ label, value, onChange, placeholder = 'Search…' }: SearchInputProps) {
  const input = useRef<HTMLInputElement>(null);
  const clear = () => {
    onChange('');
    input.current?.focus();
  };

  return (
    <div className="relative w-full sm:w-72">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={input}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        maxLength={100}
        className="pr-10 pl-9 [&::-webkit-search-cancel-button]:appearance-none"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => event.key === 'Escape' && clear()}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={clear}
          className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </div>
  );
}
