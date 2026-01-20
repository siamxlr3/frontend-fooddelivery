'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    useRecoverEmailMutation,
    useRecoverOTPMutation,
    useRecoverPasswordMutation,
} from '@/store/api/authApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import styles from './forgot-password.module.css';

export default function ForgotPasswordPage() {
    const router = useRouter();

    const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [recoverEmail, { isLoading: isSendingEmail }] = useRecoverEmailMutation();
    const [recoverOTP] = useRecoverOTPMutation();
    const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
    const [recoverPassword, { isLoading: isResettingPassword }] = useRecoverPasswordMutation();

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await recoverEmail({ email }).unwrap();
            setSuccess('OTP sent to your email!');
            setStep('otp');
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to send OTP. Please try again.');
        }
    };

    const handleVerifyOTP = async (e?: React.FormEvent, currentOtp?: string) => {
        e?.preventDefault();
        if (isVerifyingOTP) return;

        const otpToVerify = currentOtp || otp;
        if (otpToVerify.length !== 6) return;

        setIsVerifyingOTP(true);
        setError('');
        setSuccess('');

        try {
            await recoverOTP({ email, otp: otpToVerify }).unwrap();
            setSuccess('OTP verified successfully!');
            setStep('password');
            setIsVerifyingOTP(false);
        } catch (err: any) {
            setError(err?.data?.message || 'Invalid OTP. Please try again.');
            setIsVerifyingOTP(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        try {
            await recoverPassword({ email, otp, password }).unwrap();
            setSuccess('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to reset password. Please try again.');
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <h1 className={styles.title}>Reset Password</h1>
                        <p className={styles.subtitle}>
                            {step === 'email' && 'Enter your email to receive OTP'}
                            {step === 'otp' && 'Enter the OTP sent to your email'}
                            {step === 'password' && 'Create a new password'}
                        </p>
                    </div>

                    {error && (
                        <div className={styles.errorAlert}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className={styles.successAlert}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {success}
                        </div>
                    )}

                    {step === 'email' && (
                        <form onSubmit={handleSendEmail} className={styles.form}>
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

                            <Button type="submit" variant="primary" fullWidth loading={isSendingEmail}>
                                Send OTP
                            </Button>

                            <div className={styles.backToLogin}>
                                <a href="/login">Back to Login</a>
                            </div>
                        </form>
                    )}

                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOTP} className={styles.form}>
                            <Input
                                type="text"
                                label="OTP Code"
                                placeholder="Enter 6-digit code"
                                value={otp}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setOtp(val);
                                    if (val.length === 6) {
                                        handleVerifyOTP(undefined, val);
                                    }
                                }}
                                required
                                fullWidth
                                maxLength={6}
                                icon={
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                }
                                disabled={isVerifyingOTP}
                            />

                            <Button type="submit" variant="primary" fullWidth loading={isVerifyingOTP}>
                                {isVerifyingOTP ? 'Verifying...' : 'Verify OTP'}
                            </Button>
                        </form>
                    )}

                    {step === 'password' && (
                        <form onSubmit={handleResetPassword} className={styles.form}>
                            <Input
                                type="password"
                                label="New Password"
                                placeholder="Enter new password"
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

                            <Input
                                type="password"
                                label="Confirm Password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                fullWidth
                                icon={
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                }
                            />

                            <Button type="submit" variant="primary" fullWidth loading={isResettingPassword}>
                                Reset Password
                            </Button>
                        </form>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
