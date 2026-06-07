"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getLanguagePresetById,
  tripLanguagePresets,
  type TripLanguagePresetId,
} from "@/features/trips/tripLanguagePresets";

export type TripLanguageFormValues = {
  presetId: TripLanguagePresetId;
  countryCode: string;
  languageCode: string;
  languageName: string;
  nativeLanguageName: string;
};

type TripLanguageFieldsProps = {
  values: TripLanguageFormValues;
  onChange: (values: TripLanguageFormValues) => void;
};

export function TripLanguageFields({
  values,
  onChange,
}: TripLanguageFieldsProps) {
  const showManualFields = values.presetId === "custom";

  function updateValue<Key extends keyof TripLanguageFormValues>(
    key: Key,
    value: TripLanguageFormValues[Key]
  ) {
    onChange({
      ...values,
      [key]: value,
    });
  }

  function handlePresetChange(presetId: TripLanguagePresetId) {
    const preset = getLanguagePresetById(presetId);

    onChange({
      presetId,
      countryCode: preset?.settings?.countryCode ?? "",
      languageCode: preset?.settings?.languageCode ?? "",
      languageName: preset?.settings?.languageName ?? "",
      nativeLanguageName: preset?.settings?.nativeLanguageName ?? "",
    });
  }

  return (
    <section className="rounded-xl border border-cyan-100 bg-cyan-50/40 p-4">
      <div className="grid gap-2">
        <Label htmlFor="trip-language-preset">Taal voor onderweg</Label>
        <Select value={values.presetId} onValueChange={handlePresetChange}>
          <SelectTrigger id="trip-language-preset" className="w-full bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tripLanguagePresets.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs leading-5 text-slate-500">
          Deze instelling wordt gebruikt voor de taalpagina en de luidsprekerknop.
        </p>
      </div>

      {showManualFields ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="trip-language-name">Taal</Label>
            <Input
              id="trip-language-name"
              value={values.languageName}
              onChange={(event) => updateValue("languageName", event.target.value)}
              placeholder="Bijvoorbeeld Japans"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trip-language-code">Taalcode voor uitspraak</Label>
            <Input
              id="trip-language-code"
              value={values.languageCode}
              onChange={(event) => updateValue("languageCode", event.target.value)}
              placeholder="Bijvoorbeeld ja-JP"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trip-country-code">Landcode</Label>
            <Input
              id="trip-country-code"
              value={values.countryCode}
              onChange={(event) => updateValue("countryCode", event.target.value)}
              placeholder="Bijvoorbeeld JP"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trip-native-language-name">Naam in eigen taal</Label>
            <Input
              id="trip-native-language-name"
              value={values.nativeLanguageName}
              onChange={(event) =>
                updateValue("nativeLanguageName", event.target.value)
              }
              placeholder="Bijvoorbeeld 日本語"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
