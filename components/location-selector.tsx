"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LocationSelectorProps {
  onLocationChange: (
    country: string | null,
    city: string | null,
    commune: string | null
  ) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  onLocationChange,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<string | null>(null);

  const countries = ["France", "Espagne", "Italie"];
  const cities =
    selectedCountry === "France"
      ? ["Paris", "Marseille", "Lyon"]
      : selectedCountry === "Espagne"
      ? ["Madrid", "Barcelone", "Valence"]
      : selectedCountry === "Italie"
      ? ["Rome", "Milan", "Naples"]
      : [];
  const communes =
    selectedCity === "Paris"
      ? ["1er arrondissement", "2eme arrondissement", "3eme arrondissement"]
      : selectedCity === "Marseille"
      ? ["1er arrondissement", "2eme arrondissement", "3eme arrondissement"]
      : selectedCity === "Lyon"
      ? ["1er arrondissement", "2eme arrondissement", "3eme arrondissement"]
      : selectedCity === "Madrid"
      ? ["Centro", "Retiro", "Salamanca"]
      : selectedCity === "Barcelone"
      ? ["Ciutat Vella", "Eixample", "Sants-Montjuïc"]
      : selectedCity === "Valence"
      ? ["Ciutat Vella", "Eixample", "Extramurs"]
      : selectedCity === "Rome"
      ? ["Municipio I", "Municipio II", "Municipio III"]
      : selectedCity === "Milan"
      ? ["Municipio 1", "Municipio 2", "Municipio 3"]
      : selectedCity === "Naples"
      ? ["Municipalità 1", "Municipalità 2", "Municipalità 3"]
      : [];

  React.useEffect(() => {
    onLocationChange(selectedCountry, selectedCity, selectedCommune);
  }, [selectedCountry, selectedCity, selectedCommune, onLocationChange]);

  return (
    <div className="flex flex-col gap-4">
      <Select value={selectedCountry || ""} onValueChange={setSelectedCountry}>
        <SelectTrigger>
          <SelectValue placeholder="Sélectionnez un pays" />
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country} value={country}>
              {country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedCity || ""}
        onValueChange={setSelectedCity}
        disabled={!selectedCountry}
      >
        <SelectTrigger>
          <SelectValue placeholder="Sélectionnez une ville" />
        </SelectTrigger>
        <SelectContent>
          {cities.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedCommune || ""}
        onValueChange={setSelectedCommune}
        disabled={!selectedCity}
      >
        <SelectTrigger>
          <SelectValue placeholder="Sélectionnez une commune" />
        </SelectTrigger>
        <SelectContent>
          {communes.map((commune) => (
            <SelectItem key={commune} value={commune}>
              {commune}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LocationSelector;
