import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { fixClock } from '@/test/clock';
import { renderApp } from '@/test/render-app';

const DOCTOR = 'u-ahmed';

/** Adds a diagnosis by searching ICD-10. */
async function addDiagnosis(query: string, title: RegExp) {
  await userEvent.type(screen.getByRole('searchbox', { name: 'Search ICD-10 by code or words' }), query);
  await userEvent.click(await within(await screen.findByRole('list', { name: 'Matching codes' })).findByRole('button', { name: title }));
}

describe("the doctor's day (05 §4.1)", () => {
  fixClock();

  it('shows the patient in the room, who is next with their vitals and allergies, and the notes to sign', async () => {
    renderApp({ path: '/doctor', signedInAs: DOCTOR });
    expect(await screen.findByRole('heading', { level: 1, name: 'Today' })).toBeInTheDocument();
    expect(await screen.findByText('With you now: Nadia Soliman')).toBeInTheDocument();

    const next = screen.getByRole('region', { name: 'Sameh Mahmoud' });
    expect(within(next).getByText('New patient, shortness of breath')).toBeInTheDocument();
    expect(within(next).getByText('No known allergies')).toBeInTheDocument();
    expect(within(next).getByText('125/80')).toBeInTheDocument();
    // One patient in the room at a time
    expect(within(next).getByRole('button', { name: 'Call to Room 204' })).toBeDisabled();

    const unsigned = screen.getByRole('region', { name: 'Notes to sign' });
    expect(await within(unsigned).findByText('Hassan Ali')).toBeInTheDocument();
  });

  it('signs the visit in the room, then calls the next patient into their encounter', async () => {
    renderApp({ path: '/doctor/encounters/apt-d-a3', signedInAs: DOCTOR });
    expect(await screen.findByRole('heading', { level: 1, name: 'Nadia Soliman' })).toBeInTheDocument();

    // Signing needs a diagnosis first
    await userEvent.click(screen.getByRole('button', { name: 'Sign & complete visit' }));
    expect(screen.getByText('No diagnosis yet. At least one is needed to sign.')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    await addDiagnosis('I10', /Essential \(primary\) hypertension/);
    expect(screen.getByText('Primary')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sign & complete visit' }));
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Sign' }));
    expect(await screen.findByText("Note signed. Nadia Soliman's visit is complete.")).toBeInTheDocument();

    // Back on Today, the room is free
    const next = await screen.findByRole('region', { name: 'Sameh Mahmoud' });
    const call = within(next).getByRole('button', { name: 'Call to Room 204' });
    expect(call).toBeEnabled();
    await userEvent.click(call);
    expect(await screen.findByRole('heading', { level: 1, name: 'Sameh Mahmoud' })).toBeInTheDocument();
    expect(await screen.findByText('Sameh Mahmoud has been called in.')).toBeInTheDocument();
  });
});

describe('the encounter workspace (FR-EMR-03…05)', () => {
  fixClock();

  it('autosaves the notes and applies a template to the empty sections only', async () => {
    renderApp({ path: '/doctor/encounters/apt-d-a3', signedInAs: DOCTOR });
    const assessment = await screen.findByRole('textbox', { name: 'Assessment' });
    await userEvent.type(assessment, 'Benign palpitations');
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(await screen.findByText(/^Saved at/, undefined, { timeout: 10_000 })).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: 'Chest pain / palpitations' }));
    expect(assessment).toHaveValue('Benign palpitations');
    expect(screen.getByRole('textbox', { name: 'Objective (examination)' })).not.toHaveValue('');
  });

  it('flags a medicine the patient is allergic to until the doctor gives a reason', async () => {
    renderApp({ path: '/doctor/encounters/apt-today', signedInAs: DOCTOR });
    expect(await screen.findByText(/hasn't been called in yet/)).toBeInTheDocument();

    const add = screen.getByRole('form', { name: 'Add a medicine' });
    await userEvent.type(within(add).getByRole('textbox', { name: /Medicine/ }), 'Augm');
    await userEvent.click(await within(add).findByRole('button', { name: /Augmentin/ }));
    expect(within(add).getByRole('alert')).toHaveTextContent('Allergy warning: the patient is allergic to Penicillin.');
    await userEvent.type(within(add).getByRole('textbox', { name: /^Dose/ }), '1 tablet');
    await userEvent.type(within(add).getByRole('textbox', { name: /^How often/ }), 'twice a day');
    await userEvent.click(within(add).getByRole('button', { name: 'Add medicine' }));

    expect(await screen.findByText('Conflicts with a recorded allergy: Penicillin')).toBeInTheDocument();
    expect(screen.getByText(/Acknowledge 1 allergy conflict to sign/)).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: 'Reason to prescribe anyway' }), 'Tolerated before');
    expect(screen.queryByText(/Acknowledge 1 allergy conflict to sign/)).not.toBeInTheDocument();
  });

  it('keeps a signed note read-only and takes an addendum', async () => {
    renderApp({ path: '/doctor/encounters/apt-d-a1', signedInAs: DOCTOR });
    expect(await screen.findByText(/^Signed by Dr\. Ahmed Fathy/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign note' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Assessment' })).toHaveAttribute('readonly');
    await userEvent.type(screen.getByRole('textbox', { name: 'New addendum' }), 'Dose corrected to 10 mg.');
    await userEvent.click(screen.getByRole('button', { name: 'Add addendum' }));
    expect(await screen.findByText('Dose corrected to 10 mg.')).toBeInTheDocument();
    expect(screen.getByText(/^Dr\. Ahmed Fathy ·/)).toBeInTheDocument();
  });

  it("keeps another doctor out of the encounter", async () => {
    renderApp({ path: '/doctor/encounters/apt-d-a3', signedInAs: 'u-laila' });
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});

