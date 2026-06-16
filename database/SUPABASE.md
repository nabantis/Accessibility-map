## Access

Project URL: https://pqzjivrrcdxlxnazyswh.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxemppdnJyY2R4bHhuYXp5c3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjQ5MzMsImV4cCI6MjA4ODgwMDkzM30.R6z2BBNsKX45a-fzRsx75RI5VbclXjBJEiKMUcDOUrQ

To log into the Supabase dashboard:
Email:
Password:

## Moderator/User Test Account

A moderator account has been setup for testing:
Email: moderator@bham.ac.uk
Password: password123

A regular user account:
Email: user@bham.ac.uk
Password: password123

## Database Setup

The full schema.sql is at the root of the project.
To create the databse from scratch:

1. Create a new Supabase project
2. Run schema.sql in the SQL editor
3. Enable real-time by running the following:
   alter publication supabase_realtime add table public.notifications;
   alter publication supabase_realtime add table public.reports;
   alter publication supabase_realtime add table public.accessibility_features;
