import React from 'react';
import styles from './Card.module.css';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    glass?: boolean;
    hover?: boolean;
    onClick?: () => void;
    style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    glass = false,
    hover = false,
    onClick,
    style,
}) => {
    const classNames = [
        styles.card,
        glass ? styles.glass : '',
        hover ? styles.hover : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classNames} onClick={onClick} style={style}>
            {children}
        </div>
    );
};

interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
    return <div className={`${styles.header} ${className}`}>{children}</div>;
};

interface CardBodyProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '', style }) => {
    return <div className={`${styles.body} ${className}`} style={style}>{children}</div>;
};

interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
    return <div className={`${styles.footer} ${className}`}>{children}</div>;
};
