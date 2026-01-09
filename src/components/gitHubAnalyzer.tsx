"use client";

import React, { useState } from "react";
import {
  Github,
  Search,
  Star,
  Users,
  BookOpen,
  MapPin,
  Building2,
  GitBranch,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import axios from "axios";
import Image from "next/image";

function GitHubAnalyzer() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profileData, setProfileData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<number | null>(null);

  const searchProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter a username");
      toast.error("Please enter a username");
      return;
    }

    setLoading(true);
    setError("");
    setProfileData(null);
    setRepositories([]);
    setSelectedRepo(null);

    try {
      const [profileResponse, reposResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/rate/${username}`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/repos/${username}`),
      ]);

      setProfileData(profileResponse.data);
      setRepositories(reposResponse.data);
      toast.success("Profile loaded successfully");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage =
        err.response?.status === 404
          ? "User not found"
          : err.response?.data?.error || "Failed to fetch profile data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRepoClick = (repo: any) => {
    if (selectedRepo === repo.id) {
      axios
        .delete(`${process.env.NEXT_PUBLIC_API_URL}/delete?name=git-repo`)
        .then(() => {
          toast.success(`Deselected repository: ${repo.name}`);
          setSelectedRepo(null);
        });
    } else {
      axios
        .post(`${process.env.NEXT_PUBLIC_API_URL}/upload/git-repo`, {
          url: `https://github.com/${username}/${repo.name}`,
        })
        .then((res) => {
          console.log(res.data);
          setSelectedRepo(repo.id);
          toast.success(`Selected repository: ${repo.name}`);
        })
        .catch((error) => {
          console.error("Error uploading file:", error);
          toast.error("Failed to select repository");
        });
    }
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      JavaScript: "bg-yellow-500",
      TypeScript: "bg-blue-500",
      Python: "bg-green-500",
      Java: "bg-red-500",
      HTML: "bg-orange-500",
      CSS: "bg-purple-500",
      React: "bg-cyan-500",
      "Node.js": "bg-green-600",
      PHP: "bg-indigo-500",
      Go: "bg-cyan-400",
    };
    return colors[language] || "bg-muted";
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-green-500";
    if (rating >= 6) return "text-yellow-500";
    if (rating >= 4) return "text-orange-500";
    return "text-red-500";
  };

  const getCategoryBadgeVariant = (category: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      expert: "default",
      advanced: "secondary",
      intermediate: "outline",
      beginner: "secondary",
    };
    return variants[category] || "outline";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ratingData: any = {};
  if (profileData) {
    try {
      ratingData = JSON.parse(profileData.rating);
    } catch (error) {
      console.log(error);

      ratingData = {
        rating: 0,
        reason: "Unable to parse rating",
        category: "unknown",
      };
    }
  }

  return (
    <div className="h-full w-full flex flex-col bg-background @container">
      {/* Header */}
      {profileData && (
        <div className="border-b bg-card">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Github className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-semibold">
                  GitHub Profile Analyzer
                </h1>
                <p className="text-xs text-muted-foreground">
                  Analyzing @{profileData.profile.login}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {!profileData ? (
          <div className="h-full flex items-center justify-center p-6">
            <Card className="max-w-2xl w-full">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-6 py-8">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <Github className="w-8 h-8 text-primary" />
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-semibold">
                      GitHub Profile Analyzer
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Enter any GitHub username to analyze their profile,
                      repositories, and get an AI-powered rating
                    </p>
                  </div>

                  <form
                    onSubmit={searchProfile}
                    className="w-full max-w-md space-y-4"
                  >
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter GitHub username (e.g., octocat)"
                        className="pl-10 h-12"
                        disabled={loading}
                      />
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      disabled={!username.trim() || loading}
                      size="lg"
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing Profile...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Analyze Profile
                        </>
                      )}
                    </Button>
                  </form>

                  <Alert className="max-w-md">
                    <Github className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <p className="font-medium mb-2">Try These Profiles:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• octocat (GitHub&apos;s mascot)</li>
                        <li>• torvalds (Linux creator)</li>
                        <li>• gaearon (React core team)</li>
                        <li>• sindresorhus (OSS maintainer)</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Profile Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col  gap-6">
                  {/* Avatar */}
                  <div className="shrink-0">
                    <Image
                      src={profileData.profile.avatar_url}
                      alt={`${profileData.profile.login}'s avatar`}
                      className="w-24 h-24 rounded-lg border"
                      width={24}
                      height={24}
                    />
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {profileData.profile.name || profileData.profile.login}
                      </h2>
                      <p className="text-muted-foreground">
                        @{profileData.profile.login}
                      </p>
                    </div>

                    {profileData.profile.bio && (
                      <p className="text-sm">{profileData.profile.bio}</p>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 @lg:grid-cols-4 gap-4">
                      <div className="text-center p-3 rounded-lg bg-muted">
                        <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-lg font-bold">
                          {profileData.profile.followers}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Followers
                        </div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted">
                        <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-lg font-bold">
                          {profileData.profile.following}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Following
                        </div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted">
                        <BookOpen className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-lg font-bold">
                          {profileData.profile.public_repos}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Repositories
                        </div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted">
                        <Star className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-lg font-bold">
                          {repositories.reduce(
                            (sum, repo) => sum + repo.stargazers_count,
                            0
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total Stars
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {profileData.profile.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{profileData.profile.location}</span>
                        </div>
                      )}
                      {profileData.profile.company && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>{profileData.profile.company}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rating Card */}
                  <Card className="">
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-center">
                        AI Profile Rating
                      </h3>

                      <div className="text-center space-y-2">
                        <div
                          className={`text-4xl font-bold ${getRatingColor(
                            ratingData.rating
                          )}`}
                        >
                          {ratingData.rating}/10
                        </div>
                        <Badge
                          variant={getCategoryBadgeVariant(ratingData.category)}
                        >
                          {ratingData.category?.toUpperCase()}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground text-center">
                        {ratingData.reason}
                      </p>

                      {ratingData.metrics && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 rounded bg-muted">
                            <span className="text-xs">Followers Score</span>
                            <span
                              className={`text-sm font-semibold ${getRatingColor(
                                ratingData.metrics.follower_score
                              )}`}
                            >
                              {ratingData.metrics.follower_score}/10
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-muted">
                            <span className="text-xs">Repository Score</span>
                            <span
                              className={`text-sm font-semibold ${getRatingColor(
                                ratingData.metrics.repository_score
                              )}`}
                            >
                              {ratingData.metrics.repository_score}/10
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-muted">
                            <span className="text-xs">Star Score</span>
                            <span
                              className={`text-sm font-semibold ${getRatingColor(
                                ratingData.metrics.star_score
                              )}`}
                            >
                              {ratingData.metrics.star_score}/10
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Repositories */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Repositories ({repositories.length})
                </h3>

                <div className="grid gap-4 @md:grid-cols-2">
                  {repositories.map((repo) => (
                    <Card
                      key={repo.id}
                      onClick={() => handleRepoClick(repo)}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedRepo === repo.id ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            {repo.name}
                          </h4>
                          {repo.private && (
                            <Badge variant="secondary" className="text-xs">
                              Private
                            </Badge>
                          )}
                        </div>

                        {repo.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {repo.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {repo.language && (
                            <div className="flex items-center gap-1">
                              <div
                                className={`w-2 h-2 rounded-full ${getLanguageColor(
                                  repo.language
                                )}`}
                              />
                              <span>{repo.language}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {repo.stargazers_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            {repo.forks_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {repo.watchers_count}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          <span>Updated {formatDate(repo.updated_at)}</span>
                          <span>{(repo.size / 1024).toFixed(1)} MB</span>
                        </div>

                        {selectedRepo === repo.id && (
                          <div className="flex items-center gap-2 text-primary text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Selected
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {repositories.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No repositories found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default GitHubAnalyzer;
