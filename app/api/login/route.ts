import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: 'Username and password are required' },
                { status: 400 }
            );
        }

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
             return NextResponse.json(
                 { success: false, message: 'Invalid username or password' },
                 { status: 401 }
             );
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        if (password === userData.password_hash) {
            const response = NextResponse.json(
                { success: true, message: 'Login successful' },
                { status: 200 }
            );
            
            response.cookies.set({
                name: 'auth_session',
                value: userDoc.id,
                httpOnly: true,
                path: '/',
                maxAge: 60 * 60 * 24 * 7,
            });

            return response;
        } else {
            return NextResponse.json(
                { success: false, message: 'Invalid username or password' },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
