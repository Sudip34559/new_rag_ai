import { queue2 } from "@/workers/queue";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.url) {
      return NextResponse.json({ error: "No web url found" }, { status: 400 });
    }

    const res = await queue2.add(
      "process-web-doc",
      JSON.stringify({
        url: body.url,
      })
    );
    console.log("...........", res.progress);

    return NextResponse.json({
      message: "web doc uploaded successfully",
      fileUrl: body.url,
    });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
