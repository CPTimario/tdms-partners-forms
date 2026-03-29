import { NextResponse } from "next/server";

// Database removed: this route now returns an empty teams list.
// Tests that previously mocked the DB should continue to work via module mocking.
export async function GET() {
  return NextResponse.json({ teams: [] });
}
