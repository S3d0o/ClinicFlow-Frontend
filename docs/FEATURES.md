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
- **Waiting-room TV and the reminder message page:** full screen, no app chrome.

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
1. First and last name, **Egyptian mobile number** (any local or `+20` form), password with a live checklist (8+ characters, upper and lower case, a number, a symbol), optional email, the language for messages and emails (starts as the UI language), and acceptance of the terms (FR-ACC-01, FR-ACC-06).
2. The **one-time code** (FR-ACC-02), sent by WhatsApp, or by SMS when the number has no WhatsApp and the platform has SMS on: six boxes with autofill and paste, submitted as soon as six digits are in. A wrong code says how many tries are left; after 5 the lockout screen opens. The code lasts 5 minutes (shown counting down) and a new one can be requested after 60 seconds. **Edit number** goes back with the form still filled in (except the password). Verifying signs the patient in.

A number that already has an account gets the same "code sent" answer, so sign-up doesn't reveal who is registered. An email given at sign-up gets a confirmation link.

### Password reset — `/forgot-password`
- **Text me a code** (mobile number) or **Email me a link** (FR-ACC-04). The answer never says whether an account exists.
- By code to the mobile (WhatsApp, or SMS): the code screen (`/forgot-password/verify`, same rules as sign-up), then **Set a new password** (`/reset-password`).
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

## Patient portal (phase 2)

For a signed-in patient (02 §8). Dates and times are the branch's; the status of every appointment is shown as a coloured chip with its name (Confirmed, Checked in, In progress, Completed, Cancelled, Rescheduled, No-show).

### Home — `/patient`
- A greeting by time of day, then **the visit that matters now**: today's appointment, or the next one. Once the patient has checked in it shows the **live queue** (UX_NOTES U3): ticket number, place in line, estimated wait, the doctor's delay if any, and the room once the doctor is ready. It updates live as the desk, the nurse and the doctor move the queue (in the demo the doctors call patients in and finish visits every 20 seconds).
- Call the branch, directions, and the appointment's details. With nothing booked: **Book a visit**.
- Shortcuts (book, prescriptions, invoices) and the other upcoming visits.

### Book — `/patient/book`, then `/patient/book/:doctorId`, then `/patient/booked/:appointmentId`
1. **Choose a doctor** (FR-PAT-01): branch, specialty (one at a time, so the list stays short), service with its starting price and duration, then the doctors who offer it at that branch with their next free time. Everything is in the URL, so a link from the public site or a follow-up lands on the right choice.
2. **Time and review** (FR-APT-02): the next 14 days and their times (taken ones struck through), the price split with the optional deposit (UX_NOTES U4, FR-APT-08), and acceptance of the attendance terms and the 2-hour cancellation rule (FR-PAT-08). The doctor profile's "Continue to book" opens this step with its choices already made. If someone else takes the time first, the patient is told and picks another.
3. **You're booked** (UX_NOTES U1): reference, "Confirmed by Nasr City", date and time in the branch's time, place, fee, **Add to calendar** (`.ics`), directions, call, the optional deposit, and how reminders will arrive (WhatsApp or SMS, email or both, from the profile).

Booking is confirmed at once. A deposit opens Paymob's checkout and comes back to the appointment.

### My appointments — `/patient/appointments`
Upcoming (soonest first) and past (latest first), with counts (FR-PAT-09). Each card shows the date, doctor, service, branch, time, ticket and fee, and the actions allowed now:
- **Reschedule** and **Cancel** while the appointment is Confirmed and more than **2 hours** away ("Free to cancel or reschedule until Thu 4:00 PM"). Later, the card says to call the branch.
- **Leave a review** after a completed visit (once), and **View visit summary** when the doctor has published one.
- A cancelled visit says who cancelled it; a rescheduled one links to its new time.

