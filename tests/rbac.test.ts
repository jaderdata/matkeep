import { describe, it, expect } from 'vitest';
import { isMaster, isAcademyAdmin } from '../utils';

describe('RBAC Utility Functions', () => {

    describe('isMaster', () => {
        it('should return true if app_metadata.role is master', () => {
            const user = {
                app_metadata: { role: 'master' },
                user_metadata: {},
                email: 'test@example.com'
            };
            expect(isMaster(user)).toBe(true);
        });

        it('should return true if user_metadata.role is master', () => {
            const user = {
                app_metadata: {},
                user_metadata: { role: 'master' },
                email: 'test@example.com'
            };
            expect(isMaster(user)).toBe(true);
        });

        it('should return true for legacy hardcoded email', () => {
            const user = {
                app_metadata: {},
                user_metadata: {},
                email: 'jader_dourado@hotmail.com'
            };
            expect(isMaster(user)).toBe(true);
        });

        it('should return false for regular user', () => {
            const user = {
                app_metadata: { role: 'authenticated' },
                user_metadata: { role: 'instructor' },
                email: 'instructor@example.com'
            };
            expect(isMaster(user)).toBe(false);
        });

        it('should return false for null user', () => {
            expect(isMaster(null)).toBe(false);
        });
    });

    describe('isAcademyAdmin', () => {
        it('should return true for regular authenticated user', () => {
            const user = {
                app_metadata: { role: 'authenticated' },
                user_metadata: {},
                email: 'admin@academy.com'
            };
            expect(isAcademyAdmin(user)).toBe(true);
        });

        it('should return false for master admin', () => {
            const user = {
                app_metadata: { role: 'master' },
                user_metadata: {},
                email: 'master@matkeep.com'
            };
            expect(isAcademyAdmin(user)).toBe(false);
        });

        it('should return false for legacy hardcoded master email', () => {
            const user = {
                app_metadata: {},
                user_metadata: {},
                email: 'jader_dourado@hotmail.com'
            };
            expect(isAcademyAdmin(user)).toBe(false);
        });

        it('should return false for null user', () => {
            expect(isAcademyAdmin(null)).toBe(false);
        });
    });
});
