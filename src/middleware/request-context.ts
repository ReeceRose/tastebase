import { nanoid } from "nanoid";
import type { NextRequest, NextResponse } from "next/server";

export function addRequestContext(request: NextRequest) {
  const requestId = nanoid(10);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  return {
    requestId,
    headers: requestHeaders,
  };
}

export function createResponseWithContext(
  response: NextResponse,
  requestId: string,
) {
  response.headers.set("x-request-id", requestId);
  return response;
}
