import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Simple authentication logic (replace with real auth)
    if (email === 'admin@example.com' && password === 'password') {
      return NextResponse.json({ 
        success: true, 
        user: { email, name: 'Admin User' } 
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}