import { Search } from 'lucide-react';
import { type KeyboardEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';

import { useProductSuggestions } from '../hooks/useProductSuggestions';

interface Props {
  initialSearch?: string;
  onSearch?: (term: string) => void;
}

export function SearchAutocomplete({ initialSearch = '', onSearch }: Props) {
  const navigate = useNavigate();
  const [term, setTerm] = useState(initialSearch);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { suggestions } = useProductSuggestions(term);

  const hasSuggestions = suggestions.length > 0;

  function submitSearch(value: string) {
    const q = value.trim();
    setOpen(false);
    if (onSearch) {
      onSearch(q);
    } else {
      navigate(q ? `/?search=${encodeURIComponent(q)}` : '/');
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      submitSearch(term);
    }
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <Popover open={open && hasSuggestions} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <form
          role="search"
          className="relative mx-auto w-full max-w-xl"
          onSubmit={(e) => {
            e.preventDefault();
            submitSearch(term);
          }}
        >
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            aria-label="Buscar repuestos"
            placeholder="Buscar repuestos, SKU, marca…"
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            className="h-10 w-full rounded-full border bg-muted/60 pl-11 pr-4 text-sm
                       transition-colors placeholder:text-muted-foreground
                       focus:border-primary focus:bg-background focus:outline-none"
          />
        </form>
      </PopoverAnchor>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup>
              {suggestions.map((s) => (
                <CommandItem
                  key={s.id}
                  value={s.name}
                  onSelect={() => {
                    navigate(`/product/${s.id}`);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="truncate">{s.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{s.sku}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
