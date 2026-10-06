import { NextRequest, NextResponse } from "next/server";
import { mlKemKeygen, type MlKemVariant } from "@/lib/pqc";

const VALID: MlKemVariant[] = ["ml-kem-512", "ml-kem-768", "ml-kem-1024"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const variant = body?.variant as MlKemVariant;
    if (!variant || !VALID.includes(variant)) {
      return NextResponse.json(
        { error: "Invalid variant. Use: ml-kem-512 | ml-kem-768 | ml-kem-1024" },
        { status: 400 },
      );
    }
    const result = mlKemKeygen(variant);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate key pair" },
      { status: 500 },
    );
  }
}
