"use client";

import { useState, useEffect } from "react";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VILLES } from "@/constants/villes";
import { COMMUNES } from "@/constants/communes";
import { MapPin } from "lucide-react";

interface LocationSelectorProps {
  countryCode: string;
  cityValue: string;
  communeValue?: string;
  onCityChange: (value: string) => void;
  onCommuneChange: (value: string) => void;
  cityError?: string;
  communeError?: string;
  cityDescription?: string;
  communeDescription?: string;
}

export function LocationSelector({
  countryCode,
  cityValue,
  communeValue = "",
  onCityChange,
  onCommuneChange,
  cityError,
  communeError,
  cityDescription,
  communeDescription,
}: LocationSelectorProps) {
  const [availableCities, setAvailableCities] = useState<
    { value: string; label: string }[]
  >([]);
  const [availableCommunes, setAvailableCommunes] = useState<
    { value: string; label: string }[]
  >([]);
  const [hasCommunesForCity, setHasCommunesForCity] = useState(false);

  // Mettre à jour les villes disponibles lorsque le pays change
  useEffect(() => {
    if (countryCode) {
      const countryKey = countryCode.toLowerCase() as keyof typeof VILLES;
      const cities = VILLES[countryKey] || [];
      setAvailableCities(cities);
    } else {
      setAvailableCities([]);
    }
  }, [countryCode]);

  // Mettre à jour les communes disponibles lorsque la ville change
  useEffect(() => {
    if (cityValue) {
      const cityKey = cityValue as keyof typeof COMMUNES;
      const communes = COMMUNES[cityKey] || [];
      setAvailableCommunes(communes);
      setHasCommunesForCity(communes.length > 0);

      // Si la ville change et qu'il n'y a pas de communes disponibles, réinitialiser la valeur de la commune
      if (communes.length === 0 && communeValue) {
        onCommuneChange("");
      }
    } else {
      setAvailableCommunes([]);
      setHasCommunesForCity(false);
      if (communeValue) {
        onCommuneChange("");
      }
    }
  }, [cityValue, communeValue, onCommuneChange]);

  // Gérer le changement de ville
  const handleCityChange = (value: string) => {
    onCityChange(value);
    // Réinitialiser la commune lorsque la ville change
    onCommuneChange("");
  };

  return (
    <div className="space-y-4">
      <FormItem>
        <FormLabel className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-primary" />
          Ville
        </FormLabel>
        <Select
          value={cityValue}
          onValueChange={handleCityChange}
          disabled={!countryCode}
        >
          <FormControl>
            <SelectTrigger className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all">
              <SelectValue placeholder="Sélectionner une ville" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {availableCities.length > 0 ? (
              availableCities.map((city) => (
                <SelectItem key={city.value} value={city.value}>
                  {city.label}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-cities" disabled>
                Aucune ville disponible
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {cityDescription && (
          <FormDescription>{cityDescription}</FormDescription>
        )}
        {cityError && <FormMessage>{cityError}</FormMessage>}
      </FormItem>

      {/* Afficher le sélecteur de commune uniquement s'il y a des communes disponibles pour la ville sélectionnée */}
      {hasCommunesForCity && (
        <FormItem>
          <FormLabel className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" />
            Commune
          </FormLabel>
          <Select
            value={communeValue}
            onValueChange={onCommuneChange}
            disabled={!cityValue || availableCommunes.length === 0}
          >
            <FormControl>
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all">
                <SelectValue placeholder="Sélectionner une commune" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {availableCommunes.map((commune) => (
                <SelectItem key={commune.value} value={commune.value}>
                  {commune.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {communeDescription && (
            <FormDescription>{communeDescription}</FormDescription>
          )}
          {communeError && <FormMessage>{communeError}</FormMessage>}
        </FormItem>
      )}
    </div>
  );
}
