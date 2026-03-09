'use client';

import { useState, useEffect } from 'react';
import styles from './steps.module.css';
import globalStyles from '../tracker/tracker.module.css';
import Sidebar from '../Sidebar/Sidebar';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

interface InputData {
    shown: boolean;
    day: number | null;
    val: string | number;
}

export default function StepsPage() {
    const [data, setData] = useState<Record<string, number>>({}); // { "monthIndex-day": steps }
    const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // Default to current month
    const [inputData, setInputData] = useState<InputData>({ shown: false, day: null, val: '' });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSteps = async () => {
            try {
                const res = await fetch('/api/steps');
                const result = await res.json();
                if (result.success) {
                    setData(result.data);
                }
            } catch (err) {
                console.error("Failed to load step tracker data", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSteps();
    }, []);

    const GOAL = 20000;

    const getDaysInMonth = (mIndex: number) => new Date(2026, mIndex + 1, 0).getDate();
    const daysInCurrentMonth = getDaysInMonth(currentMonth);

    const handleBarClick = (day: number, e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percentage = x / width;
        const estimatedSteps = Math.round(percentage * GOAL);

        setInputData({ shown: true, day, val: estimatedSteps });
    };

    const saveSteps = async () => {
        if (inputData.day === null) return;
        const key = `${currentMonth}-${inputData.day}`;
        let finalVal = Number(inputData.val);
        if (finalVal < 0) finalVal = 0;
        if (finalVal > GOAL) finalVal = GOAL;

        setData(prev => ({ ...prev, [key]: finalVal }));
        setInputData({ shown: false, day: null, val: '' });

        try {
            await fetch('/api/steps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date_key: key, step_count: finalVal })
            });
        } catch (err) {
            console.error("Failed to save steps", err);
        }
    };

    if (isLoading) {
        return <div className={styles.container}><div className={styles.mainContent}>Loading...</div></div>;
    }

    return (
        <div className={styles.container}>
            <Sidebar />
            <div className={styles.mainContent}>
                <div className={styles.header}>
                    <h1 className={globalStyles.title}>Step Tracker 2026</h1>
                </div>

                <div className={styles.stepsContainer}>
                    {/* Month Navigation */}
                    <div className={styles.monthNav}>
                        <button
                            className={styles.navBtn}
                            onClick={() => setCurrentMonth(p => Math.max(0, p - 1))}
                            disabled={currentMonth === 0}
                        >
                            &larr; Prev
                        </button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{MONTHS[currentMonth]}</h2>
                        <button
                            className={styles.navBtn}
                            onClick={() => setCurrentMonth(p => Math.min(11, p + 1))}
                            disabled={currentMonth === 11}
                        >
                            Next &rarr;
                        </button>
                    </div>

                    {/* Scale Header */}
                    <div className={styles.scaleLabels}>
                        <span>0</span>
                        <span>5k</span>
                        <span>10k</span>
                        <span>15k</span>
                        <span>20k</span>
                    </div>

                    {/* Rows for Days */}
                    {Array.from({ length: daysInCurrentMonth }, (_, i) => {
                        const dayNum = i + 1;
                        const key = `${currentMonth}-${dayNum}`;
                        const steps = data[key] || 0;
                        const widthPct = (steps / GOAL) * 100;

                        return (
                            <div key={dayNum} className={styles.stepRow}>
                                <div className={styles.dayLabel}>{dayNum}</div>
                                <div
                                    className={styles.trackBar}
                                    onClick={(e) => handleBarClick(dayNum, e)}
                                    title={`Day ${dayNum}: ${steps} steps`}
                                >
                                    <div className={styles.ticks}>
                                        <div className={styles.tick} style={{ left: '25%' }}></div>
                                        <div className={styles.tick} style={{ left: '50%' }}></div>
                                        <div className={styles.tick} style={{ left: '75%' }}></div>
                                    </div>
                                    <div
                                        className={styles.fill}
                                        style={{ width: `${widthPct}%`, background: '#ff9800' }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Input Modal */}
            {inputData.shown && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }} onClick={() => setInputData({ shown: false, day: null, val: '' })}>
                    <div style={{
                        background: '#24243e', padding: '2rem', borderRadius: '12px',
                        display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '300px'
                    }} onClick={e => e.stopPropagation()}>
                        <h3>enter steps for {MONTHS[currentMonth]} {inputData.day}</h3>
                        <input
                            type="number"
                            value={inputData.val}
                            onChange={e => setInputData(p => ({ ...p, val: e.target.value }))}
                            className={globalStyles.input}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white' }}
                            autoFocus
                        />
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setInputData({ shown: false, day: null, val: '' })} style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={saveSteps} style={{ padding: '0.5rem 1rem', background: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

