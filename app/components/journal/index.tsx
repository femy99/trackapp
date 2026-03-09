'use client';

import { useState, useEffect } from 'react';
import styles from './journal.module.css';
import Sidebar from '../Sidebar/Sidebar';

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

interface ModalState {
    shown: boolean;
    monthIndex: number | null;
    dayIndex: number | null;
    text: string;
}

export default function JournalPage() {
    const [entries, setEntries] = useState<Record<string, string>>({}); // { "monthIndex-day": "entry text" }
    const [modal, setModal] = useState<ModalState>({ shown: false, monthIndex: null, dayIndex: null, text: '' });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEntries = async () => {
            try {
                const res = await fetch('/api/journal');
                const result = await res.json();
                if (result.success) {
                    setEntries(result.data);
                }
            } catch (err) {
                console.error("Failed to load journal entries", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEntries();
    }, []);

    const getDaysInMonth = (monthIndex: number) => new Date(2026, monthIndex + 1, 0).getDate();

    const handlePixelClick = (monthIndex: number, dayIndex: number, currentText: string | undefined) => {
        setModal({
            shown: true,
            monthIndex,
            dayIndex,
            text: currentText || ''
        });
    };

    const handleSave = async () => {
        if (modal.monthIndex === null || modal.dayIndex === null) return;
        const key = `${modal.monthIndex}-${modal.dayIndex}`;
        const newText = modal.text.trim();
        
        // Optimistic update
        if (newText) {
            setEntries(prev => ({ ...prev, [key]: newText }));
        } else {
            // Remove entry if empty
            const newEntries = { ...entries };
            delete newEntries[key];
            setEntries(newEntries);
        }
        
        setModal({ shown: false, monthIndex: null, dayIndex: null, text: '' });

        // Save to DB
        try {
            await fetch('/api/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date_key: key, entry_text: newText })
            });
        } catch (err) {
            console.error("Failed to save journal entry", err);
        }
    };

    return (
        <div className={styles.container}>
            <Sidebar />
            <div className={styles.mainContent}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Daily Affirmations & Journal 2026</h1>
                </div>

                {isLoading ? (
                    <div>Loading...</div>
                ) : (
                    <div className={styles.gridContainer}>
                        <div className={styles.monthLabel}></div>
                        {Array.from({ length: 31 }, (_, i) => (
                            <div key={i} className={styles.dayHeader}>{i + 1}</div>
                        ))}

                        {MONTHS.map((month, mIndex) => {
                            const daysInMonth = getDaysInMonth(mIndex);
                            return (
                                <div key={month} style={{ display: 'contents' }}>
                                    <div className={styles.monthLabel}>{month}</div>
                                    {Array.from({ length: 31 }, (_, dIndex) => {
                                        const dayNumber = dIndex + 1;
                                        const isValidDay = dayNumber <= daysInMonth;
                                        const key = `${mIndex}-${dayNumber}`;
                                        const entry = entries[key];
                                        const hasEntry = !!entry;

                                        if (!isValidDay) return <div key={dIndex} style={{ background: 'transparent' }}></div>;

                                        return (
                                            <div
                                                key={dIndex}
                                                className={`${styles.pixel} ${hasEntry ? styles.hasEntry : ''}`}
                                                onClick={() => handlePixelClick(mIndex, dayNumber, entry)}
                                                title={hasEntry ? 'Read/Edit Entry' : 'Add Entry'}
                                            >
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {modal.shown && (
                <div className={styles.modalOverlay} onClick={() => setModal({ ...modal, shown: false })}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalTitle}>
                            {MONTHS[modal.monthIndex]} {modal.dayIndex}, 2026
                        </div>
                        <textarea
                            className={styles.textarea}
                            placeholder="Write your affirmation or thoughts for the day..."
                            value={modal.text}
                            onChange={e => setModal({ ...modal, text: e.target.value })}
                            autoFocus
                        />
                        <div className={styles.buttonGroup}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setModal({ shown: false, monthIndex: null, dayIndex: null, text: '' })}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.saveBtn}
                                onClick={handleSave}
                            >
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

