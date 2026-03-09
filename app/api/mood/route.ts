import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

export async function GET(request: Request) {
    try {
        const userId = request.headers.get('cookie')?.split('auth_session=')[1]?.split(';')[0];
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const moodsRef = collection(db, 'moods');
        const q = query(moodsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        const data: Record<string, number> = {};
        querySnapshot.forEach((doc) => {
            const mood = doc.data();
            data[mood.date_key] = mood.mood_level;
        });

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
        console.error('Fetch moods error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = request.headers.get('cookie')?.split('auth_session=')[1]?.split(';')[0];
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { date_key, mood_level } = body;

        if (!date_key || mood_level === undefined) {
             return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
        }

        // Use a composite ID for the document to easily update it if it exists
        const docId = `${userId}_${date_key}`;
        const moodDocRef = doc(db, 'moods', docId);

        await setDoc(moodDocRef, {
            userId,
            date_key,
            mood_level,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({ success: true, message: 'Mood saved' }, { status: 200 });

    } catch (error) {
         console.error('Save mood error:', error);
         return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
