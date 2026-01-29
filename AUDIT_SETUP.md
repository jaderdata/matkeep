# Audit System Setup Instructions

## Overview
This document provides instructions for setting up the audit logging system in your Matkeep application.

## What Was Implemented

### 1. Audit Service (`services/auditService.ts`)
- **logAuditActivity()**: Records system activities
- **getRecentAuditLogs()**: Retrieves recent audit logs
- **getActionDisplayName()**: Formats action names for display

### 2. Tracked Activities
The system now tracks:
- ✅ Administrator login
- ✅ Academy settings updates
- ✅ Academy logo changes
- ✅ Password changes
- 🔄 Student creation (to be added)
- 🔄 Student updates (to be added)
- 🔄 Student check-ins (to be added)
- 🔄 Belt/Flag updates (to be added)

### 3. UI Updates
- **Recent Audit Card**: Now displays real-time activity logs
- Shows last 5 activities with timestamps
- Displays user email and action description
- Auto-scrollable list for better UX

## Database Setup

### Step 1: Run the Migration
You need to execute the SQL migration to create the `audit_logs` table in your Supabase database.

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `migrations/create_audit_logs.sql`
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute

**Option B: Using Supabase CLI** (if installed)
```bash
supabase db push
```

**Option C: Using MCP Supabase Server** (if configured)
The migration file is ready at: `c:\Users\hp user\Documents\Dev\Matkeep\migrations\create_audit_logs.sql`

### Step 2: Verify the Table
After running the migration, verify the table was created:

```sql
SELECT * FROM audit_logs LIMIT 5;
```

You should see an empty table with these columns:
- `id` (UUID)
- `academy_id` (UUID)
- `user_email` (TEXT)
- `action` (TEXT)
- `description` (TEXT)
- `metadata` (JSONB)
- `created_at` (TIMESTAMP)

## Testing the System

### Test 1: Login Audit
1. Log out of the application
2. Log back in with your admin credentials
3. Navigate to **Settings**
4. Check the "Recent Audit" card
5. You should see a "Login" entry

### Test 2: Settings Update Audit
1. Go to **Settings**
2. Change any setting (e.g., contact phone)
3. Click **Save Changes**
4. The "Recent Audit" card should update with "Updated Settings"

### Test 3: Logo Update Audit
1. Go to **Settings**
2. Click **Change** under Current Logo
3. Upload a new image
4. The "Recent Audit" card should show "Updated Logo"

### Test 4: Password Change Audit
1. Go to **Settings**
2. Click **Change My Password**
3. Enter new password and confirm
4. Submit the form
5. The "Recent Audit" card should show "Changed Password"

## Next Steps

### Add More Audit Points
You can add audit logging to other parts of the application:

**Example: Student Creation**
```typescript
// In StudentManagement.tsx, after creating a student:
await logAuditActivity(
  academyId,
  'create_student',
  `Created student: ${studentName}`,
  { studentId: newStudent.id }
);
```

**Example: Student Check-in**
```typescript
// In StudentCheckIn.tsx, after check-in:
await logAuditActivity(
  academyId,
  'student_checkin',
  `Student checked in: ${studentName}`,
  { studentId, timestamp: new Date().toISOString() }
);
```

## Troubleshooting

### Issue: "audit_logs table does not exist"
**Solution**: Run the migration SQL in Supabase dashboard

### Issue: "Permission denied for table audit_logs"
**Solution**: Check that RLS policies were created correctly. Re-run the migration.

### Issue: "No audit logs showing"
**Solution**: 
1. Check browser console for errors
2. Verify the academy_id is correct
3. Ensure you're logged in with the correct user

### Issue: "Cannot insert audit log"
**Solution**: 
1. Verify the user has permission to insert
2. Check that academy_id exists in academies table
3. Review RLS policies

## Security Notes

- ✅ Row Level Security (RLS) is enabled
- ✅ Users can only view logs for their own academy
- ✅ Master admin can view all logs
- ✅ Audit logs are immutable (no update/delete policies)
- ✅ Automatic timestamps for all entries

## Performance Considerations

- Indexes are created on `academy_id`, `created_at`, and `user_email`
- Only last 5 logs are displayed by default
- Logs are fetched on page load and after each tracked action
- Consider adding a cleanup job for old logs (e.g., keep last 90 days)

## Future Enhancements

1. **Audit Log Viewer Page**: Dedicated page to view all audit logs with filters
2. **Export Functionality**: Export audit logs to CSV/PDF
3. **Real-time Updates**: Use Supabase Realtime to show live updates
4. **Advanced Filtering**: Filter by date range, action type, user
5. **Retention Policy**: Automatic cleanup of old logs
6. **Audit Alerts**: Notify admins of critical actions

---

**Version**: 1.0.0  
**Last Updated**: January 29, 2026  
**Author**: Antigravity AI
