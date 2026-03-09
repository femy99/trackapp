import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

export async function GET(request: Request) {
    try {
        const userId = request.headers.get('cookie')?.split('auth_session=')[1]?.split(';')[0];
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const workoutsRef = collection(db, 'workouts');
        const q = query(workoutsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        const data: Record<string, string> = {};
        querySnapshot.forEach((doc) => {
            const workout = doc.data();
            data[workout.date_key] = workout.workout_type;
        });

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
        console.error('Fetch workouts error:', error);
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
        const { date_key, type_id } = body;

        if (!date_key || type_id === undefined) {
             return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
        }

        // Use a composite ID for the document to easily update it if it exists
        const docId = `${userId}_${date_key}`;
        const workoutDocRef = doc(db, 'workouts', docId);

        await setDoc(workoutDocRef, {
            userId,
            date_key,
            workout_type: type_id,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({ success: true, message: 'Workout saved' }, { status: 200 });

    } catch (error) {
         console.error('Save workout error:', error);
         return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
