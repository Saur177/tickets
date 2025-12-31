import { NextRequest, NextResponse } from 'next/server';

function parseGitHubUrl(url: string) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  return { owner: match[1], repo: match[2].replace('.git', '') };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get('url');
  const type = searchParams.get('type'); // 'repo', 'file', 'issues', 'commits'
  const path = searchParams.get('path');
  
  if (!repoUrl || !type) {
    return NextResponse.json({ error: 'Missing URL or type' }, { status: 400 });
  }

  try {
    const { owner, repo } = parseGitHubUrl(repoUrl);
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${process.env.GITHUB_TOKEN}`
    };

    let endpoint = '';
    switch (type) {
      case 'repo':
        endpoint = `https://api.github.com/repos/${owner}/${repo}`;
        break;
      case 'file':
        if (!path) return NextResponse.json({ error: 'Path required for file' }, { status: 400 });
        endpoint = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        break;
      case 'issues':
        endpoint = `https://api.github.com/repos/${owner}/${repo}/issues`;
        break;
      case 'commits':
        endpoint = `https://api.github.com/repos/${owner}/${repo}/commits`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const response = await fetch(endpoint, { headers });
    const data = await response.json();
    
    if (!response.ok) {
      console.error('GitHub API Error:', data);
      return NextResponse.json({ 
        error: data.message || 'Repository not found or no access permissions',
        details: data,
        endpoint: endpoint
      }, { status: response.status });
    }
    
    if (type === 'file' && data.content) {
      data.content = Buffer.from(data.content, 'base64').toString('utf-8');
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data', details: error.message }, { status: 500 });
  }
}