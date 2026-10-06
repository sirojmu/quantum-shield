import { NextRequest, NextResponse } from "next/server";
import { slhDsaKeygen, type SlhDsaVariant } from "@/lib/pqc";

const VALID: SlhDsaVariant[] = [
  "slh-dsa-sha2-128f",
  "slh-dsa-sha2-128s",
  "slh-dsa-sha2-192f",
  "slh-dsa-sha2-192s",
  "slh-dsa-sha2-256f",
  "slh-dsa-sha2-256s",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const variant = body?.variant as SlhDsaVariant;
    if (!variant || !VALID.includes(variant)) {
      return NextResponse.json(
        { error: "Invalid variant" },
        { status: 400 },
      );
    }
    const result = slhDsaKeygen(variant);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate key pair" },
      { status: 500 },
    );
  }
}
