'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Sidebar.module.css';

const NAV_ITEMS: { label: string; href: string }[] = [
    { label: 'Mood', href: '/tracker' },
    { label: 'Anxiety', href: '/anxiety' },
    { label: 'Workout', href: '/workout' },
    { label: 'Steps', href: '/steps' },
    { label: 'Shower', href: '/shower' },
    { label: 'Habits', href: '/habit' },
    { label: 'Sleep', href: '/sleep' },
    { label: 'Food', href: '/food' },
    { label: 'Journal', href: '/journal' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleSignout = async () => {
        try {
            await fetch('/api/signout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Signout failed', error);
        }
    };

    return (
        <div className={styles.sidebar}>
            <div className={styles.logo}>Health Tracker</div>

            <div className={styles.separator}></div>

            <nav className={styles.nav}>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div style={{ marginTop: 'auto', padding: '1rem' }}>
                <button 
                    onClick={handleSignout} 
                    className={styles.navItem} 
                    style={{ 
                        width: '100%', 
                        background: 'none', 
                        border: 'none', 
                        textAlign: 'left', 
                        cursor: 'pointer',
                        color: 'inherit',
                        fontWeight: 'bold'
                    }}
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
