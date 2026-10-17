import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, type AxiosResponse } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { doctorsApi, specialtiesApi } from '@/api';
import type { DoctorSummary, Specialty } from '@/types';
import { DoctorsPage } from './DoctorsPage';

vi.mock('@/api', () => ({
  doctorsApi: { list: vi.fn() },
  specialtiesApi: { getAll: vi.fn() },
}));

const listDoctors = vi.mocked(doctorsApi.list);
const getSpecialties = vi.mocked(specialtiesApi.getAll);
const ok = <T,>(data: T) => Promise.resolve({ data } as AxiosResponse<T>);

const doctor: DoctorSummary = {
  id: 1,
  fullName: 'Dr. Ahmed El-Sayed',
  specialtyName: 'Cardiology',
  yearsOfExperience: 12,
  consultationFee: 650,
  averageRating: 4.6,
  clinicCity: 'Cairo',
};
const cardiology: Specialty = { id: 4, name: 'Cardiology', isActive: true };

const renderPage = () =>
  render(
    <MemoryRouter>
      <DoctorsPage />
    </MemoryRouter>
  );

beforeEach(() => {
  listDoctors.mockReset();
  getSpecialties.mockReset().mockImplementation(() => ok([cardiology]));
});

describe('DoctorsPage', () => {
  it('lists doctors from the API', async () => {
    listDoctors.mockImplementation(() => ok([doctor]));
    renderPage();

    expect(await screen.findByRole('heading', { name: doctor.fullName })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dr\. Ahmed El-Sayed/ })).toHaveAttribute('href', '/doctors/1');
  });

  it('shows an error with a working retry instead of "no doctors" when loading fails', async () => {
    listDoctors
      .mockImplementationOnce(() => Promise.reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK)))
      .mockImplementation(() => ok([doctor]));
    renderPage();

    expect(await screen.findByText('Couldn’t load doctors')).toBeInTheDocument();
    expect(screen.queryByText(/No doctors match/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: doctor.fullName })).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    listDoctors.mockImplementation(() => ok([]));
    renderPage();
    expect(await screen.findByText('No doctors match your search')).toBeInTheDocument();
  });

  it('filters by specialty from the chips', async () => {
    listDoctors.mockImplementation(() => ok([doctor]));
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Cardiology' }));

    await waitFor(() => expect(listDoctors).toHaveBeenLastCalledWith(expect.objectContaining({ specialtyId: 4, pageNumber: 1 })));
    expect(screen.getByRole('button', { name: 'Cardiology' })).toHaveAttribute('aria-pressed', 'true');
  });
});
