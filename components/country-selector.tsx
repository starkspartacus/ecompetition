"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { COUNTRIES, type Country } from "@/constants/countries";

interface CountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
  onCountryChange?: (country: Country) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function CountrySelector({
  value,
  onChange,
  onCountryChange,
  className,
  placeholder = "Sélectionnez un pays",
  disabled = false,
}: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const selectedCountry = COUNTRIES.find((country) => country.code === value);

  const handleSelect = (code: string) => {
    onChange(code);
    const country = COUNTRIES.find((c) => c.code === code);
    if (country && onCountryChange) {
      onCountryChange(country);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-white/80 backdrop-blur-sm border-emerald-600/20 hover:border-emerald-600/40 transition-all",
            className
          )}
          disabled={disabled}
        >
          {selectedCountry ? (
            <div className="flex items-center">
              <span className="mr-2">{selectedCountry.flag}</span>
              <span className="text-sm">{selectedCountry.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un pays..." />
          <CommandList>
            <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.name}
                  onSelect={() => handleSelect(country.code)}
                >
                  <div className="flex items-center w-full">
                    <span className="mr-2">{country.flag}</span>
                    <span className="text-sm">{country.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {country.dialCode}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default CountrySelector;
