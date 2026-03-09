'use client';

import { useState, useEffect } from 'react';
import styles from './anxiety.module.css';
import Sidebar from '../Sidebar/Sidebar';

const ANXIETY_LEVELS = [
    { level: 3, colorClass: 'high', label: 'High', color: '#f44336' },
    { level: 2, colorClass: 'medium', label: 'Medium', color: '#ff9800' },
    { level: 1, colorClass: 'low', label: 'Low', color: '#ffeb3b' },
    { level: 0, colorClass: 'none', label: 'None', color: '#4caf50' },
];

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

interface SelectedPixel {
    monthIndex: number;
    dayIndex: number;
}

export default function AnxietyPage() {
    const [data, setData] = useState<Record<string, number>>({});
    const [selectedPixel, setSelectedPixel] = useState<SelectedPixel | null>(null); // { monthIndex, dayIndex }
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/anxiety');
                const result = await res.json();
                if (result.success) {
                    setData(result.data);
                }
            } catch (err) {
                console.error("Failed to load anxiety data", err);
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

    const handleLevelSelect = async (level: number) => {
        if (!selectedPixel) return;
        const key = `${selectedPixel.monthIndex}-${selectedPixel.dayIndex}`;
        
        setData(prev => ({ ...prev, [key]: level }));
        setSelectedPixel(null);

        try {
            await fetch('/api/anxiety', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date_key: key, anxiety_level: level })
            });
        } catch (err) {
            console.error("Failed to save anxiety", err);
        }
    };

    // Close popover when clicking outside 
    const handleBackgroundClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains(styles.container) || target.classList.contains(styles.gridContainer)) {
            setSelectedPixel(null);
        }
    };

    const getLevelColorClass = (level: number | undefined) => {
        if (level === undefined) return 'empty';
        switch (level) {
            case 3: return 'high';
            case 2: return 'medium';
            case 1: return 'low';
            case 0: return 'none';
            default: return 'empty';
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
                    <h1 className={styles.title}>Anxiety Tracker 2026</h1>
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
                                        const anxietyLevel = data[key];
                                        const colorClass = styles[getLevelColorClass(anxietyLevel)];

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
                                                    {ANXIETY_LEVELS.map(item => (
                                                        <div
                                                            key={item.level}
                                                            className={`${styles.option} ${styles[item.colorClass]}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleLevelSelect(item.level);
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
                        {ANXIETY_LEVELS.map(item => (
                            <div key={item.level} className={styles.legendItem} title={item.label}>
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

