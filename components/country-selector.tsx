"use client";

import { useState, useEffect } from "react";
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
}

export function CountrySelector({
  value,
  onChange,
  onCountryChange,
}: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(
    COUNTRIES.find((country) => country.code === value)
  );

  useEffect(() => {
    const country = COUNTRIES.find((country) => country.code === value);
    setSelectedCountry(country);
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCountry ? (
            <div className="flex items-center">
              <span className="mr-2 text-lg">{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
            </div>
          ) : (
            "Sélectionner un pays"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Rechercher un pays..." />
          <CommandList>
            <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.name}
                  onSelect={() => {
                    onChange(country.code);
                    if (onCountryChange) {
                      onCountryChange(country);
                    }
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">{country.flag}</span>
                    <span>{country.name}</span>
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
