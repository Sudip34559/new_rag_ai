import { queue4 } from "@/workers/queue";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.url) {
      return NextResponse.json(
        { error: "No repo url uploaded" },
        { status: 400 }
      );
    }

    await queue4.add(
      "process-git-profile",
      JSON.stringify({
        url: body.url,
      })
    );

    return NextResponse.json({
      message: "repo added successfully",
      fileUrl: body.url,
    });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
