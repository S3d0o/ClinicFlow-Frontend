import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render-app';

describe('app routes and shells', () => {
  it('sends a signed-out visitor from a staff screen to sign-in, then back after signing in', async () => {
    renderApp({ path: '/desk/queue' });
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: 'Sign in as Mona Samir' }));
    expect(await screen.findByRole('heading', { name: 'Queue board' })).toBeInTheDocument();
  });

  it("shows a receptionist the front desk menu and no one else's", async () => {
    renderApp({ path: '/desk', signedInAs: 'u-mona' });
    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();

    const sidebar = screen.getAllByRole('complementary')[0];
    expect(within(sidebar).getByRole('link', { name: 'Cash session' })).toBeInTheDocument();
    expect(within(sidebar).queryByRole('link', { name: 'Roles & permissions' })).not.toBeInTheDocument();
  });

  it('shows "no access" when a user opens a screen outside their permissions', async () => {
    renderApp({ path: '/admin/roles', signedInAs: 'u-mona' });
    expect(await screen.findByRole('heading', { name: "You don't have access to this page" })).toBeInTheDocument();
  });

  it('sends a signed-in user away from sign-in to their home page', async () => {
    renderApp({ path: '/sign-in', signedInAs: 'u-mohamed' });
    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Appointments' }).length).toBeGreaterThan(0);
  });

  it('switches to Arabic and right-to-left from the language toggle', async () => {
    renderApp({ path: '/sign-in' });
    await screen.findByRole('heading', { name: 'Sign in' });

    await userEvent.click(screen.getByRole('button', { name: 'عربي' }));
    expect(await screen.findByRole('heading', { name: 'تسجيل الدخول' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(document.documentElement).toHaveAttribute('lang', 'ar');
  });

  it('shows a not-found page for unknown paths', async () => {
    renderApp({ path: '/nowhere' });
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
