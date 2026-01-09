import { queue3 } from "@/workers/queue";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.url) {
      return NextResponse.json(
        { error: "No video url uploaded" },
        { status: 400 }
      );
    }

    await queue3.add(
      "process-youtube-video",
      JSON.stringify({
        url: body.url,
      })
    );

    return NextResponse.json({
      message: "video uploaded successfully",
      fileUrl: body.url,
    });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
