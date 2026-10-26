import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DEMO_INVITATION_TOKEN } from '@/mocks/seed/invitations';
import { DEMO_CODE, DEMO_PASSWORD } from '@/mocks/seed/users';
import { renderApp } from '@/test/render-app';

const typeCode = async (code: string) => {
  await userEvent.click(screen.getByRole('textbox', { name: 'Digit 1 of 6' }));
  await userEvent.keyboard(code);
};

const signInWith = async (identifier: string, password: string) => {
  await userEvent.type(await screen.findByLabelText(/Mobile number or email/), identifier);
  await userEvent.type(screen.getByLabelText(/^Password/), password);
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
};

describe('sign-in', () => {
  it('signs a patient in with their phone number and opens the patient portal', async () => {
    renderApp({ path: '/sign-in' });
    await signInWith('010 1234 5678', DEMO_PASSWORD);
    expect(await screen.findByRole('heading', { level: 1, name: /^Good (morning|afternoon|evening),/ })).toBeInTheDocument();
  });

  it('asks staff for the two-step code, then returns them to the page they wanted', async () => {
    renderApp({ path: '/desk/queue' });
    await signInWith('mona.samir@clinicflow.eg', DEMO_PASSWORD);

    expect(await screen.findByRole('heading', { name: 'Two-step verification' })).toBeInTheDocument();
    expect(screen.getByText('mona.samir@clinicflow.eg')).toBeInTheDocument();
    await typeCode(DEMO_CODE);
    expect(await screen.findByRole('heading', { name: 'Queue board' })).toBeInTheDocument();
  });

  it('shows one message for a wrong password, without saying whether the account exists', async () => {
    renderApp({ path: '/sign-in' });
    await signInWith('karim.adel@clinicflow.eg', 'Wrong#Pass1');
    expect(await screen.findByRole('alert')).toHaveTextContent("The phone or email and password don't match an account.");
  });

  it('opens the lockout screen after five wrong passwords', async () => {
    renderApp({ path: '/sign-in' });
    for (let attempt = 0; attempt < 5; attempt++) {
      const password = screen.queryByLabelText(/^Password/) ?? (await screen.findByLabelText(/^Password/));
      if (attempt === 0) await userEvent.type(screen.getByLabelText(/Mobile number or email/), '01012345678');
      await userEvent.clear(password);
      await userEvent.type(password, 'Wrong#Pass1');
      await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
      if (attempt < 4) await screen.findByRole('alert');
    }
    expect(await screen.findByRole('heading', { name: 'Too many attempts' })).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent(/1[45]:\d\d/);
  });
});

describe('patient sign-up', () => {
  it('creates the account, verifies the phone by one-time code and signs the patient in', async () => {
    renderApp({ path: '/sign-up' });
    await userEvent.type(await screen.findByLabelText(/First name/), 'Omar');
    await userEvent.type(screen.getByLabelText(/Last name/), 'Hassan');
    await userEvent.type(screen.getByLabelText(/Mobile number/), '0122 333 4444');
    await userEvent.type(screen.getByLabelText(/^Password/), 'Strong#Pass1');
    await userEvent.click(screen.getByLabelText(/I agree to the terms/));
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('heading', { name: 'Verify your phone' })).toBeInTheDocument();
    expect(screen.getByText('+20 12•• ••• 4444')).toBeInTheDocument();

    await typeCode('000000');
    expect(await screen.findByRole('alert')).toHaveTextContent('Attempts left: 4');

    await typeCode(DEMO_CODE);
    expect(await screen.findByRole('heading', { level: 1, name: /^Good (morning|afternoon|evening),/ })).toBeInTheDocument();
  });

  it('explains every invalid field before sending anything', async () => {
    renderApp({ path: '/sign-up' });
    await userEvent.type(await screen.findByLabelText(/Mobile number/), '0101');
    await userEvent.type(screen.getByLabelText(/^Password/), 'weak');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Enter an Egyptian mobile number, e.g. 010 1234 5678.')).toBeInTheDocument();
    expect(screen.getByText("The password doesn't meet every rule below.")).toBeInTheDocument();
    expect(screen.getByText('Please accept to continue.')).toBeInTheDocument();
  });
});

describe('password reset', () => {
  it('resets by one-time code and lets the patient sign in with the new password', async () => {
    renderApp({ path: '/forgot-password' });
    await userEvent.type(await screen.findByLabelText(/^Mobile number/), '01012345678');
    await userEvent.click(screen.getByRole('button', { name: 'Send code' }));

    expect(await screen.findByRole('heading', { name: 'Enter the code' })).toBeInTheDocument();
    await typeCode(DEMO_CODE);

    expect(await screen.findByRole('heading', { name: 'Set a new password' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/^New password/), 'Fresh#Pass9');
    await userEvent.type(screen.getByLabelText(/^Confirm password/), 'Fresh#Pass9');
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }));

    expect(await screen.findByRole('heading', { name: 'Password changed' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Sign in' }));
    await signInWith('01012345678', 'Fresh#Pass9');
    expect(await screen.findByRole('heading', { level: 1, name: /^Good (morning|afternoon|evening),/ })).toBeInTheDocument();
  });

  it('sends an email link and shows it in demo mode', async () => {
    renderApp({ path: '/forgot-password' });
    await userEvent.click(await screen.findByRole('radio', { name: /Email me a link/ }));
    await userEvent.type(screen.getByRole('textbox', { name: /^Email/ }), 'karim.adel@clinicflow.eg');
    await userEvent.click(screen.getByRole('button', { name: 'Send link' }));

    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('link', { name: 'Demo: open the link from the email' }));
    expect(await screen.findByRole('heading', { name: 'Set a new password' })).toBeInTheDocument();
  });
});

describe('staff invitation and two-step setup', () => {
  it('accepts the invitation, sets up the authenticator, then opens the workspace', async () => {
    renderApp({ path: `/invitation/${DEMO_INVITATION_TOKEN}` });
    expect(await screen.findByRole('heading', { name: 'Dr. Hala Mostafa invited you to join ClinicFlow' })).toBeInTheDocument();
    expect(await screen.findByText('Nurse at Nasr City')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/^Mobile number/), '01011112222');
    await userEvent.type(screen.getByLabelText(/^Create a password/), 'Nurse#2026');
    await userEvent.type(screen.getByLabelText(/^Confirm the password/), 'Nurse#2026');
    await userEvent.click(screen.getByLabelText(/I agree to the staff security policy/));
    await userEvent.click(screen.getByRole('button', { name: 'Join and set up two-step sign-in' }));

    expect(await screen.findByRole('heading', { name: 'Set up two-step sign-in' })).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: /QR code/ })).toBeInTheDocument();
    const recovery = screen.getByRole('region', { name: 'Recovery codes' });
    expect(within(recovery).getAllByRole('listitem')).toHaveLength(8);

    await typeCode(DEMO_CODE);
    await userEvent.click(screen.getByRole('button', { name: 'Finish setup' }));
    expect(await screen.findByText("Confirm that you've saved your recovery codes.")).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("I've saved my recovery codes"));
    await userEvent.click(screen.getByRole('button', { name: 'Finish setup' }));
    expect(await screen.findByRole('heading', { name: 'Triage queue' })).toBeInTheDocument();
  });

  it('explains an invitation link that no longer works', async () => {
    renderApp({ path: '/invitation/used-or-unknown' });
    expect(await screen.findByText("This invitation can't be used")).toBeInTheDocument();
  });
});
