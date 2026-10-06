import { NextRequest, NextResponse } from "next/server";
import { slhDsaVerifyBytes, type SlhDsaVariant } from "@/lib/pqc";

const VALID: SlhDsaVariant[] = [
  "slh-dsa-sha2-128f",
  "slh-dsa-sha2-128s",
  "slh-dsa-sha2-192f",
  "slh-dsa-sha2-192s",
  "slh-dsa-sha2-256f",
  "slh-dsa-sha2-256s",
];

/** Verify a document signature with SLH-DSA. Accepts base64-encoded message & signature. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const variant = body?.variant as SlhDsaVariant;
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
    const valid = slhDsaVerifyBytes(variant, publicKey, message, signature);

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
