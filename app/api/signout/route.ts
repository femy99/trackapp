import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json(
        { success: true, message: 'Signout successful' },
        { status: 200 }
    );
    
    // Clear the dummy session cookie
    response.cookies.delete('auth_session');

    return response;
}
