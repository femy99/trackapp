import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

export async function GET(request: Request) {
    try {
        const userId = request.headers.get('cookie')?.split('auth_session=')[1]?.split(';')[0];
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const journalsRef = collection(db, 'journals');
        const q = query(journalsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        const data: Record<string, string> = {};
        querySnapshot.forEach((doc) => {
             const journal = doc.data();
             data[journal.date_key] = journal.entry_text;
        });

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
        console.error('Fetch journal error:', error);
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
        const { date_key, entry_text } = body;

        if (!date_key) {
             return NextResponse.json({ success: false, message: 'Missing date_key parameter' }, { status: 400 });
        }

        const docId = `${userId}_${date_key}`;
        const journalDocRef = doc(db, 'journals', docId);

        if (entry_text) {
              await setDoc(journalDocRef, {
                  userId,
                  date_key,
                  entry_text,
                  updatedAt: new Date().toISOString()
              }, { merge: true });
        } else {
             // Delete if text is empty
             await deleteDoc(journalDocRef);
        }

        return NextResponse.json({ success: true, message: 'Journal saved' }, { status: 200 });

    } catch (error) {
         console.error('Save journal error:', error);
         return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
