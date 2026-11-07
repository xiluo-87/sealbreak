/** Forecast weather per region (design 6.2). Weights are relative. */
export type Weather = 'clear' | 'rain' | 'wind';

export const WEATHER_MIX: Record<string, Record<Weather, number>> = {
  thistle: { clear: 5, rain: 3, wind: 2 },
  fen: { clear: 2, rain: 5, wind: 3 },
  copperhill: { clear: 4, rain: 2, wind: 4 },
  salt: { clear: 3, rain: 2, wind: 5 },
  kingsend: { clear: 4, rain: 4, wind: 2 },
  abbey: { clear: 3, rain: 5, wind: 2 },
  oldfront: { clear: 3, rain: 3, wind: 4 },
  gulls: { clear: 2, rain: 3, wind: 5 },
};
