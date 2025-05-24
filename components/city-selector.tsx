"use client";

import * as React from "react";
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
import { CITIES } from "@/constants/villes";

interface CitySelectorProps {
  value?: string;
  onChange: (value: string) => void;
  countryCode?: string;
  className?: string;
  placeholder?: string;
}

export function CitySelector({
  value,
  onChange,
  countryCode,
  className,
  placeholder = "Sélectionnez une ville",
}: CitySelectorProps) {
  const [open, setOpen] = React.useState(false);

  // Filtrer les villes en fonction du pays sélectionné
  const filteredCities = React.useMemo(() => {
    if (!countryCode) return [];
    return CITIES.filter((city) => city.countryCode === countryCode);
  }, [countryCode]);

  // Trouver la ville sélectionnée
  const selectedCity = filteredCities.find((city) => city.code === value);

  // Réinitialiser la sélection si le pays change
  React.useEffect(() => {
    if (value && !filteredCities.find((city) => city.code === value)) {
      onChange("");
    }
  }, [countryCode, value, onChange, filteredCities]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={!countryCode}
        >
          {selectedCity ? selectedCity.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Rechercher une ville..." />
          <CommandList>
            <CommandEmpty>Aucune ville trouvée.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {filteredCities.map((city) => (
                <CommandItem
                  key={city.code}
                  value={city.name}
                  onSelect={() => {
                    onChange(city.code);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === city.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {city.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
