import axios from "axios";
import OpenAI from "openai";
import "dotenv/config";

const client2 = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// const client = new Groq({
//   apiKey: "",
// });

const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
  },
});

// Get repos of a user
async function getRepos(username: string) {
  const res = await githubApi.get(`/users/${username}/repos`);
  return res.data;
}

// Get commit history of a repo
async function getCommits(username: string, repo: string) {
  const res = await githubApi.get(`/repos/${username}/${repo}/commits`);
  return res.data;
}

// Get user profile
async function getProfile(username: string) {
  const res = await githubApi.get(`/users/${username}`);
  return res.data;
}

async function chatWithOpenAI(prompt: string) {
  const res = await client2.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
  });

  return res.output_text;
}

// Rate profile (basic example)
async function rateProfile(
  profile: { name?: string; login: string; followers: number },
  repos: Array<{ stargazers_count: number }>
) {
  const stars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const followers = profile.followers;
  const repoCount = repos.length;

  const prompt = `
You are a GitHub profile analyzer. Analyze the following GitHub profile data and return ONLY a valid JSON object with no additional text, explanations, or markdown formatting.

Profile Data:
- Name: ${profile.name || profile.login}
- Followers: ${followers}
- Repositories: ${repoCount}
- Total Stars: ${stars}

Return only this JSON structure:
{
  "rating": <number 1-10>,
  "reason": "<brief explanation in one sentence>",
  "metrics": {
    "follower_score": <number 1-10>,
    "repository_score": <number 1-10>,
    "star_score": <number 1-10>
  },
  "category": "<beginner|intermediate|advanced|expert>"
}

Rules:
- Rating scale: 1-3 (beginner), 4-6 (intermediate), 7-8 (advanced), 9-10 (expert)
- Consider followers, repo count, and stars together
- Reason should be concise and factual
- Return valid JSON only, no markdown, no explanations, no code blocks
`;

  return await chatWithOpenAI(prompt);
}

export { getRepos, getCommits, getProfile, rateProfile };
