import { NextRequest, NextResponse } from "next/server";
import { mlDsaVerify, type MlDsaVariant } from "@/lib/pqc";

const VALID: MlDsaVariant[] = ["ml-dsa-44", "ml-dsa-65", "ml-dsa-87"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const variant = body?.variant as MlDsaVariant;
    const publicKey = body?.publicKey as string;
    const message = body?.message as string;
    const signature = body?.signature as string;
    if (!variant || !VALID.includes(variant)) {
      return NextResponse.json({ error: "Variant tidak valid" }, { status: 400 });
    }
    if (!publicKey || typeof publicKey !== "string") {
      return NextResponse.json({ error: "Public key diperlukan (hex)" }, { status: 400 });
    }
    if (typeof message !== "string") {
      return NextResponse.json({ error: "Pesan diperlukan (string)" }, { status: 400 });
    }
    if (!signature || typeof signature !== "string") {
      return NextResponse.json({ error: "Signature diperlukan (hex)" }, { status: 400 });
    }
    const valid = mlDsaVerify(variant, publicKey, message, signature);
    return NextResponse.json({ ok: true, valid });
  } catch (err) {
    return NextResponse.json(
      { ok: false, valid: false, error: err instanceof Error ? err.message : "Gagal memverifikasi tanda tangan" },
      { status: 200 },
    );
  }
}
