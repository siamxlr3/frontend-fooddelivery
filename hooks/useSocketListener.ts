import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { orderApi } from '@/store/api/orderApi';
import { reportApi } from '@/store/api/reportApi';
import type { Order } from '@/store/api/orderApi';
import type { AppDispatch, RootState } from '@/store/store';
import toast from 'react-hot-toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const useSocketListener = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        const socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        // Handle New Order
        socket.on('new_order', (newOrder: Order) => {
            console.log('Socket: New Order', newOrder);

            // Invalidate orders tag to trigger refetch for all pages
            dispatch(orderApi.util.invalidateTags(['Orders']));

            // Show notification if user is KitchenStaff or Admin
            if (user?.role === 'KitchenStaff' || user?.role === 'Admin') {
                // 1. Dispatch Custom Event for UI (Icon Animation)
                window.dispatchEvent(new CustomEvent('new-order-alert', { detail: { order: newOrder } }));

                // 2. Show Popup Message (Toast)
                toast.success(`New Ticket: #${newOrder.orderNumber.slice(-6)} • ${newOrder.type}`, {
                    icon: '🔔',
                    duration: 3000,
                    position: 'top-right',
                    style: {
                        background: 'rgba(20, 20, 20, 0.95)',
                        color: '#fff',
                        border: '1px solid #ef4444',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                        padding: '16px',
                        minWidth: '300px',
                    }
                });

                // 3. Play Sound (AudioContext Oscillator - Reliable Ring)
                const playBeep = () => {
                    try {
                        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
                        if (!AudioContextClass) return;

                        const audioCtx = new AudioContextClass();

                        // Play two beeps for a "ring-ring" effect
                        const ring = (time: number) => {
                            const osc = audioCtx.createOscillator();
                            const gain = audioCtx.createGain();

                            osc.connect(gain);
                            gain.connect(audioCtx.destination);

                            osc.type = 'sine';
                            osc.frequency.setValueAtTime(880, time); // A5 note

                            gain.gain.setValueAtTime(0, time);
                            gain.gain.linearRampToValueAtTime(0.2, time + 0.05);
                            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

                            osc.start(time);
                            osc.stop(time + 0.3);
                        };

                        ring(audioCtx.currentTime);
                        ring(audioCtx.currentTime + 0.4);

                    } catch (e) {
                        console.error('Audio playback failed:', e);
                    }
                };

                playBeep();
            }
        });

        // Handle Status Update
        socket.on('order_status_update', (updatedOrder: Order) => {
            console.log('Socket: Order Update', updatedOrder);

            // Invalidate orders tag
            dispatch(orderApi.util.invalidateTags(['Orders']));

            // Update individual order details view if cached
            dispatch(
                orderApi.util.updateQueryData('getOrderById', updatedOrder.id, (draft) => {
                    Object.assign(draft, updatedOrder);
                })
            );

            // If Paid, Reports are now stale.
            if (updatedOrder.status === 'Paid') {
                dispatch(reportApi.util.invalidateTags(['Reports']));
            }
        });

        // Handle Settings Update
        socket.on('settings_updated', (updatedSettings: Record<string, string>) => {
            console.log('Socket: Settings Updated', updatedSettings);

            // Import settingsApi dynamically to avoid circular dependency
            import('@/store/api/settingsApi').then(({ settingsApi }) => {
                // Update settings cache
                dispatch(
                    settingsApi.util.updateQueryData('getSettings', undefined, () => {
                        return updatedSettings;
                    })
                );

                // Show notification
                toast.success('⚙️ System settings updated!', {
                    duration: 3000,
                    position: 'top-right',
                    style: {
                        background: 'rgba(20, 20, 20, 0.95)',
                        color: '#fff',
                        border: '1px solid #10b981',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                        padding: '16px',
                    }
                });
            });
        });

        // Handle Food Item Discount Update
        socket.on('food_discounts_updated', (updatedFoods: any[]) => {
            console.log('Socket: Food Discounts Updated', updatedFoods);

            // Import menuApi dynamically to avoid circular dependency
            import('@/store/api/menuApi').then(({ menuApi }) => {
                // Invalidate foods tags to trigger refetch
                dispatch(menuApi.util.invalidateTags(['Foods']));

                // Show notification
                toast.success('🏷️ Item discounts updated!', {
                    icon: '🏷️',
                    duration: 3000,
                    position: 'top-right',
                    style: {
                        background: 'rgba(20, 20, 20, 0.95)',
                        color: '#fff',
                        border: '1px solid #10b981',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                        padding: '16px',
                    }
                });
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [dispatch, user]);
};
