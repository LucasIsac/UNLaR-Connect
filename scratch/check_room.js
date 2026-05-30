const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRooms() {
  const { data: rooms, error } = await supabase
    .from('call_rooms')
    .select('*, subject:subjects(name)')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching rooms:", error);
    return;
  }

  console.log("LATEST 5 ROOMS:");
  rooms.forEach(r => {
    console.log(`Room ID: ${r.id}`);
    console.log(`  Subject ID: ${r.subject_id} (${r.subject ? r.subject.name : 'null'})`);
    console.log(`  Status: ${r.status}`);
    console.log(`  Created At: ${r.created_at}`);
  });
}

checkRooms();
