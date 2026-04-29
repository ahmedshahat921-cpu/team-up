import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ntnhmsgmahsdvbrjjvzk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50bmhtc2dtYWhzZHZicmpqdnprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA2NDA3NywiZXhwIjoyMDkyNjQwMDc3fQ.vaOGexcVugaXg3VJ39LoZ5lgZbH0Q4HWtVyA2D6_iCA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const users = [
    { reg_number: '100000001', role: 'admin', full_name: 'Admin User 1' },
    { reg_number: '100000002', role: 'admin', full_name: 'Admin User 2' },
    { reg_number: '200000001', role: 'employee', full_name: 'Employee User 1' },
    { reg_number: '200000002', role: 'employee', full_name: 'Employee User 2' },
    { reg_number: '300000001', role: 'student', full_name: 'Student User 1' },
    { reg_number: '300000002', role: 'student', full_name: 'Student User 2' }
  ];

  const password_hash = await bcrypt.hash('123456', 12);

  for (const u of users) {
    // Also create university record to allow future login/register stuff if it checks there
    await supabase.from('university_records').upsert({
      reg_number: u.reg_number,
      full_name: u.full_name,
      department: 'Computer Science',
      university: 'AASTMT'
    });

    const prefix = u.reg_number.substring(0, 2);
    const batch_year = `20${prefix}`;

    // Delete existing
    await supabase.from('users').delete().eq('reg_number', u.reg_number);

    // Insert user
    const { data, error } = await supabase.from('users').insert({
      reg_number: u.reg_number,
      password_hash,
      full_name: u.full_name,
      role: u.role,
      department: 'Computer Science',
      university: 'AASTMT',
      batch_year,
      email: `${u.reg_number}@student.aast.edu`
    });
    if (error) {
      console.log(`Error inserting ${u.reg_number}:`, error);
    } else {
      console.log(`Inserted ${u.reg_number}`);
    }
  }
}

seed();
