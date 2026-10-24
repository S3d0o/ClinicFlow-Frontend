# ClinicFlow Frontend — Features (V2)

What each kind of user can do in the V2 app and the rules behind it. V2 is built in phases from the Stitch designs in [`design-v2/`](../design-v2/README.md); this file grows with each phase. Progress is tracked in [KNOWN_ISSUES.md](KNOWN_ISSUES.md#v2). V1's features are documented on the `main` branch.

The app runs on sample data until the `/api/v2` endpoints exist (see [DEVELOPMENT.md](DEVELOPMENT.md#2-running-the-app) for the demo accounts).

---

## Roles and home pages

V2 has seven roles (backend `docs/v2/02_ROLES_AND_PERMISSIONS.md`). A role is a bundle of permissions, held at a scope: own records, assigned branches, or the whole organization. **The app checks permissions, never role names**, so a clinic can adjust what each role may do.

| Who | Works in | Home page |
|---|---|---|
| Patient | Patient portal (mobile-first) | `/patient` |
| Doctor applicant (no role) | Public site | `/my-application` |
| Receptionist | Staff workspace: front desk | `/desk` |
| Nurse | Tablet workspace: nurse station | `/nurse` |
| Doctor | Staff workspace: clinical | `/doctor` |
| Manager (organization or branch) | Staff workspace: management (and finance) | `/manager` |
| Accountant (optional) | Staff workspace: finance | `/finance` |
| Admin | Staff workspace: administration | `/admin` |

A user with several roles (an organization manager who is also a doctor) sees every workspace their permissions open; the home page is the first match in the order manager, admin, doctor, receptionist, nurse, accountant, patient.

## Language

Arabic is the default and lays the app out right-to-left; English is one click away in every frame ("EN | عربي"). The choice is remembered. Prices are in EGP with Latin digits in both languages, and times are the branch's local wall-clock time.

## Frames and navigation

- **Visitors:** a top navbar with Find a doctor, Branches, Specialties and Join as a doctor, the language toggle, and Sign in / Create account (or "My account" when signed in). Below `lg` the links move into a side sheet. A footer lists the branches.
- **Sign-in and sign-up pages:** a slim top bar (logo, back to the home page, language) and a centred column.
- **Patient portal:** a top bar with the language toggle and notifications, and a bottom tab bar with Home, Book, Appointments, Records and Profile. From `md` up the tabs move into the top bar.
- **Staff workspaces:** a 260px sidebar (a sheet below `lg`) with the logo, the **branch switcher**, the menu and the user's card (name, role, sign out), plus a top bar with patient search (for users who can open the patient list), language and notifications. The menu shows one group per workspace the user's permissions open: front desk, nurse station, clinical, management, finance, administration, and account (notifications).
- **Nurse station:** a 72px icon rail and large touch targets for tablets, with the branch switcher and the user in the top bar.
- **Waiting-room TV and the SMS reminder page:** full screen, no app chrome.

### Branch switcher

Staff work on one branch at a time. Branch staff see only their branches; organization-wide roles can also pick **All branches**. The choice is remembered.

## Access rules

- Opening a protected page while signed out goes to sign-in, then back to that page once signed in, if the user may open it; otherwise to their home page.
- Signed-in users who open sign-in or sign-up pages go straight on.
- Staff who haven't set up two-step sign-in can only open its setup screen; every staff page sends them there (FR-STF-07).
- A page outside the user's permissions shows "You don't have access to this page" with a link home.
- Branch-wide pages (the manager dashboard, reports) need the permission at branch or organization scope; a doctor's right to see their *own* reports doesn't open them.
- Unknown paths show "Page not found". A crash in one page shows "This page couldn't be displayed" with a reload button instead of a blank screen.

## Public site (phase 1)

### Home — `/`
- **Hero:** what a visit looks like, **Book an appointment** (opens Find a doctor) and **Browse specialties**.
- **Next available:** pick a branch to see the three soonest free times there; each time opens the doctor's profile with that time already chosen.
- **Find a time:** branch, specialty and day (any time, today, tomorrow, this week), opening Find a doctor with those filters.
- **Branches** (`/#branches`): address, phone (tap to call) and **View doctors and book** for each branch.
- **How a visit works**, **Specialties** (`/#specialties`, each opening the search for it), and two cards: one for patients (create an account, or go to my account) and one for doctors (apply).

### Find a doctor — `/doctors`
- **Search** by doctor name or specialty, in Arabic or English, and filter by **branch** (chips), **specialty**, **availability** (today, tomorrow, this week) and **consultation language**. Sort by soonest available, highest rated or lowest price. Filters apply at once; on phones they open in a side sheet.
- The whole search lives in the URL (`?q=&branch=&specialty=&day=&lang=&sort=&page=`), so it can be shared and the home page can link into it. Changing a filter goes back to page 1; 10 doctors per page.
- **Each doctor card:** name, specialty, rating and review count, branches, the lowest consultation price ("From EGP 400"), and the next three free times (the first one highlighted). A time opens the profile with it chosen; **Book** does the same with the soonest time.

### Doctor profile — `/doctors/:doctorId`
- **Header:** name, specialty, rating, license number, years of experience, languages, branches.
- **About** (the bio in the UI language, or the other language when only one was written), **Services & prices** (each service with its duration, and a price range when branches charge differently), **Branches & hours** (weekly hours per branch, Saturday first, with the branch phone), **Reviews** (newest first, 5 per page, filtered by stars; text is shown as the patient wrote it).
- **Booking card:** branch, service (with its price there), a strip of the next 14 days that have slots (days with nothing free are disabled), and the times grouped into morning, afternoon and evening; taken times are struck through. Below: the visit price, an optional **deposit** to pay online (when the service offers one), and what's left to pay at the desk (UX_NOTES U4). **Continue to book** hands the choice to the patient portal's booking screen (phase 2); a visitor signs in or creates an account first and comes back to it.
- Prices come from the clinic's price list: the most specific price valid on the day wins, doctor at the branch, then doctor, then branch, then the organization (FR-SVC-02).

## Accounts (phase 1)

### Sign in — `/sign-in`
- One **mobile-or-email** field and a password for everyone (FR-ACC-03); the account decides what comes next. Patients and applicants are signed in; **staff enter a two-step code** first. Afterwards the user goes back to the page they were trying to open (if theirs) or to their home page.
- Errors never say whether an account exists. **Five wrong passwords lock the account for 15 minutes** and open the lockout screen.
- An account whose phone was never verified gets "Send me a code", which continues the sign-up verification.
- Links to create a patient account and to apply as a doctor; in the demo, the list of sample accounts and a sample staff invitation.

### Two-step sign-in — `/sign-in/verify` (staff)
The 6-digit code from the authenticator app, under the account it's for (with **Change** to go back). **Use a recovery code instead** accepts one of the 8 saved codes, each once. A lost phone is reset by an administrator (FR-STF-07).

### Patient sign-up — `/sign-up`, then `/sign-up/verify`
1. First and last name, **Egyptian mobile number** (any local or `+20` form), password with a live checklist (8+ characters, upper and lower case, a number, a symbol), optional email, the language for SMS and emails (starts as the UI language), and acceptance of the terms (FR-ACC-01, FR-ACC-06).
2. The **SMS code** (FR-ACC-02): six boxes with autofill and paste, submitted as soon as six digits are in. A wrong code says how many tries are left; after 5 the lockout screen opens. The code lasts 5 minutes (shown counting down) and a new one can be requested after 60 seconds. **Edit number** goes back with the form still filled in (except the password). Verifying signs the patient in.

A number that already has an account gets the same "code sent" answer, so sign-up doesn't reveal who is registered. An email given at sign-up gets a confirmation link.

### Password reset — `/forgot-password`
- **Text me a code** (mobile number) or **Email me a link** (FR-ACC-04). The answer never says whether an account exists.
- By SMS: the code screen (`/forgot-password/verify`, same rules as sign-up), then **Set a new password** (`/reset-password`).
- By email: "Check your email"; the link opens `/reset-password?email=…&token=…` and works once, for 24 hours. In the demo, a button opens the link the email would carry.
- The new password follows the same rules as sign-up. Saving signs the user out everywhere and offers **Sign in**.

### Too many attempts — `/locked?until=…`
A countdown to when trying again is allowed, **Back to sign in**, and every branch's phone number (UX_NOTES U10).

### Confirm email — `/confirm-email?userId=…&token=…`
Opened from the confirmation email: confirms on arrival, then **Continue**.

## Staff onboarding (phase 1)

### Accept an invitation — `/invitation/:token`
Shows who invited the person and as what ("Nurse at Nasr City") and when the link expires (72 hours, single use: FR-STF-01). The staff member confirms their name, adds their mobile number and sets a password (sign-up rules, typed twice), accepts the staff policies, and is signed in (FR-STF-02). A used, cancelled or expired link says so.

### Set up two-step sign-in — `/security/setup`
Required for staff before any other screen opens (FR-STF-07): every staff page sends them here until it's done.
1. Install an authenticator app.
2. Scan the QR code, or type the key shown under it (with a copy button).
3. Enter a code from the app.

Alongside, the **8 recovery codes** to download as a text file or copy, and a required "I've saved my recovery codes". Finishing opens the user's workspace.

## Doctor applications (phase 1)

Doctors join by applying; V1's doctor sign-up and admin approval are gone (FR-STF-09).

### Join as a doctor — `/join`
Four steps (FR-REC-01):
1. **Account:** an account with a **verified phone and a confirmed email**. Visitors create an account or sign in and come back; a signed-in user without a confirmed email adds one and opens its confirmation link (the demo shows the link).
2. **Your practice:** specialty, medical license number, years of experience (0–60), preferred branch (optional).
3. **Documents:** a **CV** (required) and an optional cover letter, written (up to 1,000 characters) or uploaded. Files are PDF or DOCX, up to 5 MB.
4. **Review & submit:** everything entered, each with **Edit**. Submitting opens My application.

Someone with an open application is sent to it instead; after a rejection or withdrawal, a new application is possible after **90 days** (FR-REC-06).

### My application — `/my-application`
The applicant's home page (02 §8):
- the reference, specialty, submission date, preferred branch and status;
- a tracker, **Applied → Interview → Accepted**, dated; a rejected or withdrawn application shows where it stopped;
- what to know now: "we received it"; the **interview** (date and time in the branch's time, place, interviewer, notes, **Add to calendar** as an `.ics` file, **Get directions**); acceptance (start date, branch); or the outcome and when they can apply again;
- the **history**, newest first, with whether each stage email went out (FR-REC-04);
- their details, documents (to view), cover letter, and **Withdraw application** (with confirmation) while a decision is pending.

Reviewing applications (moving them to interview, accepted or rejected, with the email preview) is the manager's Recruitment screen, in phase 5.

## Screens by phase

Every V2 screen is already routed: until its phase lands, it shows a placeholder with the phase number and its design folder.

| Phase | Area | Screens |
|---|---|---|
| 0 | Foundation | Frames, language, navigation, access rules (done) |
| 1 | Public and account access | Landing, sign in, staff two-step code and setup, accept invitation, patient sign-up, verify phone, reset password (2), too many attempts, find a doctor, doctor profile, join as a doctor, my application, plus the email-confirmation page (done) |
| 2 | Patient portal | Home with live queue, booking (2 steps + confirmation), my appointments, appointment details, SMS reminder page, visits, visit summary, invoices, documents and insurance, profile and settings, notifications |
| 3 | Front desk and nurse station | Today, patient search and registration, book / walk-in, check-in, queue board, waiting-room TV, checkout, cash session, triage queue, vitals form |
| 4 | Doctor | Today, encounter workspace, patient history, schedule and leave |
| 5 | Manager | Dashboard, services and prices, recruitment, application detail, doctor schedules, leave and reschedule worklist, approvals, daily close, reports |
| 6 | Admin | Overview, staff, staff member, roles and permissions, branches, settings, integrations and templates, audit log, specialties |
| 7 | Finance | Overview, invoices, payers and plans, claims |
