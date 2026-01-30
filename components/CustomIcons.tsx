import React from 'react';

interface IconProps {
    size?: number;
    className?: string;
}

// Dashboard Icon - Simple 4 squares
export const DashboardIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="4" y="4" width="7" height="7" fill="currentColor" />
        <rect x="13" y="4" width="7" height="7" fill="currentColor" />
        <rect x="4" y="13" width="7" height="7" fill="currentColor" />
        <rect x="13" y="13" width="7" height="7" fill="currentColor" />
    </svg>
);

// Students Icon - Simple two person silhouettes
export const StudentsIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="9" cy="7" r="3" fill="currentColor" />
        <path d="M3 19v2h12v-2c0-2.5-2.5-5-6-5s-6 2.5-6 5z" fill="currentColor" />
        <circle cx="16" cy="8" r="2" fill="currentColor" />
        <path d="M21 19v2h-6v-1c0-1.5-0.5-2.8-1.3-3.8 1-.7 2.3-1.2 3.3-1.2 2 0 4 1.5 4 4z" fill="currentColor" />
    </svg>
);

// Student Registration Icon - Person with plus
export const StudentRegistrationIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="9" cy="7" r="3" fill="currentColor" />
        <path d="M3 19v2h12v-2c0-2.5-2.5-5-6-5s-6 2.5-6 5z" fill="currentColor" />
        <path d="M18 7h3M19.5 5.5v3" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
);

// Calendar Icon - Simple calendar grid
export const CalendarIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="4" y="5" width="16" height="15" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="4" y="5" width="16" height="4" fill="currentColor" />
        <line x1="8" y1="3" x2="8" y2="7" stroke="currentColor" strokeWidth="2" />
        <line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" strokeWidth="2" />
    </svg>
);

// Check-In Icon - Simple QR pattern
export const CheckInIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="4" y="4" width="6" height="6" fill="currentColor" />
        <rect x="14" y="4" width="6" height="6" fill="currentColor" />
        <rect x="4" y="14" width="6" height="6" fill="currentColor" />
        <rect x="14" y="14" width="2.5" height="2.5" fill="currentColor" />
        <rect x="17.5" y="14" width="2.5" height="2.5" fill="currentColor" />
        <rect x="14" y="17.5" width="2.5" height="2.5" fill="currentColor" />
        <rect x="17.5" y="17.5" width="2.5" height="2.5" fill="currentColor" />
    </svg>
);

// Reports Icon - Simple document with lines
export const ReportsIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M6 3h12v18H6V3z" fill="currentColor" />
        <rect x="9" y="7" width="6" height="1.5" fill="white" />
        <rect x="9" y="10" width="6" height="1.5" fill="white" />
        <rect x="9" y="13" width="4" height="1.5" fill="white" />
    </svg>
);

// Settings Icon - Simple gear
export const SettingsIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <rect x="11" y="3" width="2" height="5" fill="currentColor" />
        <rect x="11" y="16" width="2" height="5" fill="currentColor" />
        <rect x="3" y="11" width="5" height="2" fill="currentColor" />
        <rect x="16" y="11" width="5" height="2" fill="currentColor" />
        <rect x="6" y="6" width="2" height="3.5" fill="currentColor" transform="rotate(-45 7 7.5)" />
        <rect x="16" y="16" width="2" height="3.5" fill="currentColor" transform="rotate(-45 17 17.5)" />
        <rect x="16" y="6" width="2" height="3.5" fill="currentColor" transform="rotate(45 17 7.5)" />
        <rect x="6" y="16" width="2" height="3.5" fill="currentColor" transform="rotate(45 7 17.5)" />
    </svg>
);

// Attendance Icon - Calendar with checkmark
export const AttendanceIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="4" y="5" width="16" height="15" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="4" y="5" width="16" height="4" fill="currentColor" />
        <line x1="8" y1="3" x2="8" y2="7" stroke="currentColor" strokeWidth="2" />
        <line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" strokeWidth="2" />
        <path d="M8 14l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="square" fill="none" />
    </svg>
);

// Churn Risk Icon - Trending down arrow
export const ChurnRiskIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M4 8l8 8 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" fill="none" />
        <path d="M4 14l8 8 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" fill="none" />
    </svg>
);

// Performance Icon - Podium/ranking
export const PerformanceIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="6" r="3" fill="currentColor" />
        <path d="M6 21v-8h12v8z" fill="currentColor" />
        <rect x="8" y="11" width="8" height="2" fill="currentColor" />
    </svg>
);

// Activity Icon - Shield
export const ActivityIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 3l8 3v6c0 5-3.5 8-8 11-4.5-3-8-6-8-11V6l8-3z" fill="currentColor" />
    </svg>
);

// Total Students Icon - Single person
export const TotalStudentsIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="8" r="4" fill="currentColor" />
        <path d="M5 20v2h14v-2c0-3-3-6-7-6s-7 3-7 6z" fill="currentColor" />
    </svg>
);

// Active Students Icon - Person with checkmark
export const ActiveStudentsIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="10" cy="8" r="3.5" fill="currentColor" />
        <path d="M4 20v2h12v-2c0-2.5-2.5-5-6-5s-6 2.5-6 5z" fill="currentColor" />
        <path d="M17 8l2 2 3-4" stroke="currentColor" strokeWidth="2" strokeLinecap="square" fill="none" />
    </svg>
);

// Inactive Students Icon - Person with X
export const InactiveStudentsIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="10" cy="8" r="3.5" fill="currentColor" />
        <path d="M4 20v2h12v-2c0-2.5-2.5-5-6-5s-6 2.5-6 5z" fill="currentColor" />
        <path d="M17 6l4 4M21 6l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
);

// Average Attendance Icon - Chart trending up
export const AvgAttendanceIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M4 18l4-4 4 4 8-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" fill="none" />
        <path d="M20 6v6h-6" fill="currentColor" />
    </svg>
);

// Yellow Flag Icon - Warning triangle
export const YellowFlagIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 3l9 16H3L12 3z" fill="currentColor" />
        <rect x="11" y="9" width="2" height="5" fill="white" />
        <rect x="11" y="15" width="2" height="2" fill="white" />
    </svg>
);

// Red Flag Icon - Alert triangle (filled)
export const RedFlagIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 3l9 16H3L12 3z" fill="currentColor" />
        <rect x="11" y="8" width="2" height="6" fill="white" />
        <circle cx="12" cy="16" r="1" fill="white" />
    </svg>
);

export default {
    DashboardIcon,
    StudentsIcon,
    StudentRegistrationIcon,
    CalendarIcon,
    CheckInIcon,
    ReportsIcon,
    SettingsIcon,
    AttendanceIcon,
    ChurnRiskIcon,
    PerformanceIcon,
    ActivityIcon,
    TotalStudentsIcon,
    ActiveStudentsIcon,
    InactiveStudentsIcon,
    AvgAttendanceIcon,
    YellowFlagIcon,
    RedFlagIcon,
};
