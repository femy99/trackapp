import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

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

        if (!querySnapshot.empty) {
             return NextResponse.json(
                { success: false, message: 'Username already exists' },
                { status: 409 }
            );
        }

        const docRef = await addDoc(usersRef, {
            username,
            password_hash: password // plain text for now as before
        });

        const response = NextResponse.json(
             { success: true, message: 'User created successfully' },
             { status: 201 }
        );

        response.cookies.set({
            name: 'auth_session',
            value: docRef.id,
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;

    } catch (error: any) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error', error: error.message || error.toString() },
            { status: 500 }
        );
    }
}
