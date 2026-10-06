import { NextRequest, NextResponse } from "next/server";
import { mlDsaKeygen, type MlDsaVariant } from "@/lib/pqc";

const VALID: MlDsaVariant[] = ["ml-dsa-44", "ml-dsa-65", "ml-dsa-87"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const variant = body?.variant as MlDsaVariant;
    if (!variant || !VALID.includes(variant)) {
      return NextResponse.json(
        { error: "Variant tidak valid. Gunakan: ml-dsa-44 | ml-dsa-65 | ml-dsa-87" },
        { status: 400 },
      );
    }
    const result = mlDsaKeygen(variant);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuat pasangan kunci" },
      { status: 500 },
    );
  }
}
