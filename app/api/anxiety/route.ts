import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

export async function GET(request: Request) {
    try {
        const userId = request.headers.get('cookie')?.split('auth_session=')[1]?.split(';')[0];
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const anxietyRef = collection(db, 'anxiety');
        const q = query(anxietyRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        const data: Record<string, number> = {};
        querySnapshot.forEach((doc) => {
            const entry = doc.data();
            data[entry.date_key] = entry.anxiety_level;
        });

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
        console.error('Fetch anxiety error:', error);
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
        const { date_key, anxiety_level } = body;

        if (!date_key || anxiety_level === undefined) {
             return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
        }

        const docId = `${userId}_${date_key}`;
        const anxietyDocRef = doc(db, 'anxiety', docId);

        await setDoc(anxietyDocRef, {
            userId,
            date_key,
            anxiety_level,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({ success: true, message: 'Anxiety data saved' }, { status: 200 });

    } catch (error) {
         console.error('Save anxiety error:', error);
         return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
