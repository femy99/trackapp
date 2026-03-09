'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './tracker.module.css';
import Sidebar from '../Sidebar/Sidebar';

const MOODS = [
    { level: 5, colorClass: 'mood5', label: 'Amazing', color: '#e91e63' },
    { level: 4, colorClass: 'mood4', label: 'Good', color: '#f06292' },
    { level: 3, colorClass: 'mood3', label: 'Average', color: '#f48fb1' },
    { level: 2, colorClass: 'mood2', label: 'Bad', color: '#f8bbd0' },
    { level: 1, colorClass: 'mood1', label: 'Terrible', color: '#fce4ec' },
];

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

interface SelectedPixel {
    monthIndex: number;
    dayIndex: number;
}

export default function TrackerPage() {
    const [data, setData] = useState<Record<string, number>>({});
    const [selectedPixel, setSelectedPixel] = useState<SelectedPixel | null>(null); // { monthIndex, dayIndex }
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMoods = async () => {
            try {
                const res = await fetch('/api/mood');
                const result = await res.json();
                if (result.success) {
                    setData(result.data);
                }
            } catch (err) {
                console.error("Failed to load moods", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMoods();
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

    const handleMoodSelect = async (level: number) => {
        if (!selectedPixel) return;
        const key = `${selectedPixel.monthIndex}-${selectedPixel.dayIndex}`;
        
        // Optimistic UI update
        setData(prev => ({ ...prev, [key]: level }));
        setSelectedPixel(null);

        // Save to DB
        try {
            await fetch('/api/mood', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date_key: key, mood_level: level })
            });
        } catch (err) {
            console.error("Failed to save mood", err);
        }
    };

    // Close popover when clicking outside 
    const handleBackgroundClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains(styles.container) || target.classList.contains(styles.gridContainer)) {
            setSelectedPixel(null);
        }
    };

    if (isLoading) {
        return <div className={styles.container}><div className={styles.mainContent}>Loading...</div></div>;
    }

    return (
        <div className={styles.container} onClick={handleBackgroundClick}>
            <Sidebar />
            <div className={styles.mainContent}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Year in Pixels 2026</h1>
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
                                        const moodLevel = data[key];
                                        const moodClass = moodLevel ? styles[`mood${moodLevel}`] : styles.mood0;

                                        if (!isValidDay) {
                                            return <div key={dIndex} style={{ background: 'transparent' }}></div>;
                                        }

                                        const isActive = selectedPixel?.monthIndex === mIndex && selectedPixel?.dayIndex === dayNumber;

                                        return (
                                            <div
                                                key={dIndex}
                                                className={`${styles.pixel} ${moodClass}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePixelClick(mIndex, dayNumber);
                                                }}
                                                title={`${month} ${dayNumber}`}
                                            >
                                                {/* Popover for Mood Selection */}
                                                <div className={`${styles.popover} ${isActive ? styles.active : ''}`}>
                                                    {MOODS.map(mood => (
                                                        <div
                                                            key={mood.level}
                                                            className={`${styles.moodOption} ${styles[mood.colorClass]}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMoodSelect(mood.level);
                                                            }}
                                                            title={mood.label}
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

                    {/* Legend on the Right Side */}
                    <div className={styles.legend}>
                        {MOODS.map(mood => (
                            <div key={mood.level} className={styles.legendItem} title={mood.label}>
                                <div className={`${styles.colorBox} ${styles[mood.colorClass]}`}></div>
                                <span className={styles.legendLabel}>{mood.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

