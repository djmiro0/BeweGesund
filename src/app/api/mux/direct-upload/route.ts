import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  const adminToken = process.env.MUX_ADMIN_UPLOAD_TOKEN;

  if (!tokenId || !tokenSecret) {
    return NextResponse.json({ error: "Mux credentials are not configured." }, { status: 500 });
  }

  if (adminToken) {
    const authorization = request.headers.get("authorization");
    if (authorization !== `Bearer ${adminToken}`) {
      return NextResponse.json({ error: "Not allowed to create uploads." }, { status: 403 });
    }
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "*";
  const credentials = Buffer.from(`${tokenId}:${tokenSecret}`).toString("base64");

  const response = await fetch("https://api.mux.com/video/v1/uploads", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cors_origin: origin,
      new_asset_settings: {
        playback_policies: ["signed"],
        video_quality: "basic",
      },
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { error: "Mux upload creation failed.", details: payload },
      { status: response.status },
    );
  }

  return NextResponse.json({
    id: payload.data.id,
    url: payload.data.url,
    status: payload.data.status,
  });
}
