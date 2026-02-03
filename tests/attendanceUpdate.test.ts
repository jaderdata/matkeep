import { describe, it, expect, vi } from 'vitest';
import { attendanceService } from '../services/attendanceService';

// Mock Supabase
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn().mockResolvedValue({ error: null, data: [] });

// Helper to create a chainable query builder mock
const createQueryBuilder = (returnData: any) => {
    const builder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue({ data: returnData }),
        single: vi.fn().mockResolvedValue({ data: returnData, error: null }),
        insert: mockInsert,
        update: mockUpdate
    };

    // Implement chaining
    builder.select.mockReturnThis();
    builder.eq.mockReturnThis();
    builder.order.mockReturnThis();
    builder.limit.mockReturnThis();

    return builder;
};

// We need to mock the module import
vi.mock('../services/supabase', () => ({
    supabase: {
        from: (table: string) => {
            if (table === 'students') {
                const mockStudent = {
                    id: 'student-123',
                    academy_id: 'academy-1',
                    name: 'Test Student',
                    card_pass_code: '123456',
                    last_attendance: '2020-01-01T00:00:00Z',
                    archived_at: null
                };

                const builder = createQueryBuilder(mockStudent);

                // Custom update mock to change last_attendance in return
                builder.update = (payload: any) => {
                    const updatedStudent = { ...mockStudent, ...payload };
                    // Return a new builder that returns the updated student
                    const updateBuilder = createQueryBuilder(updatedStudent);
                    return updateBuilder;
                };

                return builder;
            }
            if (table === 'attendance') {
                return createQueryBuilder([]);
            }
            return createQueryBuilder(null);
        }
    }
}));

describe('Attendance Service', () => {
    it('should update last_attendance on successful check-in', async () => {
        const result = await attendanceService.registerAttendance('123456', 'academy-1', true);

        expect(result.success).toBe(true);
        expect(result.student).toBeDefined();

        // Verify the returned student has a recent last_attendance
        const lastAttendance = new Date(result.student!.last_attendance!);
        const now = new Date();
        const diff = Math.abs(now.getTime() - lastAttendance.getTime());

        // Should be within last 5 seconds
        expect(diff).toBeLessThan(5000);
    });
});
