'use client';

import { useState, useEffect } from 'react';
import styles from './sleep.module.css';
import Sidebar from '../Sidebar/Sidebar';

const SLEEP_LEVELS = [
    { level: 3, colorClass: 'sleep3', label: '8+ Hours', color: '#311b92' },
    { level: 2, colorClass: 'sleep2', label: '7-8 Hours', color: '#512da8' },
    { level: 1, colorClass: 'sleep1', label: '5-6 Hours', color: '#673ab7' },
    { level: 0, colorClass: 'sleep0', label: '< 5 Hours', color: '#9575cd' },
];

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

interface SelectedPixel {
    monthIndex: number;
    dayIndex: number;
}

export default function SleepPage() {
    const [data, setData] = useState<Record<string, number>>({});
    const [selectedPixel, setSelectedPixel] = useState<SelectedPixel | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSleepData = async () => {
            try {
                const res = await fetch('/api/sleep');
                const result = await res.json();
                if (result.success) {
                    setData(result.data);
                }
            } catch (err) {
                console.error("Failed to load sleep tracker data", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSleepData();
    }, []);

    const getDaysInMonth = (monthIndex: number) => new Date(2026, monthIndex + 1, 0).getDate();

    const handlePixelClick = (monthIndex: number, dayIndex: number) => {
        if (selectedPixel && selectedPixel.monthIndex === monthIndex && selectedPixel.dayIndex === dayIndex) {
            setSelectedPixel(null);
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
            await fetch('/api/sleep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date_key: key, sleep_level: level })
            });
        } catch (err) {
            console.error("Failed to save sleep data", err);
        }
    };

    const handleBackgroundClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains(styles.container) || target.classList.contains(styles.gridContainer)) {
            setSelectedPixel(null);
        }
    };

    const getColorClass = (level: number | undefined) => {
        if (level === undefined) return 'none';
        return `sleep${level}`;
    };

    if (isLoading) {
        return <div className={styles.container}><div className={styles.mainContent}>Loading...</div></div>;
    }

    return (
        <div className={styles.container} onClick={handleBackgroundClick}>
            <Sidebar />
            <div className={styles.mainContent}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Sleep Tracker 2026</h1>
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
                                        const level = data[key];
                                        const colorClass = styles[getColorClass(level)];

                                        if (!isValidDay) return <div key={dIndex} style={{ background: 'transparent' }}></div>;

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
                                                <div className={`${styles.popover} ${isActive ? styles.active : ''}`}>
                                                    {SLEEP_LEVELS.map(item => (
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
                        {SLEEP_LEVELS.map(item => (
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

