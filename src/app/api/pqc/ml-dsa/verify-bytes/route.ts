import { NextRequest, NextResponse } from "next/server";
import { mlDsaVerifyBytes, type MlDsaVariant } from "@/lib/pqc";

const VALID: MlDsaVariant[] = ["ml-dsa-44", "ml-dsa-65", "ml-dsa-87"];

/** Verify a document signature with ML-DSA. Accepts base64-encoded message & signature. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const variant = body?.variant as MlDsaVariant;
    const publicKeyHex = body?.publicKey as string;
    const messageBase64 = body?.messageBase64 as string;
    const signatureBase64 = body?.signatureBase64 as string;

    if (!variant || !VALID.includes(variant)) {
      return NextResponse.json({ error: "Invalid variant" }, { status: 400 });
    }
    if (!publicKeyHex) {
      return NextResponse.json({ error: "Public key is required (hex)" }, { status: 400 });
    }
    if (!messageBase64) {
      return NextResponse.json({ error: "messageBase64 is required" }, { status: 400 });
    }
    if (!signatureBase64) {
      return NextResponse.json({ error: "signatureBase64 is required" }, { status: 400 });
    }

    const publicKey = new Uint8Array(Buffer.from(publicKeyHex, "hex"));
    const message = new Uint8Array(Buffer.from(messageBase64, "base64"));
    const signature = new Uint8Array(Buffer.from(signatureBase64, "base64"));
    const valid = mlDsaVerifyBytes(variant, publicKey, message, signature);

    return NextResponse.json({ ok: true, valid });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        valid: false,
        error: err instanceof Error ? err.message : "Failed to verify signature",
      },
      { status: 200 },
    );
  }
}
