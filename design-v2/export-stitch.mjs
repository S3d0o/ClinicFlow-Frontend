// Downloads every navy Stitch screen (HTML + screenshot) into design-v2/screens/<area>/<NN-slug>/.
// Usage: node export-stitch.mjs <list_screens.json> <outDir>
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , listFile, outDir] = process.argv;
const { screens } = JSON.parse(readFileSync(listFile, 'utf8'));

// Superseded green drafts and the uploaded design file are not exported.
const skip = new Set([
  'DESIGN.md',
  'ClinicFlow V2 - Landing Page',
  'ClinicFlow - Outpatient Clinic Network Landing Page',
  'ClinicFlow - Patient & Staff Sign In',
]);

const areaPrefixes = [
  ['ClinicFlow Reception - ', 'front-desk'],
  ['ClinicFlow Manager - ', 'manager'],
  ['ClinicFlow Admin - ', 'admin'],
  ['ClinicFlow Doctor - ', 'doctor'],
  ['ClinicFlow Accountant - ', 'accountant'],
  ['ClinicFlow Nurse Station - ', 'nurse'],
];

// Order inside the patient and public areas, following the user journeys.
const order = {
  public: ['Landing Page', 'Sign In', 'Find a Doctor', 'Doctor Profile', 'Join as a Doctor', 'My Application',
    'Staff Sign-in Step 2', 'Staff Two-Step', 'Accept Staff Invitation'],
  patient: ['Patient Sign Up', 'Verify Your Phone', 'Reset Password', 'Set New Password', 'Too Many Attempts',
    'Patient Home', 'Book Step 1', 'Book Step 2', 'Booking Confirmed', 'My Appointments', 'Appointment Details',
    'SMS Visit Reminder', 'My Visits', 'Visit Summary', 'Invoices & Receipts', 'Documents & Insurance',
    'Profile & Settings', 'Notifications'],
};

const slugify = (s) => s.replace(/\(Navy\)/g, '').replace(/&/g, 'and').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function place(screen) {
  const title = screen.title;
  for (const [prefix, area] of areaPrefixes) {
    if (title.startsWith(prefix)) {
      const m = title.slice(prefix.length).match(/^(\d+)\.\s*(.*)$/);
      return { area, index: Number(m[1]), name: m[2] };
    }
  }
  const name = title.replace(/^ClinicFlow - /, '');
  const area = screen.deviceType === 'MOBILE' ? 'patient' : 'public';
  const index = order[area].findIndex((key) => name.includes(key)) + 1;
  if (index === 0) throw new Error(`No order entry for "${title}"`);
  return { area, index, name };
}

async function download(url, file) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${file}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

const index = [];
for (const screen of screens) {
  if (skip.has(screen.title)) continue;
  const { area, index: n, name } = place(screen);
  const dir = join(outDir, 'screens', area, `${String(n).padStart(2, '0')}-${slugify(name)}`);
  mkdirSync(dir, { recursive: true });
  const width = screen.deviceType === 'MOBILE' ? 390 : 1280;
  await download(screen.htmlCode.downloadUrl, join(dir, 'code.html'));
  await download(`${screen.screenshot.downloadUrl}=w${width}`, join(dir, 'screen.png'));
  index.push({ area, n, name: name.replace(/\s*\(Navy\)/, ''), dir: dir.slice(outDir.length + 1).replace(/\\/g, '/'),
    device: screen.deviceType, id: screen.name.split('/').pop() });
  console.log('ok', dir);
}
writeFileSync(join(outDir, 'screens.json'), JSON.stringify(index.sort((a, b) =>
  a.area.localeCompare(b.area) || a.n - b.n), null, 2) + '\n');
console.log('total', index.length);
