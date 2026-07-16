import React, { useState } from "react";
import { LogOut, Globe, Trophy, CheckCircle } from "lucide-react";

export default function ProfilePage({ user, setUser, onLogout }) {
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [isLinkingLeetcode, setIsLinkingLeetcode] = useState(false);
  const [isLinkingGithub, setIsLinkingGithub] = useState(false);
  const [leetcodeError, setLeetcodeError] = useState("");
  const [githubError, setGithubError] = useState("");

  const handleLinkLeetcode = async (e) => {
    e.preventDefault();
    if (!leetcodeUsername.trim()) return;
    setIsLinkingLeetcode(true);
    setLeetcodeError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/auth/link/leetcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: leetcodeUsername.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setLeetcodeUsername("");
      } else {
        setLeetcodeError(data.detail || "Failed to link LeetCode profile.");
      }
    } catch (err) {
      setLeetcodeError("Network error. Please try again.");
    } finally {
      setIsLinkingLeetcode(false);
    }
  };

  const handleUnlinkLeetcode = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/auth/unlink/leetcode", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      }
    } catch (err) {
      console.error("Failed to unlink LeetCode:", err);
    }
  };

  const handleLinkGithub = () => {
    const token = localStorage.getItem("token");
    window.location.href = `http://localhost:8000/api/auth/github?token=${token}`;
  };

  const handleUnlinkGithub = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/auth/github/disconnect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      }
    } catch (err) {
      console.error("Failed to disconnect GitHub:", err);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 bg-[#0b0c0e] min-h-screen text-[#f3f4f6]">
      <div className="flex justify-between items-center border-b border-[#22252a] pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Integration Settings</h1>
          <p className="text-sm text-[#9ca3af] mt-1">Manage your platform linkages and check progress trackers.</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-[#22252a] bg-[#141519] text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#1c1d22] transition-all"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      <div className="space-y-6">
        {}
        <div className="rounded-xl border border-[#22252a] bg-[#121316] p-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-lg bg-[#1c1d22] flex items-center justify-center border border-[#22252a]">
                <Globe className="text-[#6366f1]" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Google Account Session</h3>
                <p className="text-sm text-[#9ca3af] mt-0.5 font-sans">Primary email anchor associated with this workspace session.</p>
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <span className="text-sm px-3 py-1.5 rounded-md bg-[#141519] border border-[#22252a] text-[#f3f4f6] font-mono">
                    {user?.email}
                  </span>
                  <span className="text-xs text-[#9ca3af]">
                    Name: <strong className="text-[#f3f4f6]">{user?.displayName}</strong>
                  </span>
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#22252a] text-[#9ca3af] border border-[#1f2126]">
              Master Record
            </span>
          </div>
        </div>

        {}
        <div className="rounded-xl border border-[#22252a] bg-[#121316] p-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-lg bg-[#1c1d22] flex items-center justify-center border border-[#22252a]">
                <svg className="text-[#6366f1] h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">GitHub Sync</h3>
                <p className="text-sm text-[#9ca3af] mt-0.5">Link repositories for automated code progress monitoring.</p>
                
                <div className="mt-4">
                  {user?.github?.username ? (
                    <span className="text-sm text-[#9ca3af]">
                      Connected as <strong className="text-[#f3f4f6]">@{user.github.username}</strong>
                    </span>
                  ) : (
                    <button
                      onClick={handleLinkGithub}
                      className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#1c1d22] border border-[#22252a] text-[#f3f4f6] hover:bg-[#22252a] transition-all"
                    >
                      Link GitHub Repository
                    </button>
                  )}
                  {githubError && (
                    <p className="text-xs text-red-500 mt-2 font-mono">{githubError}</p>
                  )}
                </div>
              </div>
            </div>

            {user?.github?.username && (
              <button
                onClick={handleUnlinkGithub}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-[#141519] border border-[#22252a] text-[#9ca3af] hover:text-white hover:bg-[#1c1d22] transition-all"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        {}
        <div className="rounded-xl border border-[#22252a] bg-[#121316] p-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-lg bg-[#1c1d22] flex items-center justify-center border border-[#22252a]">
                <Trophy className="text-[#6366f1]" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">LeetCode Metrics Link</h3>
                <p className="text-sm text-[#9ca3af] mt-0.5">Track coding statistics, problem counts, and daily badge milestones.</p>
                
                <div className="mt-4">
                  {user?.leetcode?.username ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-green-500" size={16} />
                        <span className="text-sm text-green-500 font-medium">
                          Active Syncing: @{user.leetcode.username}
                        </span>
                      </div>
                      
                      <div className="flex gap-4 text-xs text-[#9ca3af]">
                        <div>
                          Problems Solved: <strong className="text-[#f3f4f6] text-sm">{user.leetcode.totalSolved}</strong>
                        </div>
                        {user.leetcode.badges && user.leetcode.badges.length > 0 && (
                          <div>
                            Badges: <strong className="text-[#f3f4f6]">{user.leetcode.badges.join(", ")}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleLinkLeetcode} className="flex gap-2 max-w-md">
                      <input
                        type="text"
                        value={leetcodeUsername}
                        onChange={(e) => setLeetcodeUsername(e.target.value)}
                        placeholder="Enter LeetCode Username"
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#22252a] bg-[#141519] text-[#f3f4f6] focus:outline-none focus:border-[#6366f1] transition-all"
                      />
                      <button
                        type="submit"
                        disabled={isLinkingLeetcode}
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#1c1d22] border border-[#22252a] text-[#f3f4f6] hover:bg-[#22252a] transition-all disabled:opacity-50"
                      >
                        {isLinkingLeetcode ? "Linking..." : "Link Profile"}
                      </button>
                    </form>
                  )}
                  {leetcodeError && (
                    <p className="text-xs text-red-500 mt-2 font-mono">{leetcodeError}</p>
                  )}
                </div>
              </div>
            </div>

            {user?.leetcode?.username && (
              <button
                onClick={handleUnlinkLeetcode}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-[#141519] border border-[#22252a] text-[#9ca3af] hover:text-white hover:bg-[#1c1d22] transition-all"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
