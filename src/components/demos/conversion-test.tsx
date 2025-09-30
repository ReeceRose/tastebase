/**
 * Test component to analyze current conversion logic
 */

"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MeasurementUnit } from "@/lib/types";
import {
  convertToCanonical,
  formatIngredientForDisplay,
  getBestDisplayUnit,
  parseAmount,
} from "@/lib/utils/unit-conversions";

const testConversions = [
  { amount: "1", unit: "tsp", name: "Vanilla extract" },
  { amount: "2", unit: "tbsp", name: "Olive oil" },
  { amount: "1/4", unit: "cup", name: "Water" },
  { amount: "1", unit: "cup", name: "Flour" },
  { amount: "1", unit: "lb", name: "Butter" },
  { amount: "8", unit: "oz", name: "Cream cheese" },
  { amount: "2", unit: "oz", name: "Chocolate chips" },
];

export function ConversionTest() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Conversion Analysis</CardTitle>
          <CardDescription>
            Testing how different amounts convert between imperial and metric
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testConversions.map((item) => {
              const imperialDisplay = formatIngredientForDisplay(
                item.amount,
                item.unit,
                MeasurementUnit.IMPERIAL,
              );

              const metricDisplay = formatIngredientForDisplay(
                item.amount,
                item.unit,
                MeasurementUnit.METRIC,
              );

              // Let's also see the raw conversion process
              const numericAmount = parseAmount(item.amount);
              const canonical = convertToCanonical(numericAmount, item.unit);
              const metricResult = getBestDisplayUnit(
                canonical.amount,
                canonical.unit,
                MeasurementUnit.METRIC,
              );

              return (
                <div
                  key={`${item.name}-${item.amount}-${item.unit}`}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg"
                >
                  <div>
                    <Badge variant="outline" className="mb-2">
                      Original
                    </Badge>
                    <p className="font-medium">
                      {item.amount} {item.unit} {item.name}
                    </p>
                  </div>

                  <div>
                    <Badge variant="outline" className="mb-2">
                      Imperial System
                    </Badge>
                    <p className="font-medium">
                      {imperialDisplay.amount} {imperialDisplay.unit}{" "}
                      {item.name}
                    </p>
                  </div>

                  <div>
                    <Badge variant="default" className="mb-2">
                      Metric System
                    </Badge>
                    <p className="font-medium">
                      {metricDisplay.amount} {metricDisplay.unit} {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Via: {canonical.amount} {canonical.unit} →{" "}
                      {metricResult.amount} {metricResult.unit}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Logic Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Current Logic:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>
                  • All units convert to canonical imperial first (fl oz for
                  volume, oz for weight)
                </li>
                <li>
                  • Then convert to best display unit based on amount size
                </li>
                <li>
                  • Volume metric uses: ml for everything under 1000ml, then L
                </li>
                <li>• Weight metric uses: g under 500g, then kg</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Potential Issues:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>
                  • Small volumes (tsp) might be more intuitive as ml rather
                  than going through fl oz
                </li>
                <li>
                  • The "best" unit selection might not match cooking intuition
                </li>
                <li>
                  • Some conversions might be less precise due to double
                  conversion
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
