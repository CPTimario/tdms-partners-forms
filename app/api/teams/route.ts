import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

type TeamDoc = {
  _id: unknown;
  teamName: string;
  nation?: string;
  travelDate?: string;
  sendingChurch?: string;
  missioners?: string[];
};

export async function GET(req: Request) {
  try {
    const db = await getDb();
    const coll = db.collection<TeamDoc>("teams");

    // support optional query param q for simple substring search
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? "";
    const filter = q ? { teamName: { $regex: q, $options: "i" } } : {};

    const docs = await coll
      .find(filter, { projection: { _id: 1, teamName: 1, nation: 1, travelDate: 1, sendingChurch: 1, missioners: 1 } })
      .toArray();

    // normalize into groups: each team with missioner items
    const teams = docs.map((d) => ({
      teamId: String(d._id),
      teamName: d.teamName,
      nation: d.nation ?? "",
      travelDate: d.travelDate ?? "",
      sendingChurch: d.sendingChurch ?? "",
      missioners: Array.isArray(d.missioners) ? d.missioners : [],
    }));

    return NextResponse.json({ teams });
  } catch {
    // don't leak details
    return NextResponse.json({ teams: [] }, { status: 500 });
  }
}