### Appointment details — `/patient/appointments/:appointmentId`
The live queue and the visit-day steps (check-in, triage, waiting, with the doctor) once checked in; when and what; **Add to calendar**; the branch with call and directions; the fee, any deposit paid and what's left to pay at the desk; **Pay the deposit** if one is offered and unpaid. **Change** opens two sections: a new date and time (the paid deposit moves with it, and the page opens the new appointment), or cancelling with a reason and an optional note. The lists open these sections directly (`?action=reschedule` or `?action=cancel`).

### Reminder message page — `/r/:token`
What the reminder message (WhatsApp or SMS) links to, without signing in (FR-APT-10, UX_NOTES U2): "Your visit is tomorrow at 6:00 PM", the doctor, branch and fee, then **Yes, I'm coming**, **Reschedule** (after signing in) and **Cancel visit** (with confirmation), plus tips for the visit. An unknown or expired link, or a visit that can no longer change, says so. In the demo, the sign-in page links to a sample reminder.

### Records — `/patient/visits`, `/patient/invoices`, `/patient/documents`
Three tabs under the **Records** tab.
- **My visits** (FR-PAT-05): each published visit summary with the doctor, branch, date, number of medicines and tests and the suggested follow-up, filterable by branch. The **visit summary** (`/patient/visits/:visitId`) shows what the doctor found, the medicines (dose, how often, for how long, notes) with the prescription code and **Download prescription (PDF)**, the tests ordered and their status, the doctor's instructions, and the suggested follow-up window with **Book the follow-up** (with the same doctor, service and branch).
- **Invoices and receipts** (FR-PAT-04): open and paid invoices, each with its lines, the total, the deposit and insurance share taken off, payments made and the balance. **Pay online** opens Paymob's checkout (card or mobile wallet) and comes back to the list; invoices and receipts download as PDF.
- **Documents and insurance** (FR-PAT-06, FR-INS-03): insurance cards with the company, member number, validity, coverage and status. **Add an insurance card** takes the company, holder, member number, expiry and a photo of each side; a new card waits for the desk to check it. **My documents** uploads PDFs and photos up to 20 MB from other clinics, to download or remove; only the patient and their treating doctors see them.

### Profile and settings — `/patient/profile`
- Name, record number and since when (FR-ACC-05).
- **Mobile number:** change it with a code sent to the new number; the old one stays until the code is entered. A number another account uses is refused.
- **Email:** add one and confirm it by link (the demo shows the link).
- **Booking confirmations and reminders** by **phone** (WhatsApp, or SMS when the number has no WhatsApp), email or both (FR-NTF-04, backend 06 §9.2). Email needs a confirmed address.
- **Language** for the app and for messages and emails (FR-ACC-06).
- **Medical information** recorded by the clinic (blood type, allergies with severity, long-term conditions), read-only.
- **Change password** and **Sign out**.

### Notifications — `/patient/notifications`
The bell in the top bar shows the unread count, refreshed every minute and on every page change, since notifications arrive a moment after the action that causes them (backend outbox). The inbox groups notifications into today and earlier, filters by appointments, payments and prescriptions, marks one read when it's opened (it goes to what it's about) or all at once. Notifications are written in the patient's language, whatever the app's language.

## Front desk and nurse station (phase 3)

For the receptionist (front desk screens, staff frame) and the nurse (tablet frame), at the branch picked in the branch switcher. An organization-wide user looking at "All branches" is asked to pick one first. Each action needs its permission at that branch (check-in, no-show, booking on behalf, calling in, collecting payment), so a nurse sees the queue board without the checkout. Every front desk screen updates live: a check-in, a triage or a payment on one screen shows on the others (the `/hubs/queue` push; in the demo the doctors also call patients in and finish visits on their own every 20 seconds, since their screens arrive in phase 4).

