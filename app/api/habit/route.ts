import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

export async function GET(request: Request) {
    try {
        const userId = request.headers.get('cookie')?.split('auth_session=')[1]?.split(';')[0];
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const habitsRef = collection(db, 'habitTracker');
        const q = query(habitsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        const data: Record<string, number[]> = {};
        querySnapshot.forEach((doc) => {
            const habit = doc.data();
            data[habit.date_key] = habit.completed_ids;
        });

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
        console.error('Fetch habits error:', error);
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
        const { date_key, completed_ids } = body;

        if (!date_key || !completed_ids) {
             return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
        }

        const docId = `${userId}_${date_key}`;
        const habitDocRef = doc(db, 'habitTracker', docId);

        await setDoc(habitDocRef, {
            userId,
            date_key,
            completed_ids,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({ success: true, message: 'Habits saved' }, { status: 200 });

    } catch (error) {
         console.error('Save habits error:', error);
         return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
