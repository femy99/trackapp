import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

export async function GET(request: Request) {
    try {
        const userId = request.headers.get('cookie')?.split('auth_session=')[1]?.split(';')[0];
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const stepsRef = collection(db, 'steps');
        const q = query(stepsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        const data: Record<string, number> = {};
        querySnapshot.forEach((doc) => {
            const step = doc.data();
            data[step.date_key] = step.step_count;
        });

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
        console.error('Fetch steps error:', error);
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
        const { date_key, step_count } = body;

        if (!date_key || step_count === undefined) {
             return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
        }

        const docId = `${userId}_${date_key}`;
        const stepDocRef = doc(db, 'steps', docId);

        await setDoc(stepDocRef, {
            userId,
            date_key,
            step_count,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({ success: true, message: 'Steps saved' }, { status: 200 });

    } catch (error) {
         console.error('Save steps error:', error);
         return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
