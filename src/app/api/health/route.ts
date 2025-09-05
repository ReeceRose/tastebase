import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const healthLogger = createOperationLogger("health-check");

export async function GET() {
  try {
    // Test database connection
    await db.run(sql`SELECT 1`);

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        server: "running",
      },
    });
  } catch (error) {
    logError(healthLogger, "Health check failed", error);

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        services: {
          database: "disconnected",
          server: "running",
        },
      },
      { status: 503 },
    );
  }
}
