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
import { COMMUNES } from "@/constants/communes";

interface CommuneSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  cityCode?: string;
  className?: string;
  placeholder?: string;
}

export function CommuneSelector({
  value,
  onChange,
  cityCode,
  className,
  placeholder = "Sélectionnez une commune",
}: CommuneSelectorProps) {
  const [open, setOpen] = React.useState(false);

  // Filtrer les communes en fonction de la ville sélectionnée
  const filteredCommunes = React.useMemo(() => {
    if (!cityCode) return [];
    return COMMUNES.filter((commune) => commune.cityCode === cityCode);
  }, [cityCode]);

  // Trouver la commune sélectionnée
  const selectedCommune = filteredCommunes.find(
    (commune) => commune.code === value
  );

  // Réinitialiser la sélection si la ville change
  React.useEffect(() => {
    if (value && !filteredCommunes.find((commune) => commune.code === value)) {
      onChange("");
    }
  }, [cityCode, value, onChange, filteredCommunes]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={!cityCode}
        >
          {selectedCommune ? selectedCommune.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Rechercher une commune..." />
          <CommandList>
            <CommandEmpty>Aucune commune trouvée.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {filteredCommunes.map((commune) => (
                <CommandItem
                  key={commune.code}
                  value={commune.name}
                  onSelect={() => {
                    onChange(commune.code);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === commune.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {commune.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
