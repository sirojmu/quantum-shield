import { NextRequest, NextResponse } from "next/server";
import { slhDsaSignBytes, type SlhDsaVariant } from "@/lib/pqc";

const VALID: SlhDsaVariant[] = [
  "slh-dsa-sha2-128f",
  "slh-dsa-sha2-128s",
  "slh-dsa-sha2-192f",
  "slh-dsa-sha2-192s",
  "slh-dsa-sha2-256f",
  "slh-dsa-sha2-256s",
];

/** Sign raw document bytes with SLH-DSA. Accepts base64-encoded message. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const variant = body?.variant as SlhDsaVariant;
    const secretKeyHex = body?.secretKey as string;
    const messageBase64 = body?.messageBase64 as string;

    if (!variant || !VALID.includes(variant)) {
      return NextResponse.json({ error: "Invalid variant" }, { status: 400 });
    }
    if (!secretKeyHex || typeof secretKeyHex !== "string") {
      return NextResponse.json(
        { error: "Secret key is required (hex)" },
        { status: 400 },
      );
    }
    if (!messageBase64 || typeof messageBase64 !== "string") {
      return NextResponse.json(
        { error: "messageBase64 is required" },
        { status: 400 },
      );
    }

    const secretKey = new Uint8Array(Buffer.from(secretKeyHex, "hex"));
    const message = new Uint8Array(Buffer.from(messageBase64, "base64"));
    const signature = slhDsaSignBytes(variant, secretKey, message);
    const signatureBase64 = Buffer.from(signature).toString("base64");

    return NextResponse.json({
      ok: true,
      signatureBase64,
      signatureSize: signature.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to sign document" },
      { status: 500 },
    );
  }
}
