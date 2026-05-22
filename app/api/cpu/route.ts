import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const start = Date.now();
  let sum = 0;
  // Burn CPU for ~2 seconds
  while (Date.now() - start < 2000) {
    for (let i = 0; i < 100000; i++) {
      sum += Math.sqrt(i);
    }
  }
  return NextResponse.json({ done: true });
}
