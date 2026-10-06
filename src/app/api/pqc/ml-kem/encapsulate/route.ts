import { NextRequest, NextResponse } from "next/server";
import { mlKemEncapsulate, type MlKemVariant } from "@/lib/pqc";

const VALID: MlKemVariant[] = ["ml-kem-512", "ml-kem-768", "ml-kem-1024"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const variant = body?.variant as MlKemVariant;
    const publicKey = body?.publicKey as string;
    if (!variant || !VALID.includes(variant)) {
      return NextResponse.json({ error: "Variant tidak valid" }, { status: 400 });
    }
    if (!publicKey || typeof publicKey !== "string") {
      return NextResponse.json({ error: "Public key diperlukan (hex)" }, { status: 400 });
    }
    const result = mlKemEncapsulate(variant, publicKey);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal melakukan encapsulation" },
      { status: 500 },
    );
  }
}
