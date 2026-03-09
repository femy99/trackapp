import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

export async function GET(request: Request) {
    try {
        const userId = request.headers.get('cookie')?.split('auth_session=')[1]?.split(';')[0];
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const showerRef = collection(db, 'shower');
        const q = query(showerRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        const data: Record<string, string> = {};
        querySnapshot.forEach((doc) => {
            const entry = doc.data();
            data[entry.date_key] = entry.shower_type;
        });

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
        console.error('Fetch shower error:', error);
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
        const { date_key, shower_type } = body;

        if (!date_key || !shower_type) {
             return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
        }

        const docId = `${userId}_${date_key}`;
        const showerDocRef = doc(db, 'shower', docId);

        await setDoc(showerDocRef, {
            userId,
            date_key,
            shower_type,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({ success: true, message: 'Shower data saved' }, { status: 200 });

    } catch (error) {
         console.error('Save shower error:', error);
         return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
