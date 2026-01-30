import { describe, it, expect } from 'vitest';
import { FlagStatus } from '../types';

/**
 * Business Logic: Attendance Flag Calculation
 * 
 * Rules:
 * - Green flag: Last attendance within yellowFlagDays
 * - Yellow flag: Last attendance between yellowFlagDays and redFlagDays
 * - Red flag: Last attendance beyond redFlagDays or never attended
 */

interface FlagSettings {
    yellowFlagDays: number;
    redFlagDays: number;
}

export function calculateAttendanceFlag(
    lastAttendance: string | null,
    settings: FlagSettings
): FlagStatus {
    if (!lastAttendance) {
        return FlagStatus.VERMELHA;
    }

    const lastDate = new Date(lastAttendance);
    const today = new Date();
    const daysSinceLastAttendance = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastAttendance <= settings.yellowFlagDays) {
        return FlagStatus.VERDE;
    } else if (daysSinceLastAttendance <= settings.redFlagDays) {
        return FlagStatus.AMARELA;
    } else {
        return FlagStatus.VERMELHA;
    }
}

describe('Attendance Flag Calculation', () => {
    const defaultSettings: FlagSettings = {
        yellowFlagDays: 7,
        redFlagDays: 14,
    };

    it('should return green flag for recent attendance', () => {
        const today = new Date();
        const recentDate = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
        const flag = calculateAttendanceFlag(recentDate.toISOString(), defaultSettings);
        expect(flag).toBe(FlagStatus.VERDE);
    });

    it('should return yellow flag for moderate absence', () => {
        const today = new Date();
        const moderateDate = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
        const flag = calculateAttendanceFlag(moderateDate.toISOString(), defaultSettings);
        expect(flag).toBe(FlagStatus.AMARELA);
    });

    it('should return red flag for long absence', () => {
        const today = new Date();
        const oldDate = new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000); // 20 days ago
        const flag = calculateAttendanceFlag(oldDate.toISOString(), defaultSettings);
        expect(flag).toBe(FlagStatus.VERMELHA);
    });

    it('should return red flag for null attendance', () => {
        const flag = calculateAttendanceFlag(null, defaultSettings);
        expect(flag).toBe(FlagStatus.VERMELHA);
    });

    it('should handle custom settings correctly', () => {
        const customSettings: FlagSettings = {
            yellowFlagDays: 3,
            redFlagDays: 7,
        };

        const today = new Date();
        const fiveDaysAgo = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
        const flag = calculateAttendanceFlag(fiveDaysAgo.toISOString(), customSettings);
        expect(flag).toBe(FlagStatus.AMARELA);
    });

    it('should return green flag for attendance on boundary (yellowFlagDays)', () => {
        const today = new Date();
        const boundaryDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // exactly 7 days
        const flag = calculateAttendanceFlag(boundaryDate.toISOString(), defaultSettings);
        expect(flag).toBe(FlagStatus.VERDE);
    });
});
