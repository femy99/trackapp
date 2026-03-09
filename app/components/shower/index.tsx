'use client';

import { useState, useEffect } from 'react';
import styles from './shower.module.css';
import Sidebar from '../Sidebar/Sidebar';

const SHOWER_TYPES = [
    { id: 'full', colorClass: 'full', label: 'Full Wash', color: '#0d47a1' },
    { id: 'hair', colorClass: 'hair', label: 'Hair Wash', color: '#1976d2' },
    { id: 'normal', colorClass: 'normal', label: 'Normal Shower', color: '#42a5f5' },
    { id: 'not_bathed', colorClass: 'not_bathed', label: 'Not Bathed', color: '#546e7a' },
];

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

interface SelectedPixel {
    monthIndex: number;
    dayIndex: number;
}

export default function ShowerPage() {
    const [data, setData] = useState<Record<string, string>>({}); // { "monthIndex-day": typeId }
    const [selectedPixel, setSelectedPixel] = useState<SelectedPixel | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/shower');
                const result = await res.json();
                if (result.success) {
                    setData(result.data);
                }
            } catch (err) {
                console.error("Failed to load shower data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const getDaysInMonth = (monthIndex: number) => {
        return new Date(2026, monthIndex + 1, 0).getDate();
    };

    const handlePixelClick = (monthIndex: number, dayIndex: number) => {
        if (selectedPixel && selectedPixel.monthIndex === monthIndex && selectedPixel.dayIndex === dayIndex) {
            setSelectedPixel(null);
        } else {
            setSelectedPixel({ monthIndex, dayIndex });
        }
    };

    const handleTypeSelect = async (typeId: string) => {
        if (!selectedPixel) return;
        const key = `${selectedPixel.monthIndex}-${selectedPixel.dayIndex}`;
        
        setData(prev => ({ ...prev, [key]: typeId }));
        setSelectedPixel(null);

        try {
            await fetch('/api/shower', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date_key: key, shower_type: typeId })
            });
        } catch (err) {
            console.error("Failed to save shower", err);
        }
    };

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
                    <h1 className={styles.title}>Shower Tracker 2026</h1>
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
                                        const dayNum = dIndex + 1;
                                        const isValidDay = dayNum <= daysInMonth;
                                        const key = `${mIndex}-${dayNum}`;
                                        const typeId = data[key];
                                        const colorClass = styles[typeId] || styles.none;

                                        if (!isValidDay) {
                                            return <div key={dIndex} style={{ background: 'transparent' }}></div>;
                                        }

                                        const isActive = selectedPixel?.monthIndex === mIndex && selectedPixel?.dayIndex === dayNum;

                                        return (
                                            <div
                                                key={dIndex}
                                                className={`${styles.pixel} ${colorClass}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePixelClick(mIndex, dayNum);
                                                }}
                                                title={`${month} ${dayNum}`}
                                            >
                                                <div className={`${styles.popover} ${isActive ? styles.active : ''}`}>
                                                    {SHOWER_TYPES.map(item => (
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
                        {SHOWER_TYPES.map(item => (
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

