'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginMutation, useVerifyOTPMutation } from '@/store/api/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, CardBody } from '@/components/ui/Card';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();
    const dispatch = useDispatch();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [error, setError] = useState('');
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const [resendTimer, setResendTimer] = useState(0);

    const [login, { isLoading: isLoggingIn }] = useLoginMutation();
    const [verifyOTP] = useVerifyOTPMutation();
    const [isVerifying, setIsVerifying] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await login({ email, password }).unwrap();
            setShowOtpModal(true);
            startResendTimer();
        } catch (err: any) {
            setError(err?.data?.message || 'Login failed. Please try again.');
        }
    };

    const handleVerifyOTP = async (e?: React.FormEvent, currentOtp?: string) => {
        e?.preventDefault();
        if (isVerifying) return;

        const otpToVerify = currentOtp || otp;
        if (otpToVerify.length !== 6) return;

        setIsVerifying(true);
        setError('');

        try {
            const result = await verifyOTP({ email, otp: otpToVerify }).unwrap();
            dispatch(setCredentials({ user: result.user, token: result.token }));

            // Redirect based on role
            const dashboardRoutes = {
                Admin: '/dashboard/admin',
                Cashier: '/dashboard/cashier',
                Waiter: '/dashboard/waiter',
                KitchenStaff: '/dashboard/kitchen',
            };

            await router.push(dashboardRoutes[result.user.role as keyof typeof dashboardRoutes]);
            // Note: We don't set setIsVerifying(false) here to keep loader shown until page change
        } catch (err: any) {
            setError(err?.data?.message || 'OTP verification failed. Please try again.');
            setIsVerifying(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtpValues = [...otpValues];
        newOtpValues[index] = value.slice(-1);
        setOtpValues(newOtpValues);
        const newOtp = newOtpValues.join('');
        setOtp(newOtp);

        // Auto focus next
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }

        // Auto submit when all digits are filled
        if (newOtp.length === 6) {
            handleVerifyOTP(undefined, newOtp);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(data)) return;

        const newOtpValues = [...otpValues];
        data.split('').forEach((char, idx) => {
            if (idx < 6) newOtpValues[idx] = char;
        });
        setOtpValues(newOtpValues);
        const newOtp = newOtpValues.join('');
        setOtp(newOtp);

        // Focus last filled or last input
        const lastIdx = Math.min(data.length, 5);
        document.getElementById(`otp-${lastIdx}`)?.focus();

        if (newOtp.length === 6) {
            handleVerifyOTP(undefined, newOtp);
        }
    };

    const startResendTimer = () => {
        setResendTimer(30);
        const timer = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleResendOTP = async () => {
        if (resendTimer > 0) return;
        try {
            await login({ email, password }).unwrap();
            startResendTimer();
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to resend OTP');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.background}>
                <div className={styles.shape}></div>
                <div className={styles.shape}></div>
            </div>

            <Card glass className={styles.card}>
                <CardBody>
                    <div className={styles.header}>
                        <div className={styles.logo}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h1 className={styles.title}>Restaurant POS</h1>
                        <p className={styles.subtitle}>Sign in to your account</p>
                    </div>

                    <form onSubmit={handleLogin} className={styles.form}>
                        {error && (
                            <div className={styles.errorAlert}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <Input
                            type="email"
                            label="Email Address"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            fullWidth
                            icon={
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            }
                        />

                        <Input
                            type="password"
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            fullWidth
                            icon={
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            }
                        />

                        <div className={styles.forgotPassword}>
                            <a href="/forgot-password">Forgot password?</a>
                        </div>

                        <Button type="submit" variant="primary" fullWidth loading={isLoggingIn}>
                            Sign In
                        </Button>

                        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-md)' }}>
                            <span style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                                Don't have an account?{' '}
                            </span>
                            <a
                                href="/register"
                                style={{
                                    color: 'var(--primary-600)',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    textDecoration: 'none'
                                }}
                            >
                                Create Account
                            </a>
                        </div>
                    </form>
                </CardBody>
            </Card>

            {/* OTP Verification Modal */}
            <Modal
                isOpen={showOtpModal}
                onClose={() => setShowOtpModal(false)}
                title="Secure Verification"
                size="sm"
            >
                <form onSubmit={handleVerifyOTP} className={styles.otpForm}>
                    <div className={styles.otpHeader}>
                        <p className={styles.otpMessage}>
                            We've sent a 6-digit code to <br />
                            <strong>{email}</strong>
                        </p>
                    </div>

                    <div className={styles.otpInputContainer} onPaste={handlePaste}>
                        {otpValues.map((value, index) => (
                            <input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                className={`${styles.otpInput} ${isVerifying ? styles.verifying : ''}`}
                                value={value}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                maxLength={1}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                disabled={isVerifying}
                            />
                        ))}
                    </div>

                    <div className={styles.resendContainer}>
                        {resendTimer > 0 ? (
                            <span className={styles.resendText}>
                                Resend code in <strong>{resendTimer}s</strong>
                            </span>
                        ) : (
                            <span className={styles.resendText}>
                                Didn't receive code?
                                <button
                                    type="button"
                                    className={styles.resendButton}
                                    onClick={handleResendOTP}
                                    disabled={resendTimer > 0 || isLoggingIn}
                                >
                                    {isLoggingIn ? 'Sending...' : 'Resend OTP'}
                                </button>
                            </span>
                        )}
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        loading={isVerifying}
                        disabled={otp.length !== 6 || isVerifying}
                    >
                        {isVerifying ? 'Authenticating...' : 'Verify & Sign In'}
                    </Button>
                </form>
            </Modal>
        </div>
    );

}
