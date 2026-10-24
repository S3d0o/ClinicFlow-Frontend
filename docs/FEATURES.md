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

- **Visitors:** a top navbar with Find a doctor, Branches, Services & prices and Join as a doctor, the language toggle, and Sign in / Create account (or "My account" when signed in). Below `lg` the links move into a side sheet. A footer lists the branches.
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
- A page outside the user's permissions shows "You don't have access to this page" with a link home.
- Branch-wide pages (the manager dashboard, reports) need the permission at branch or organization scope; a doctor's right to see their *own* reports doesn't open them.
- Unknown paths show "Page not found". A crash in one page shows "This page couldn't be displayed" with a reload button instead of a blank screen.

## Signing in

**Now (foundation):** the sign-in page lists the demo accounts; choosing one signs in as that user.

**Phase 1** builds the designed flow: one **phone-or-email** field and a password for everyone; staff then enter a two-step code. The account decides where the user lands, so there is no "patient / staff" switch.

### How doctors join (phase 1)

1. **Apply:** "Join as a doctor" (navbar, sign-in page) opens the application: create an account with phone and email (both verified by code), then specialty, license number, years of experience, preferred branch, a CV (required) and a cover letter (optional). The application starts as *Applied*.
2. **Follow it:** the applicant signs in with the same single field and lands on **My application**: the stage, interview details, history, and Withdraw.
3. **Review:** a manager opens **Recruitment**, reviews the CV, and moves the application to *Interview* (date, branch, interviewer, note) and then *Accepted* (start date, branch) or *Rejected* (optional message), seeing each email before it is sent.
4. **Start:** acceptance creates a doctor staff member, active from the start date. The same login then opens the doctor workspace.

## Screens by phase

Every V2 screen is already routed: until its phase lands, it shows a placeholder with the phase number and its design folder.

| Phase | Area | Screens |
|---|---|---|
| 0 | Foundation | Frames, language, navigation, access rules, demo sign-in (done) |
| 1 | Public and account access | Landing, sign in, staff two-step code and setup, accept invitation, patient sign-up, verify phone, reset password (2), too many attempts, find a doctor, doctor profile, join as a doctor, my application |
| 2 | Patient portal | Home with live queue, booking (2 steps + confirmation), my appointments, appointment details, SMS reminder page, visits, visit summary, invoices, documents and insurance, profile and settings, notifications |
| 3 | Front desk and nurse station | Today, patient search and registration, book / walk-in, check-in, queue board, waiting-room TV, checkout, cash session, triage queue, vitals form |
| 4 | Doctor | Today, encounter workspace, patient history, schedule and leave |
| 5 | Manager | Dashboard, services and prices, recruitment, application detail, doctor schedules, leave and reschedule worklist, approvals, daily close, reports |
| 6 | Admin | Overview, staff, staff member, roles and permissions, branches, settings, integrations and templates, audit log, specialties |
| 7 | Finance | Overview, invoices, payers and plans, claims |
