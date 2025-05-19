"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { COUNTRIES, type Country } from "@/constants/countries";

interface PhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  onDialCodeChange?: (dialCode: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function PhoneInput({
  value = "",
  onChange,
  countryCode,
  onCountryCodeChange,
  onDialCodeChange,
  className,
  placeholder = "Numéro de téléphone",
  disabled = false,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(
    COUNTRIES.find((country) => country.code === countryCode)
  );

  // Mettre à jour le pays sélectionné lorsque le code pays change
  useEffect(() => {
    const country = COUNTRIES.find((country) => country.code === countryCode);
    if (
      country &&
      (!selectedCountry || selectedCountry.code !== country.code)
    ) {
      setSelectedCountry(country);
    }
  }, [countryCode]); // Dépendance réduite, selectedCountry retiré

  const handleCountrySelect = (country: Country) => {
    onCountryCodeChange(country.code);
    if (onDialCodeChange) {
      onDialCodeChange(country.dialCode);
    }
    setOpen(false);
  };

  return (
    <div className={cn("flex", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[120px] justify-between border-r-0 rounded-r-none bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
            disabled={disabled}
          >
            {selectedCountry ? (
              <div className="flex items-center">
                <span className="mr-1">{selectedCountry.flag}</span>
                <span className="text-xs">{selectedCountry.dialCode}</span>
              </div>
            ) : (
              "Pays"
            )}
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Rechercher un pays..." />
            <CommandList>
              <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
            </CommandList>
            <CommandList>
              <CommandGroup className="max-h-[300px] overflow-y-auto">
                {COUNTRIES.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={country.name}
                    onSelect={() => handleCountrySelect(country)}
                  >
                    <div className="flex items-center">
                      <span className="mr-2">{country.flag}</span>
                      <span className="text-sm">{country.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {country.dialCode}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        countryCode === country.code
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-l-none bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
