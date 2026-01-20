import React, { forwardRef } from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: React.ReactNode;
    error?: string;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, fullWidth = false, className = '', ...props }, ref) => {
        const containerClass = [
            styles.container,
            fullWidth ? styles.fullWidth : '',
        ].filter(Boolean).join(' ');

        const inputClass = [
            styles.input,
            error ? styles.error : '',
            icon ? styles.withIcon : '',
            className,
        ].filter(Boolean).join(' ');

        return (
            <div className={containerClass}>
                {label && (
                    <label className={styles.label} htmlFor={props.id}>
                        {label}
                    </label>
                )}
                <div className={styles.inputWrapper}>
                    {icon && <span className={styles.icon}>{icon}</span>}
                    <input ref={ref} className={inputClass} {...props} />
                </div>
                {error && <span className={styles.errorMessage}>{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
