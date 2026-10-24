import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render-app';

describe('find a doctor', () => {
  it('lists every public doctor with prices and next free times', async () => {
    renderApp({ path: '/doctors' });
    expect(await screen.findByText('10 doctors')).toBeInTheDocument();
    const card = (await screen.findByRole('heading', { name: 'Dr. Ahmed Fathy' })).closest('article')!;
    expect(within(card).getByText('Cardiology')).toBeInTheDocument();
    expect(within(card).getByText(/From EGP\s?450/)).toBeInTheDocument();
    expect(within(card).getByText('128 reviews', { exact: false })).toBeInTheDocument();
  });

  it('searches by text and filters by branch, keeping the search in the URL', async () => {
    renderApp({ path: '/doctors' });
    await userEvent.type(await screen.findByRole('searchbox'), 'cardio');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('2 doctors')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Sheikh Zayed' }));
    expect(await screen.findByText('1 doctor')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dr. Tamer El-Sayed' })).toBeInTheDocument();
  });

  it('opens with the filters from the link', async () => {
    renderApp({ path: '/doctors?specialty=sp-peds' });
    expect(await screen.findByRole('heading', { name: 'Dr. Laila Hassan' })).toBeInTheDocument();
    expect(await screen.findByText('1 doctor')).toBeInTheDocument();
  });
});

describe('doctor profile', () => {
  it('shows the profile, services with prices, hours and reviews', async () => {
    renderApp({ path: '/doctors/doc-ahmed' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Dr. Ahmed Fathy' })).toBeInTheDocument();
    expect(screen.getByText('18 years of experience')).toBeInTheDocument();

    const services = screen.getByRole('region', { name: 'Services & prices' });
    expect(within(services).getByText('Echocardiogram')).toBeInTheDocument();
    expect(within(services).getByText(/EGP\s?600/)).toBeInTheDocument();

    const reviews = screen.getByRole('region', { name: 'Reviews' });
    expect(await within(reviews).findAllByRole('listitem')).toHaveLength(5);
  });

  it('hands a chosen time to booking, asking a visitor to sign in first', async () => {
    renderApp({ path: '/doctors/doc-ahmed' });
    const booking = await screen.findByRole('region', { name: 'Book an appointment' });
    expect(within(booking).getByRole('button', { name: 'Continue to book' })).toBeDisabled();

    const freeTime = (await within(booking).findAllByRole('button', { pressed: false })).find(
      (button) => !button.hasAttribute('disabled') && /\d:\d\d/.test(button.textContent ?? '')
    )!;
    await userEvent.click(freeTime);
    expect(within(booking).getByText(/Pay at the desk/)).toBeInTheDocument();
    await userEvent.click(within(booking).getByRole('button', { name: 'Continue to book' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('says so when the doctor does not exist', async () => {
    renderApp({ path: '/doctors/doc-nobody' });
    expect(await screen.findByText("We couldn't find this doctor.")).toBeInTheDocument();
  });
});

describe('landing page', () => {
  it('shows the branches and opens a filtered search from a specialty', async () => {
    renderApp({ path: '/' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Your clinic visit, from booking to prescription' })).toBeInTheDocument();
    const branches = await screen.findByRole('region', { name: 'One clinic, every branch' });
    expect(await within(branches).findByRole('heading', { name: 'Maadi' })).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('link', { name: 'Doctors in Dermatology' }));
    expect(await screen.findByRole('heading', { name: 'Dr. Yasmine Fawzy' })).toBeInTheDocument();
  });

  it('is fully translated and right-to-left in Arabic', async () => {
    renderApp({ path: '/' });
    await screen.findByRole('heading', { level: 1, name: 'Your clinic visit, from booking to prescription' });
    await userEvent.click(screen.getAllByRole('button', { name: 'عربي' })[0]);
    expect(await screen.findByRole('heading', { level: 1, name: 'زيارتك للعيادة، من الحجز حتى الروشتة' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(await screen.findByRole('heading', { name: 'المعادي' })).toBeInTheDocument();
  });
});
