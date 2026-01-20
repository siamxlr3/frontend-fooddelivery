'use client';

import React, { useState, useEffect } from 'react';
import styles from './NotificationBell.module.css';

export function NotificationBell() {
    const [isRinging, setIsRinging] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        const handleNewOrder = (event: any) => {
            console.log('Bell: New order animation triggered');
            setIsRinging(true);
            setHasUnread(true);

            // Wait for animation to finish
            setTimeout(() => {
                setIsRinging(false);
            }, 3000);
        };

        window.addEventListener('new-order-alert', handleNewOrder);
        return () => window.removeEventListener('new-order-alert', handleNewOrder);
    }, []);

    const handleClick = () => {
        setHasUnread(false);
    };

    return (
        <div className={styles.container} onClick={handleClick}>
            <div className={`${styles.bellWrapper} ${isRinging ? styles.ring : ''}`}>
                <span className={styles.icon}>🔔</span>
                {hasUnread && <span className={styles.badge} />}
            </div>
            {isRinging && <div className={styles.pulse} />}
        </div>
    );
}
