import { NextRequest, NextResponse } from "next/server";
import { getRepos } from "@/utils/gitData";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const repos = await getRepos(username);
    return NextResponse.json(repos);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