### Today — `/desk`
- The branch's date, **New booking** and **Walk-in arrival**.
- Four counters (U7): booked today, checked in (share of the day), in the waiting area (waiting for triage or the doctor), no-shows. Cancelled and rescheduled visits don't count.
- **Needs action** (U2, U7): patients past their start time who haven't arrived (with how late), visits the patient hasn't confirmed from the reminder, and finished visits still to pay (with **Collect**).
- **Each doctor's day**, filterable by specialty: doctor, specialty and room, "With a patient" or "On schedule" with visits seen out of the total, then every visit in time order with its status, ticket and what's next: **Check in** (from an hour before the visit, FR-FD-03; before that "Check-in opens at 9:00 AM"), the queue stage once checked in, the room while with the doctor, **Collect EGP 200** once done and unpaid. A walk-in, a patient who confirmed and a paid deposit are marked. **Mark as no-show** appears 15 minutes after the start (FR-APT-07).

### Check-in panel (design front-desk/04)
Opened from a visit's **Check in**. Three steps: confirm the ID matches the record (with the national ID on file) and see whether the phone was verified by a one-time code; the fee, the deposit paid online and **what's due at the desk** (FR-BIL-14); the insurance card on file with its status and cover, or "pays the full fee". **Check in and print ticket** gives the next ticket (per branch per day, lettered by doctor: `A-17`) and puts the patient at the end of the triage line. **Check in and collect** goes on to the checkout. Both stay disabled until the identity box is ticked.

### Patients — `/desk/patients`
- **Find a patient** (FR-FD-01): one box for a name, part of a mobile number (any format), an MRN, a national ID or a date of birth (`yyyy-mm-dd`). Arabic names match whatever alef, ya or ta marbuta was typed. Filters: has a balance, insured. Each result shows the MRN, mobile, age, national ID, insurance, last visit, a portal account and any balance, with **Book a visit** and **Walk-in**. The top bar's search opens this page with its text.
- **Register a new patient** (FR-FD-02): name, mobile, gender and date of birth, optionally the national ID (14 digits) and an emergency contact. While typing, records with **the same mobile, or the same name and date of birth** show as possible duplicates with **Use this patient**; saving anyway is allowed (a family member sharing a phone). The record gets the next MRN; the patient can link a portal account later. **Save and book a visit** goes straight to booking.

### Book / walk-in — `/desk/book`
For a patient picked here or passed in the URL (`?patient=…`): how the booking came in (**phone**, **at the desk**, or **walk-in now**, `?mode=walk-in`), the service by specialty with its starting price at the branch, the doctors who offer it with their next free time (or, for a walk-in, how many patients are waiting for each), then the day and time from the next 14 days. A summary keeps the patient, service, doctor, time and fee in view. A booking is confirmed at once with its source recorded (FR-APT-03). A **walk-in** takes the doctor's next free slot if it starts within 30 minutes, or else joins the queue without a slot, checked in at once with a ticket and the reason for the visit for the nurse (FR-APT-04); a doctor takes at most 5 unslotted walk-ins a day.

### Queue board — `/desk/queue`
The branch's checked-in patients in four columns (FR-FD-04): waiting for triage, ready for the doctor (with the vitals taken), with the doctor (room and minutes in), done (paid, or **Checkout**). Each card shows the ticket, patient, doctor, the wait in the current stage (highlighted from 30 minutes), a late arrival (how late they checked in), a walk-in and any priority reason. Filter by doctor. With `queue.manage`: **Call in** a ready patient (the appointment becomes In progress; a doctor with someone in the room can't get a second, FR-FD-05) and **Move to the front…** with a required reason that is audited. **Open the waiting-room screen** opens the TV view in a new tab.

### Waiting-room screen — `/display/:branchId`
Full screen and dark (FR-FD-06): per doctor, the room, the ticket **now serving** with "Please go to Room 204", the next two tickets, how many are waiting and today's average wait. **No patient names.** The branch clock, a live indicator, the instructions, and how many doctors and patients there are. A newly called ticket is announced to screen readers. It refreshes on every change and every minute. Today it opens with a staff sign-in (`queue.view`); a device token replaces that later.

