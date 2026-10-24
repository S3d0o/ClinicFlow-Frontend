import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render-app';

describe('join as a doctor', () => {
  it('asks a visitor to create an account or sign in first', async () => {
    renderApp({ path: '/join' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Apply to join our clinic' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create an account' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('needs a confirmed email, then takes the application through to My application', async () => {
    renderApp({ path: '/join', signedInAs: 'u-mohamed' }); // a patient without an email
    expect(await screen.findByRole('button', { name: 'Continue' })).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/Add your email/), 'mohamed@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send confirmation link' }));
    await userEvent.click(await screen.findByRole('link', { name: 'Demo: open the confirmation link' }));
    expect(await screen.findByRole('heading', { name: 'Email confirmed' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Continue' }));

    // Step 1: account ready
    await userEvent.click(await screen.findByRole('button', { name: 'Continue' }));

    // Step 2: practice, checked before moving on
    await userEvent.click(await screen.findByRole('button', { name: 'Continue' }));
    expect(await screen.findAllByText('This field is required.')).toHaveLength(2);
    await userEvent.click(screen.getByRole('combobox', { name: /Specialty/ }));
    await userEvent.click(await screen.findByRole('option', { name: 'Cardiology' }));
    await userEvent.type(screen.getByLabelText(/Medical license number/), 'MOH-90001');
    await userEvent.type(screen.getByLabelText(/Years of experience/), '8');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Step 3: documents; the CV is required and must be PDF or DOCX
    await userEvent.click(await screen.findByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Attach your CV to apply.')).toBeInTheDocument();
    await userEvent.upload(screen.getByLabelText(/^CV/), new File(['%PDF'], 'mohamed-cv.pdf', { type: 'application/pdf' }));
    expect(screen.getByText('mohamed-cv.pdf')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: 'Write it here' }), 'Eight years in cardiology.');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Step 4: review and submit
    expect(await screen.findByText('MOH-90001')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Submit application' }));
    expect(await screen.findByRole('heading', { name: 'We received your application' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Your application: Cardiology' })).toBeInTheDocument();
  });

  it('sends a returning applicant to their application', async () => {
    renderApp({ path: '/join', signedInAs: 'u-nour' });
    expect(await screen.findByRole('heading', { name: "You've already applied" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'View my application' }));
    expect(await screen.findByRole('heading', { name: 'Your interview' })).toBeInTheDocument();
  });
});

describe('my application', () => {
  it('shows the stage, the interview details and the history', async () => {
    renderApp({ path: '/my-application', signedInAs: 'u-nour' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Your application: Internal Medicine' })).toBeInTheDocument();

    const tracker = screen.getByRole('region', { name: 'Application progress' });
    expect(within(tracker).getByText('Interview').closest('li')).toHaveAttribute('aria-current', 'step');

    const stage = screen.getByRole('region', { name: 'Your interview' });
    expect(within(stage).getByText('Dr. Hala Mostafa')).toBeInTheDocument();
    expect(within(stage).getByText(/branch time/)).toBeInTheDocument();
    expect(within(stage).getByRole('button', { name: 'Add to calendar' })).toBeInTheDocument();

    const history = screen.getByRole('region', { name: 'History' });
    expect(within(history).getAllByRole('listitem').map((li) => within(li).getByRole('heading').textContent)).toEqual([
      'Interview scheduled',
      'Application submitted',
    ]);
  });

  it('lets the applicant withdraw after confirming', async () => {
    renderApp({ path: '/my-application', signedInAs: 'u-nour' });
    await userEvent.click(await screen.findByRole('button', { name: 'Withdraw application' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Withdraw' }));
    expect(await screen.findByRole('heading', { name: 'You withdrew this application' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Withdraw application' })).not.toBeInTheDocument();
  });

  it('is only for applicants', async () => {
    renderApp({ path: '/my-application', signedInAs: 'u-mohamed' });
    expect(await screen.findByRole('heading', { name: "You don't have access to this page" })).toBeInTheDocument();
  });
});
