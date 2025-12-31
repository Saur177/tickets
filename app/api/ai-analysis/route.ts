import { NextRequest, NextResponse } from 'next/server';

interface IssueAnalysis {
  criticality: 'critical' | 'high' | 'medium' | 'low';
  type: 'bug' | 'security' | 'feature' | 'enhancement' | 'documentation' | 'performance';
  solution: string;
  priority: number;
}

export async function POST(request: NextRequest) {
  try {
    const { issues, repoContext } = await request.json();
    
    const analyzedIssues = await Promise.all(
      issues.map(async (issue: any) => {
        const analysis = await analyzeIssue(issue, repoContext);
        return {
          ...issue,
          ai_analysis: analysis
        };
      })
    );

    // Sort by priority (critical first)
    const sortedIssues = analyzedIssues.sort((a, b) => b.ai_analysis.priority - a.ai_analysis.priority);
    
    return NextResponse.json({ issues: sortedIssues });
  } catch (error) {
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
  }
}

async function analyzeIssue(issue: any, repoContext: string): Promise<IssueAnalysis> {
  const title = issue.title.toLowerCase();
  const body = (issue.body || '').toLowerCase();
  const text = `${title} ${body}`;
  
  // Determine type with more specific keywords
  let type: IssueAnalysis['type'] = 'bug';
  
  // Security keywords - highest priority
  const securityKeywords = ['security', 'vulnerability', 'exploit', 'ssl', 'tls', 'https', 'certificate',
    'authentication', 'authorization', 'xss', 'sql injection', 'csrf', 'encryption', 'password',
    'token', 'auth', 'login', 'session', 'cookie', 'cors', 'injection', 'malicious', 'attack',
    'breach', 'leak', 'exposed', 'unsafe', 'insecure', 'privilege', 'permission'];
  
  if (securityKeywords.some(keyword => text.includes(keyword))) {
    type = 'security';
  } else if (text.includes('feature') || text.includes('add') || text.includes('implement') ||
             text.includes('new functionality') || text.includes('enhancement request')) {
    type = 'feature';
  } else if (text.includes('performance') || text.includes('slow') || text.includes('optimize') ||
             text.includes('memory') || text.includes('cpu') || text.includes('speed') ||
             text.includes('timeout') || text.includes('lag') || text.includes('bottleneck')) {
    type = 'performance';
  } else if (text.includes('documentation') || text.includes('readme') || text.includes('docs') ||
             text.includes('comment') || text.includes('guide') || text.includes('manual')) {
    type = 'documentation';
  } else if (text.includes('enhance') || text.includes('improve') || text.includes('better') ||
             text.includes('refactor') || text.includes('cleanup') || text.includes('upgrade')) {
    type = 'enhancement';
  } else if (text.includes('error') || text.includes('bug') || text.includes('issue') ||
             text.includes('problem') || text.includes('broken') || text.includes('fail') ||
             text.includes('crash') || text.includes('exception') || text.includes('null')) {
    type = 'bug';
  }
  
  // Determine criticality with improved logic
  let criticality: IssueAnalysis['criticality'] = 'low';
  let priority = 1;
  
  // Critical issues
  if (type === 'security' || 
      text.includes('critical') || text.includes('urgent') || text.includes('emergency') ||
      text.includes('crash') || text.includes('data loss') || text.includes('production down') ||
      text.includes('ssl') || text.includes('vulnerability') || text.includes('exploit')) {
    criticality = 'critical';
    priority = 4;
  }
  // High priority issues
  else if (text.includes('important') || text.includes('major') || text.includes('blocking') ||
           text.includes('cannot') || text.includes('unable') || text.includes('broken') ||
           text.includes('not working') || text.includes('fails') || type === 'performance') {
    criticality = 'high';
    priority = 3;
  }
  // Low priority issues
  else if (text.includes('minor') || text.includes('cosmetic') || text.includes('typo') ||
           text.includes('suggestion') || type === 'documentation' || type === 'enhancement') {
    criticality = 'low';
    priority = 1;
  }
  // Medium priority (default for everything else)
  else {
    criticality = 'medium';
    priority = 2;
  }
  
  // Generate solution
  const solution = generateSolution(issue, type, criticality);
  
  return { criticality, type, solution, priority };
}

function generateSolution(issue: any, type: string, criticality: string): string {
  const solutions = {
    bug: `1. Reproduce the issue described in "${issue.title}"
2. Debug the root cause in the affected code
3. Implement a fix with proper error handling
4. Add unit tests to prevent regression
5. Test thoroughly before deployment`,
    
    security: `1. URGENT: Assess security impact immediately
2. Implement security patch following best practices
3. Review related code for similar vulnerabilities
4. Update dependencies if applicable
5. Conduct security audit`,
    
    feature: `1. Analyze requirements from "${issue.title}"
2. Design the feature architecture
3. Implement core functionality
4. Add comprehensive tests
5. Update documentation`,
    
    performance: `1. Profile and identify performance bottlenecks
2. Optimize critical code paths
3. Implement caching where appropriate
4. Monitor performance metrics
5. Load test the improvements`,
    
    documentation: `1. Review current documentation gaps
2. Write clear, comprehensive documentation
3. Add code examples and usage patterns
4. Update README and API docs
5. Review for accuracy`,
    
    enhancement: `1. Evaluate current implementation
2. Design improved solution
3. Implement enhancements incrementally
4. Maintain backward compatibility
5. Update tests and documentation`
  };
  
  return solutions[type as keyof typeof solutions] || solutions.bug;
}