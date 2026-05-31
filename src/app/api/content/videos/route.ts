import { NextResponse } from "next/server";
import { getTrainingVideos } from "@/lib/contentful";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") ?? "de";
  const videos = await getTrainingVideos(locale);

  return NextResponse.json({ videos });
}