### Checkout and payments — `/desk/payments`
- **Waiting to pay:** today's checked-in visits with something left to pay, finished ones first, with **Take payment** (`?visit=…`).
- **A visit's checkout** (FR-BIL-01/02/05/14): the patient, ticket, doctor, specialty and room; the services (the booked one, plus any the doctor offers, added at the desk while the invoice is still a draft); the services total, the deposit paid online, what's been paid at the desk, and **what's due now**. The insurance card on file is mentioned; insurer shares come with insurance (P5).
- **Payment:** cash (into the receptionist's drawer), card (POS terminal, with an optional reference) or a mobile wallet. Taking less than the full amount leaves the rest due. Cash shows the change from the amount received, with quick amounts (the exact sum and the next round totals). Cash needs an **open cash session** (the screen links to it). The first payment issues the invoice with the next number (`NC-2026-000415`, FR-BIL-10); after that the services can't change.
- **Receipt:** the change to hand back, the receipt and invoice numbers, what's still due, **Print receipt** (PDF), then **Next patient** or **Take the remaining**.

### Cash session — `/desk/cash`
The receptionist's drawer for the shift (FR-BIL-09): one open session per person, one person per drawer.
- **Open:** choose a free drawer and count the opening float.
- **While open:** the drawer, how long it's been open and by whom; tiles for the float, cash taken, cash refunds and **expected in the drawer** (float + cash − refunds); takings by method (cash, card, wallet) with their share; every receipt and refund in the session; **Print interim report**.
- **Close:** count the banknotes (EGP 200 down to 1), see the variance (over, short or balanced), add a handover note, confirm. A variance above EGP 50 needs a manager's approval (their inbox is phase 5). A closed session can't change; its closing report prints as PDF.

### Triage queue — `/nurse`
On the tablet (design nurse/01): how many are waiting for vitals, a filter by doctor, a search by ticket or name. The **next in line** is highlighted; each patient shows the ticket, name, age and gender, doctor and room, **allergies**, when they checked in and how long they've waited, why they came, and **Start triage**. Beside the list, each doctor's room: free or with a patient (which ticket, for how long) and how many are ready.

### Vitals and triage — `/nurse/triage/:appointmentId`
(FR-EMR-02, U8.) The patient's ticket, age, MRN, check-in time, doctor and room, **allergies with severity**, conditions and blood type. Blood pressure, heart rate, temperature, oxygen saturation and breathing rate, each with its unit, normal range and a **High** or **Low** flag; weight and height with the **BMI worked out**; pain from 0 to 10; the chief complaint (prefilled from the desk). Nothing is required except confirming the allergies with the patient; a value that can't be real (a temperature of 384) must be fixed first. A draft saves itself two seconds after the last change ("Draft saved at 10:23"), or with **Save draft**. **Send to the doctor (Room 201)** records the vitals with who took them and when, and moves the patient to "ready for the doctor".

## Screens by phase

Every V2 screen is already routed: until its phase lands, it shows a placeholder with the phase number and its design folder.

| Phase | Area | Screens |
|---|---|---|
| 0 | Foundation | Frames, language, navigation, access rules (done) |
| 1 | Public and account access | Landing, sign in, staff two-step code and setup, accept invitation, patient sign-up, verify phone, reset password (2), too many attempts, find a doctor, doctor profile, join as a doctor, my application, plus the email-confirmation page (done) |
| 2 | Patient portal | Home with live queue, booking (2 steps + confirmation), my appointments, appointment details, reminder message page, visits, visit summary, invoices, documents and insurance, profile and settings, notifications (done) |
| 3 | Front desk and nurse station | Today, patient search and registration, book / walk-in, check-in, queue board, waiting-room TV, checkout, cash session, triage queue, vitals form (done) |
| 4 | Doctor | Today, encounter workspace, patient history, schedule and leave |
| 5 | Manager | Dashboard, services and prices, recruitment, application detail, doctor schedules, leave and reschedule worklist, approvals, daily close, reports |
| 6 | Admin | Overview, staff, staff member, roles and permissions, branches, settings, integrations and templates, audit log, specialties |
| 7 | Finance | Overview, invoices, payers and plans, claims |
