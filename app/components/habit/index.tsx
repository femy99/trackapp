'use client';

import { useState, useEffect } from 'react';
import styles from './habit.module.css';
import Sidebar from '../Sidebar/Sidebar';

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

interface Habit {
    id: number;
    text: string;
}

interface ModalState {
    shown: boolean;
    monthIndex: number | null;
    dayIndex: number | null;
    selectedIds: number[];
}

export default function HabitPage() {
    // habits: { id: number, text: string }[]
    const [habits, setHabits] = useState<Habit[]>([
        { id: 1, text: 'Drink 2L Water' },
        { id: 2, text: 'Read 10 Pages' },
        { id: 3, text: 'Exercise' }
    ]);
    const [newHabit, setNewHabit] = useState<string>('');

    // data: { "monthIndex-day": [habitId1, habitId2, ...] }
    const [data, setData] = useState<Record<string, number[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    // modal: { shown: boolean, monthIndex, dayIndex, selectedIds: [] }
    const [modal, setModal] = useState<ModalState>({ shown: false, monthIndex: null, dayIndex: null, selectedIds: [] });

    useEffect(() => {
        const fetchHabits = async () => {
            try {
                const res = await fetch('/api/habit');
                const result = await res.json();
                if (result.success) {
                    setData(result.data);
                }
            } catch (err) {
                console.error("Failed to load habit tracker data", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHabits();
    }, []);

    const getDaysInMonth = (monthIndex: number) => new Date(2026, monthIndex + 1, 0).getDate();

    const handleAddHabit = () => {
        if (!newHabit.trim()) return;
        const newId = Math.max(0, ...habits.map(h => h.id)) + 1;
        setHabits([...habits, { id: newId, text: newHabit }]);
        setNewHabit('');
    };

    const handleDeleteHabit = (id: number) => {
        setHabits(habits.filter(h => h.id !== id));
        // Optional: Clean up data for deleted habit? Maybe keep for history.
    };

    const handlePixelClick = (monthIndex: number, dayIndex: number, currentCompletedIds: number[] | undefined) => {
        setModal({
            shown: true,
            monthIndex,
            dayIndex,
            selectedIds: currentCompletedIds || []
        });
    };

    const toggleHabitInModal = (id: number) => {
        const current = modal.selectedIds;
        if (current.includes(id)) {
            setModal({ ...modal, selectedIds: current.filter(hid => hid !== id) });
        } else {
            setModal({ ...modal, selectedIds: [...current, id] });
        }
    };

    const saveDay = async () => {
        if (modal.monthIndex === null || modal.dayIndex === null) return;
        const key = `${modal.monthIndex}-${modal.dayIndex}`;
        const idsToSave = modal.selectedIds;
        
        if (idsToSave.length > 0) {
            setData((prev: Record<string, number[]>) => ({ ...prev, [key]: idsToSave }));
        } else {
            const newData = { ...data };
            delete newData[key];
            setData(newData);
        }
        
        setModal({ shown: false, monthIndex: null, dayIndex: null, selectedIds: [] });

        try {
            await fetch('/api/habit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date_key: key, completed_ids: idsToSave })
            });
        } catch (err) {
            console.error("Failed to save habit tracker data", err);
        }
    };

    const getLevelColorClass = (completedIds: number[] | undefined) => {
        if (!completedIds || completedIds.length === 0) return 'none';
        if (habits.length === 0) return 'none';

        const percentage = completedIds.length / habits.length;

        if (percentage === 1) return 'habit3'; // All
        if (percentage >= 0.5) return 'habit2'; // Most
        if (percentage > 0) return 'habit1'; // Some
        return 'habit0';
    };

    if (isLoading) {
        return <div className={styles.container}><div className={styles.mainContent}>Loading...</div></div>;
    }

    return (
        <div className={styles.container}>
            <Sidebar />
            <div className={styles.mainContent}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Habit Tracker 2026</h1>
                </div>

                <div className={styles.contentWrapper}>
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
                                        const completedIds = data[key];
                                        const colorClass = styles[getLevelColorClass(completedIds)];

                                        if (!isValidDay) return <div key={dIndex} style={{ background: 'transparent' }}></div>;

                                        return (
                                            <div
                                                key={dIndex}
                                                className={`${styles.pixel} ${colorClass}`}
                                                onClick={() => handlePixelClick(mIndex, dayNumber, completedIds)}
                                                title={completedIds ? `${completedIds.length}/${habits.length} Done` : '0 Done'}
                                            />
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>

                    <div className={styles.rightColumn}>

                        <div className={styles.legend}>
                            <div className={styles.legendItem}>
                                <div className={`${styles.colorBox} ${styles.habit3}`}></div>
                                <span className={styles.legendLabel}>All Done</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={`${styles.colorBox} ${styles.habit2}`}></div>
                                <span className={styles.legendLabel}>Most Done</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={`${styles.colorBox} ${styles.habit1}`}></div>
                                <span className={styles.legendLabel}>Some Done</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={`${styles.colorBox} ${styles.none}`}></div>
                                <span className={styles.legendLabel}>None</span>
                            </div>
                        </div>

                        {/* Habit Manager */}
                        <div className={styles.habitManager}>
                            <div className={styles.managerHeader}>
                                <span className={styles.managerTitle}>Daily Habits</span>
                            </div>

                            <div className={styles.habitList}>
                                {habits.map(h => (
                                    <div key={h.id} className={styles.habitItem}>
                                        <span className={styles.habitText}>{h.text}</span>
                                        <button className={styles.deleteBtn} onClick={() => handleDeleteHabit(h.id)} title="Delete Habit">
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {habits.length === 0 && (
                                    <div style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
                                        No habits yet.
                                    </div>
                                )}
                            </div>

                            <div className={styles.inputWrapper}>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="Add new..."
                                    value={newHabit}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewHabit(e.target.value)}
                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAddHabit()}
                                />
                                <button className={styles.addButton} onClick={handleAddHabit}>+</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Checklist Modal */}
            {modal.shown && (
                <div className={styles.modalOverlay} onClick={() => setModal({ ...modal, shown: false })}>
                    <div className={styles.modalContent} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <div className={styles.modalTitle}>
                            {modal.monthIndex !== null && MONTHS[modal.monthIndex]} {modal.dayIndex}
                        </div>

                        <div className={styles.checklist}>
                            {habits.length === 0 ? <p style={{ color: '#aaa', textAlign: 'center' }}>No habits configured.</p> : habits.map(h => {
                                const isChecked = modal.selectedIds.includes(h.id);
                                return (
                                    <div
                                        key={h.id}
                                        className={`${styles.checkItem} ${isChecked ? styles.checked : ''}`}
                                        onClick={() => toggleHabitInModal(h.id)}
                                    >
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            border: isChecked ? 'none' : '2px solid rgba(255,255,255,0.3)',
                                            background: isChecked ? 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: '1rem',
                                            transition: 'all 0.2s'
                                        }}>
                                            {isChecked && <span style={{ color: 'white', fontSize: '14px' }}>✓</span>}
                                        </div>
                                        <span className={styles.checkLabel}>{h.text}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <button className={styles.saveBtn} onClick={saveDay}>Save Progress</button>
                    </div>
                </div>
            )}
        </div>
    );
}

