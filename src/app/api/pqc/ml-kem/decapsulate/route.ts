import { NextRequest, NextResponse } from "next/server";
import { mlKemDecapsulate, type MlKemVariant } from "@/lib/pqc";

const VALID: MlKemVariant[] = ["ml-kem-512", "ml-kem-768", "ml-kem-1024"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const variant = body?.variant as MlKemVariant;
    const secretKey = body?.secretKey as string;
    const cipherText = body?.cipherText as string;
    if (!variant || !VALID.includes(variant)) {
      return NextResponse.json({ error: "Invalid variant" }, { status: 400 });
    }
    if (!secretKey || typeof secretKey !== "string") {
      return NextResponse.json({ error: "Secret key is required (hex)" }, { status: 400 });
    }
    if (!cipherText || typeof cipherText !== "string") {
      return NextResponse.json({ error: "Cipher text is required (hex)" }, { status: 400 });
    }
    const result = mlKemDecapsulate(variant, secretKey, cipherText);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to perform decapsulation" },
      { status: 500 },
    );
  }
}