describe('patient history (FR-EMR-12)', () => {
  fixClock();

  it("shows the patient's vitals trend, visits across branches and current medicines", async () => {
    renderApp({ path: '/doctor/patients/pat-000412', signedInAs: DOCTOR });
    expect(await screen.findByRole('heading', { level: 1, name: 'Mohamed Adel' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Blood pressure chart, 2 readings' })).toBeInTheDocument();
    expect(screen.getByText('+8 bpm over the period')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '3 visits' })).toBeInTheDocument();
    expect(screen.getAllByText('Current')).toHaveLength(2); // Concor and aspirin

    await userEvent.click(screen.getByRole('button', { name: 'Maadi' }));
    expect(await screen.findByRole('heading', { name: '1 visit' })).toBeInTheDocument();
  });

  it("finds a patient from the doctor's list", async () => {
    renderApp({ path: '/doctor/patients', signedInAs: DOCTOR });
    const today = await screen.findByRole('region', { name: "Today's patients" });
    await userEvent.click(within(today).getByRole('link', { name: /Mohamed Adel/ }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Mohamed Adel' })).toBeInTheDocument();
  });
});

describe('schedule and leave (FR-SCH-01, FR-SCH-06)', () => {
  fixClock();

  it('shows the week and asks for leave after previewing who it affects', async () => {
    renderApp({ path: '/doctor/schedule', signedInAs: DOCTOR });
    expect(await screen.findByRole('heading', { name: 'Weekly roster' })).toBeInTheDocument();
    expect(screen.getByText('Oct 24 – Oct 30')).toBeInTheDocument();

    const form = screen.getByRole('region', { name: 'Ask for leave' });
    fireEvent.change(within(form).getByLabelText(/^From/), { target: { value: '2026-10-31' } });
    fireEvent.change(within(form).getByLabelText(/^To/), { target: { value: '2026-11-02' } });
    expect(await within(form).findByText(/^Covers \d+ shifts?\./)).toBeInTheDocument();

    await userEvent.click(within(form).getByRole('button', { name: 'Send for approval' }));
    expect(await within(form).findByText('This field is required.')).toBeInTheDocument();
    await userEvent.type(within(form).getByRole('textbox', { name: /Reason/ }), 'Cardiology conference');
    await userEvent.click(within(form).getByRole('button', { name: 'Send for approval' }));
    expect(await screen.findByText(/^Leave request LV-26-\d+ sent for approval\.$/)).toBeInTheDocument();

    const list = screen.getByRole('region', { name: 'My leave requests' });
    expect(await within(list).findByText('Cardiology conference')).toBeInTheDocument();
  });
});
