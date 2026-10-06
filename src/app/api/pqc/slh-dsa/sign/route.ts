import { NextRequest, NextResponse } from "next/server";
import { slhDsaSign, type SlhDsaVariant } from "@/lib/pqc";

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
    const result = slhDsaSign(variant, secretKey, message);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menandatangani pesan" },
      { status: 500 },
    );
  }
}
