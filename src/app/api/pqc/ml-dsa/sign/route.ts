import { NextRequest, NextResponse } from "next/server";
import { mlDsaSign, type MlDsaVariant } from "@/lib/pqc";

const VALID: MlDsaVariant[] = ["ml-dsa-44", "ml-dsa-65", "ml-dsa-87"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const variant = body?.variant as MlDsaVariant;
    const secretKey = body?.secretKey as string;
    const message = body?.message as string;
    if (!variant || !VALID.includes(variant)) {
      return NextResponse.json({ error: "Variant tidak valid" }, { status: 400 });
    }
    if (!secretKey || typeof secretKey !== "string") {
      return NextResponse.json({ error: "Secret key diperlukan (hex)" }, { status: 400 });
    }
    if (typeof message !== "string") {
      return NextResponse.json({ error: "Pesan diperlukan (string)" }, { status: 400 });
    }
    const result = mlDsaSign(variant, secretKey, message);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menandatangani pesan" },
      { status: 500 },
    );
  }
}
