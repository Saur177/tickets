interface GitHubFile {
  content: string;
  sha: string;
  path: string;
}

interface GitHubIssue {
  id: number;
  title: string;
  body: string;
  state: string;
  user: {
    login: string;
  };
}

const GITHUB_API = 'https://api.github.com';

export async function fetchRepoFile(owner: string, repo: string, path: string, token?: string): Promise<GitHubFile> {
  const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json' };
  if (token) headers.Authorization = `token ${token}`;
  
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, { headers });
  const data = await response.json();
  
  return {
    content: Buffer.from(data.content, 'base64').toString('utf-8'),
    sha: data.sha,
    path: data.path
  };
}

export async function fetchRepoIssues(owner: string, repo: string, token?: string): Promise<GitHubIssue[]> {
  const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json' };
  if (token) headers.Authorization = `token ${token}`;
  
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues`, { headers });
  return await response.json();
}