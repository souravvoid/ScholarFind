import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
// @ts-ignore - screen and fireEvent are runtime exports but missing from v16 type defs
import { screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ScholarshipExplorer } from './ScholarshipExplorer';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    profile: null,
    loading: false,
    savedScholarships: [],
    authError: null,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
    saveScholarship: vi.fn(),
    unsaveScholarship: vi.fn(),
    updateTrackerStatus: vi.fn(),
    isSaved: () => false,
  }),
}));

vi.mock('../services/catalogueService', async () => {
  const { SCHOLARSHIPS_DATA } = await import('../data/scholarshipsData');
  return {
    getScholarshipsFromDatabase: vi.fn().mockResolvedValue({
      data: SCHOLARSHIPS_DATA,
      fromDatabase: true,
    }),
  };
});

describe('ScholarshipExplorer Advanced Filtering', () => {
  const onOpenProfileBuilder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderExplorer = async (initialEntries = ['/explore']) => {
    let result: ReturnType<typeof render>;
    await act(async () => {
      result = render(
        <MemoryRouter initialEntries={initialEntries}>
          <ScholarshipExplorer onOpenProfileBuilder={onOpenProfileBuilder} />
        </MemoryRouter>,
      );
    });
    return result!;
  };

  it('renders explorer header, search bar, and primary filter sections', async () => {
    await renderExplorer();
    expect(screen.getByRole('heading', { level: 1, name: /Explore verified scholarships/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search title, provider/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Deadline proximity/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Geographic location/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Funding type & coverage/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Study level/i })).toBeInTheDocument();
  });

  it('filters scholarships by funding model: need-based', async () => {
    await renderExplorer();
    const needBtn = screen.getByRole('button', { name: /Need-based/i });
    await act(async () => {
      fireEvent.click(needBtn);
    });

    // Verify need-based filter matches Commonwealth and DAAD Helmut Schmidt
    expect(screen.getByText(/Commonwealth Master’s Scholarship/i)).toBeInTheDocument();
    expect(screen.getByText(/DAAD Helmut-Schmidt Programme/i)).toBeInTheDocument();
    // Gates Cambridge is strictly merit-based, so it should be excluded
    expect(screen.queryByText(/Gates Cambridge Scholarship/i)).not.toBeInTheDocument();

    // Verify active filter chip appears
    expect(screen.getByText(/Basis: Need-based/i)).toBeInTheDocument();
  });

  it('filters scholarships by coverage scope: Full Ride', async () => {
    await renderExplorer();
    const fullRideBtn = screen.getByRole('button', { name: /Full Ride/i });
    await act(async () => {
      fireEvent.click(fullRideBtn);
    });

    // Vanier CGS only covers stipend and tuition, not full ride package
    expect(screen.queryByText(/Vanier Canada Graduate Scholarships/i)).not.toBeInTheDocument();
    // Gates Cambridge offers full ride
    expect(screen.getByText(/Gates Cambridge Scholarship/i)).toBeInTheDocument();
    expect(screen.getByText(/Coverage: Full Ride/i)).toBeInTheDocument();
  });

  it('filters scholarships by geographic macro-region: Continental Europe', async () => {
    await renderExplorer();
    const europeBtn = screen.getByRole('button', { name: /Continental Europe/i });
    await act(async () => {
      fireEvent.click(europeBtn);
    });

    // European scholarships should be visible
    expect(screen.getByText(/DAAD Helmut-Schmidt Programme/i)).toBeInTheDocument();
    expect(screen.getByText(/Erasmus Mundus Joint Master Degree/i)).toBeInTheDocument();
    // US or UK-only scholarships excluded
    expect(screen.queryByText(/Knight-Hennessy Scholars/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Vanier Canada Graduate Scholarships/i)).not.toBeInTheDocument();

    // Active filter chip appears
    expect(screen.getByText(/Region: Continental Europe/i)).toBeInTheDocument();
  });

  it('filters scholarships by specific destination country: Canada', async () => {
    await renderExplorer();
    const canadaBtn = screen.getByRole('button', { name: /Canada/i });
    await act(async () => {
      fireEvent.click(canadaBtn);
    });

    // Vanier CGS is in Canada
    expect(screen.getByText(/Vanier Canada Graduate Scholarships/i)).toBeInTheDocument();
    // Others excluded
    expect(screen.queryByText(/Gates Cambridge Scholarship/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/DAAD Helmut-Schmidt Programme/i)).not.toBeInTheDocument();
  });

  it('filters scholarships by deadline proximity: closing soon (< 14 days)', async () => {
    await renderExplorer();
    const urgentBtn = screen.getByRole('button', { name: /Closing soon \(< 14 days\)/i });
    await act(async () => {
      fireEvent.click(urgentBtn);
    });

    // Knight-Hennessy (12 days) and Vanier CGS (13 days) are < 14 days
    expect(screen.getByText(/Knight-Hennessy Scholars/i)).toBeInTheDocument();
    expect(screen.getByText(/Vanier Canada Graduate Scholarships/i)).toBeInTheDocument();
    // Fulbright (225 days) and Gates Cambridge (45 days) are not
    expect(screen.queryByText(/Fulbright Foreign Student Program/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Gates Cambridge Scholarship/i)).not.toBeInTheDocument();

    // Active filter chip
    expect(screen.getByText(/Deadline: < 14 days/i)).toBeInTheDocument();
  });

  it('removes an active filter when its chip remove button is clicked', async () => {
    await renderExplorer();
    const needBtn = screen.getByRole('button', { name: /Need-based/i });
    await act(async () => {
      fireEvent.click(needBtn);
    });

    expect(screen.getByText(/Basis: Need-based/i)).toBeInTheDocument();
    expect(screen.queryByText(/Gates Cambridge Scholarship/i)).not.toBeInTheDocument();

    // Remove the filter chip
    const removeBtn = screen.getByRole('button', { name: /Remove filter: Basis: Need-based/i });
    await act(async () => {
      fireEvent.click(removeBtn);
    });

    // Gates Cambridge is now restored
    expect(screen.getByText(/Gates Cambridge Scholarship/i)).toBeInTheDocument();
  });

  it('clears all active filters when Clear all is clicked', async () => {
    await renderExplorer();
    const searchInput = screen.getByPlaceholderText(/Search title, provider/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Commonwealth' } });
    });

    expect(screen.getByText(/Active:/i)).toBeInTheDocument();
    const clearBtn = screen.getByRole('button', { name: /Clear all/i });
    await act(async () => {
      fireEvent.click(clearBtn);
    });

    // Search input reset
    expect((searchInput as HTMLInputElement).value).toBe('');
    expect(screen.getByText(/Gates Cambridge Scholarship/i)).toBeInTheDocument();
  });

  it('toggles mobile filter drawer when Filters button is pressed', async () => {
    await renderExplorer();
    const filterToggleBtn = screen.getByRole('button', { name: /Toggle filter drawer/i });
    await act(async () => {
      fireEvent.click(filterToggleBtn);
    });

    expect(screen.getByRole('heading', { level: 2, name: /Filter scholarships/i })).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Close filters drawer/i });
    await act(async () => {
      fireEvent.click(closeBtn);
    });

    expect(screen.queryByRole('heading', { level: 2, name: /Filter scholarships/i })).not.toBeInTheDocument();
  });
});
