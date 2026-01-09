import { getProfile, getRepos, rateProfile } from "@/utils/gitData";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const profile = await getProfile(username);
    const repos = await getRepos(username);
    const rating = await rateProfile(profile, repos);

    return NextResponse.json({ profile, rating });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
