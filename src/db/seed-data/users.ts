import { MeasurementUnit, TemperatureUnit } from "@/lib/types";

// Every seeded member signs in with this password
export const SEED_USER_PASSWORD = "tastebase-demo";

export const SEED_USER_IDS = {
  julia: "seed-user-julia",
  marco: "seed-user-marco",
  sarah: "seed-user-sarah",
};

// Example household members for development seeding
export const seedUsers = [
  {
    id: SEED_USER_IDS.julia,
    name: "Julia Rodriguez",
    email: "julia@example.com",
    emailVerified: true,
    preferredTemperatureUnit: TemperatureUnit.FAHRENHEIT,
    preferredWeightUnit: MeasurementUnit.IMPERIAL,
    preferredVolumeUnit: MeasurementUnit.IMPERIAL,
    image: null,
  },
  {
    id: SEED_USER_IDS.marco,
    name: "Marco Chen",
    email: "marco@example.com",
    emailVerified: true,
    preferredTemperatureUnit: TemperatureUnit.CELSIUS,
    preferredWeightUnit: MeasurementUnit.METRIC,
    preferredVolumeUnit: MeasurementUnit.METRIC,
    image: null,
  },
  {
    id: SEED_USER_IDS.sarah,
    name: "Sarah Johnson",
    email: "sarah@example.com",
    emailVerified: true,
    preferredTemperatureUnit: TemperatureUnit.FAHRENHEIT,
    preferredWeightUnit: MeasurementUnit.METRIC,
    preferredVolumeUnit: MeasurementUnit.IMPERIAL,
    image: null,
  },
];
