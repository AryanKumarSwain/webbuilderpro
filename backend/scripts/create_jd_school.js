const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_school_saas'
  });

  const email = 'jdinternationaljaipur@gmail.com';
  const plainPass = 'jdinternationaljaipur@gmail.com';
  const hashedPassword = await bcrypt.hash(plainPass, 10);
  const uuid = crypto.randomUUID();

  // 1. Copy structure & modules from School 9
  const [schools] = await connection.query('SELECT * FROM tbl_schools WHERE id = 9');
  let s = schools[0] || {};

  const [res] = await connection.query(`
    INSERT INTO tbl_schools 
    (uuid, name, slug, email, phone, phone2, whatsapp_number, address, city, state, pincode, logo_url, theme, base_theme, selected_modules, status, plan_id, plan_start_date, plan_end_date, storage_used_bytes, is_first_login, terms_accepted_at, terms_version, created_by, created_at, updated_at, map_url, facebook, instagram, youtube, twitter, linkedin, hero_video_url, hero_video_title, intro_message, intro_message_enabled, nav_font, heading_font, welcome_banner_enabled, welcome_banner_url, welcome_banner_link, footer_bg_url, footer_about_text, bg_music_enabled, bg_music_track, affiliation_badges, custom_domain, prospectus_url, school_app_label, school_app_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), ?, 0, NOW(), 1, 1, NOW(), NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    uuid, 
    'J.D. International School', 
    'jd-international-school', 
    email, 
    s.phone || '8947919195',
    s.phone2 || '9414048573',
    s.whatsapp_number || '8947919195',
    s.address || 'Mahapura, Ajmer Road, Jaipur',
    s.city || 'Jaipur',
    s.state || 'Rajasthan',
    s.pincode || '302026',
    s.logo_url || null,
    s.theme || 'blue',
    s.base_theme || 'rose',
    s.selected_modules || '["home","about","fee","courses","faculty","infrastructure","sports","gallery","achievements","alumni","admissionProcedure","bookList","testimonials","disclosure","tc","events","calendar","announcements","circulars","admission","career","contact","settings","results","parentsCorner"]',
    s.storage_used_bytes || 0,
    s.map_url || null,
    s.facebook || null,
    s.instagram || null,
    s.youtube || null,
    s.twitter || null,
    s.linkedin || null,
    s.hero_video_url || null,
    s.hero_video_title || '',
    s.intro_message || '',
    s.intro_message_enabled || 0,
    s.nav_font || 'playfair',
    s.heading_font || 'playfair',
    s.welcome_banner_enabled || 0,
    s.welcome_banner_url || null,
    s.welcome_banner_link || null,
    s.footer_bg_url || null,
    s.footer_about_text || null,
    s.bg_music_enabled || 0,
    s.bg_music_track || null,
    s.affiliation_badges || null,
    'jdis.wbpro.in',
    s.prospectus_url || null,
    s.school_app_label || null,
    s.school_app_url || null
  ]);

  const newSchoolId = res.insertId;

  // 2. Insert into tbl_admins
  await connection.query(`
    INSERT INTO tbl_admins (school_id, name, email, password, created_at, updated_at)
    VALUES (?, ?, ?, ?, NOW(), NOW())
  `, [newSchoolId, 'J.D. International School Admin', email, hashedPassword]);

  // 3. Copy module contents (seeded data: about, sports, fee, etc.)
  const [contents] = await connection.query('SELECT module_key, content, is_published FROM tbl_module_content WHERE school_id = 9');
  for (const c of contents) {
    await connection.query(`
      INSERT INTO tbl_module_content (school_id, module_key, content, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [newSchoolId, c.module_key, c.content, c.is_published]);
  }

  console.log(`\n======================================================`);
  console.log(`✅ Success! Created J.D. International School (ID: ${newSchoolId})!`);
  console.log(`- School Name: J.D. International School`);
  console.log(`- Domain: jdis.wbpro.in`);
  console.log(`- Login Email: ${email}`);
  console.log(`- Password: ${plainPass}`);
  console.log(`- All Seeded Data: Copied from School 9`);
  console.log(`======================================================\n`);
  await connection.end();
}

main().catch(console.error);
