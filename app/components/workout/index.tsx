'use client';

import { useState, useEffect } from 'react';
import styles from './workout.module.css';
import Sidebar from '../Sidebar/Sidebar';

const WORKOUT_TYPES = [
    { id: 'workout', colorClass: 'workout', label: 'Workout Day', color: '#2196f3' },
    { id: 'rest', colorClass: 'rest', label: 'Rest Day', color: '#9c27b0' },
];

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

interface SelectedPixel {
    monthIndex: number;
    dayIndex: number;
}

export default function WorkoutPage() {
    const [data, setData] = useState<Record<string, string>>({}); // { "monthIndex-day": "workout" | "rest" }
    const [selectedPixel, setSelectedPixel] = useState<SelectedPixel | null>(null); // { monthIndex, dayIndex }
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/workout');
                const result = await res.json();
                if (result.success) {
                    setData(result.data);
                }
            } catch (err) {
                console.error("Failed to load workouts", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // 2026 is not a leap year
    const getDaysInMonth = (monthIndex: number) => {
        return new Date(2026, monthIndex + 1, 0).getDate();
    };

    const handlePixelClick = (monthIndex: number, dayIndex: number) => {
        if (selectedPixel && selectedPixel.monthIndex === monthIndex && selectedPixel.dayIndex === dayIndex) {
            setSelectedPixel(null); // Close if clicking same
        } else {
            setSelectedPixel({ monthIndex, dayIndex });
        }
    };

    const handleTypeSelect = async (typeId: string) => {
        if (!selectedPixel) return;
        const key = `${selectedPixel.monthIndex}-${selectedPixel.dayIndex}`;
        
        // Optimistic UI update
        setData(prev => ({ ...prev, [key]: typeId }));
        setSelectedPixel(null);

        // Save to DB
        try {
            await fetch('/api/workout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date_key: key, type_id: typeId })
            });
        } catch (err) {
            console.error("Failed to save workout", err);
        }
    };

    // Close popover when clicking outside 
    const handleBackgroundClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains(styles.container) || target.classList.contains(styles.gridContainer)) {
            setSelectedPixel(null);
        }
    };

    const getTypeColorClass = (typeId: string | undefined) => {
        if (!typeId) return 'empty';
        return typeId; // 'workout' or 'rest' which matches css class
    };

    if (isLoading) {
        return <div className={styles.container}><div className={styles.mainContent}>Loading...</div></div>;
    }

    return (
        <div className={styles.container} onClick={handleBackgroundClick}>
            <Sidebar />
            <div className={styles.mainContent}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Workout Tracker 2026</h1>
                </div>

                <div className={styles.contentWrapper}>
                    <div className={styles.gridContainer}>
                        {/* Day Headers (1-31) */}
                        <div className={styles.monthLabel}></div> {/* Empty corner */}
                        {Array.from({ length: 31 }, (_, i) => (
                            <div key={i} className={styles.dayHeader}>{i + 1}</div>
                        ))}

                        {/* Rows for Months */}
                        {MONTHS.map((month, mIndex) => {
                            const daysInMonth = getDaysInMonth(mIndex);
                            return (
                                <div key={month} style={{ display: 'contents' }}>
                                    <div className={styles.monthLabel}>{month}</div>
                                    {Array.from({ length: 31 }, (_, dIndex) => {
                                        const dayNumber = dIndex + 1;
                                        const isValidDay = dayNumber <= daysInMonth;
                                        const key = `${mIndex}-${dayNumber}`;
                                        const typeId = data[key];
                                        const colorClass = styles[getTypeColorClass(typeId)];

                                        if (!isValidDay) {
                                            return <div key={dIndex} style={{ background: 'transparent' }}></div>;
                                        }

                                        const isActive = selectedPixel?.monthIndex === mIndex && selectedPixel?.dayIndex === dayNumber;

                                        return (
                                            <div
                                                key={dIndex}
                                                className={`${styles.pixel} ${colorClass}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePixelClick(mIndex, dayNumber);
                                                }}
                                                title={`${month} ${dayNumber}`}
                                            >
                                                {/* Popover for Selection */}
                                                <div className={`${styles.popover} ${isActive ? styles.active : ''}`}>
                                                    {WORKOUT_TYPES.map(item => (
                                                        <div
                                                            key={item.id}
                                                            className={`${styles.option} ${styles[item.colorClass]}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleTypeSelect(item.id);
                                                            }}
                                                            title={item.label}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>

                    <div className={styles.legend}>
                        {WORKOUT_TYPES.map(item => (
                            <div key={item.id} className={styles.legendItem} title={item.label}>
                                <div className={`${styles.colorBox} ${styles[item.colorClass]}`}></div>
                                <span className={styles.legendLabel}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

