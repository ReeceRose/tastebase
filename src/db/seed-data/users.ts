import { nanoid } from "nanoid";
import { MeasurementUnit, TemperatureUnit } from "@/lib/types";

// Test users for development seeding
export const seedUsers = [
  {
    id: nanoid(),
    name: "Julia Rodriguez",
    email: "julia@example.com",
    emailVerified: true,
    preferredTemperatureUnit: TemperatureUnit.FAHRENHEIT,
    preferredWeightUnit: MeasurementUnit.IMPERIAL,
    preferredVolumeUnit: MeasurementUnit.IMPERIAL,
    image: null,
  },
  {
    id: nanoid(),
    name: "Marco Chen",
    email: "marco@example.com",
    emailVerified: true,
    preferredTemperatureUnit: TemperatureUnit.CELSIUS,
    preferredWeightUnit: MeasurementUnit.METRIC,
    preferredVolumeUnit: MeasurementUnit.METRIC,
    image: null,
  },
  {
    id: nanoid(),
    name: "Sarah Johnson",
    email: "sarah@example.com",
    emailVerified: false,
    preferredTemperatureUnit: TemperatureUnit.FAHRENHEIT,
    preferredWeightUnit: MeasurementUnit.METRIC,
    preferredVolumeUnit: MeasurementUnit.IMPERIAL,
    image: null,
  },
];
