export type TripLanguagePresetId =
  | "none"
  | "japan"
  | "denmark"
  | "england"
  | "united-states"
  | "france"
  | "germany"
  | "italy"
  | "spain"
  | "custom";

export type TripLanguageSettings = {
  countryCode: string;
  languageCode: string;
  languageName: string;
  nativeLanguageName: string;
};

export type TripLanguagePreset = {
  id: TripLanguagePresetId;
  label: string;
  settings?: TripLanguageSettings;
};

export const tripLanguagePresets: TripLanguagePreset[] = [
  { id: "none", label: "Geen taal ingesteld" },
  {
    id: "japan",
    label: "Japan / Japans",
    settings: {
      countryCode: "JP",
      languageCode: "ja-JP",
      languageName: "Japans",
      nativeLanguageName: "日本語",
    },
  },
  {
    id: "denmark",
    label: "Denemarken / Deens",
    settings: {
      countryCode: "DK",
      languageCode: "da-DK",
      languageName: "Deens",
      nativeLanguageName: "Dansk",
    },
  },
  {
    id: "england",
    label: "Engeland / Engels",
    settings: {
      countryCode: "GB",
      languageCode: "en-GB",
      languageName: "Engels",
      nativeLanguageName: "English",
    },
  },
  {
    id: "united-states",
    label: "Verenigde Staten / Engels",
    settings: {
      countryCode: "US",
      languageCode: "en-US",
      languageName: "Engels",
      nativeLanguageName: "English",
    },
  },
  {
    id: "france",
    label: "Frankrijk / Frans",
    settings: {
      countryCode: "FR",
      languageCode: "fr-FR",
      languageName: "Frans",
      nativeLanguageName: "Français",
    },
  },
  {
    id: "germany",
    label: "Duitsland / Duits",
    settings: {
      countryCode: "DE",
      languageCode: "de-DE",
      languageName: "Duits",
      nativeLanguageName: "Deutsch",
    },
  },
  {
    id: "italy",
    label: "Italië / Italiaans",
    settings: {
      countryCode: "IT",
      languageCode: "it-IT",
      languageName: "Italiaans",
      nativeLanguageName: "Italiano",
    },
  },
  {
    id: "spain",
    label: "Spanje / Spaans",
    settings: {
      countryCode: "ES",
      languageCode: "es-ES",
      languageName: "Spaans",
      nativeLanguageName: "Español",
    },
  },
  { id: "custom", label: "Anders / handmatig" },
];

export function getPresetForLanguageSettings(
  settings: Partial<TripLanguageSettings>
): TripLanguagePresetId {
  if (!settings.countryCode && !settings.languageCode && !settings.languageName) {
    return "none";
  }

  const preset = tripLanguagePresets.find((languagePreset) => {
    if (!languagePreset.settings) {
      return false;
    }

    return (
      languagePreset.settings.countryCode === settings.countryCode &&
      languagePreset.settings.languageCode === settings.languageCode &&
      languagePreset.settings.languageName === settings.languageName &&
      languagePreset.settings.nativeLanguageName === settings.nativeLanguageName
    );
  });

  return preset?.id ?? "custom";
}

export function getLanguagePresetById(id: TripLanguagePresetId) {
  return tripLanguagePresets.find((preset) => preset.id === id);
}
