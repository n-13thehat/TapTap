import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreatorPage from '../app/creator/page';
import Analytics from '../app/creator/Analytics';

// Mock framer-motion
vi.mock('framer-motion', () => {
  const stripMotionProps = ({ children, ...props }: any, Component: any) => {
    const { whileHover: _whileHover, whileTap: _whileTap, ...rest } = props;
    return <Component {...rest}>{children}</Component>;
  };

  return {
    motion: {
      div: (props: any) => stripMotionProps(props, 'div'),
      button: (props: any) => stripMotionProps(props, 'button'),
    },
    AnimatePresence: ({ children }: any) => children,
  };
});

// Mock fetch
global.fetch = vi.fn();

describe('Creator Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        plays: 12400,
        saves: 892,
        sales: 234,
        followers: 4820,
        revenue: 156.50,
        engagement: 8.2,
        downloads: 156,
        shares: 89,
      }),
    });
  });

  describe('Main Creator Dashboard', () => {
    it('renders creator dashboard with all sections', () => {
      render(<CreatorPage />);
      
      // Check header
      expect(screen.getByText('Home · Studio Dashboard')).toBeInTheDocument();
      expect(screen.getByText('TapTap Creator')).toBeInTheDocument();
      
      // Check metrics
      expect(screen.getByText('TAP earned (7d)')).toBeInTheDocument();
      expect(screen.getByText('120 TAP')).toBeInTheDocument();
      expect(screen.getByText('Followers')).toBeInTheDocument();
      expect(screen.getByText('4,820')).toBeInTheDocument();
      
      // Check tier system
      expect(screen.getByText('Creator Tiers')).toBeInTheDocument();
      expect(screen.getByText('Tier 1 — Emerging')).toBeInTheDocument();
    });

    it('displays content table with proper data', () => {
      render(<CreatorPage />);

      // Check content items
      expect(screen.getByText('Music For The Future')).toBeInTheDocument();
      expect(screen.getByText('Neon Orbit Poster')).toBeInTheDocument();
      expect(screen.getByText('Flux Bundle')).toBeInTheDocument();
      expect(screen.getByText('Midnight Horizon')).toBeInTheDocument();

      // Check status indicators
      expect(screen.getAllByText('Published')).toHaveLength(2); // Multiple instances expected
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Scheduled Drop')).toBeInTheDocument();
    });

    it('switches between tabs correctly', async () => {
      render(<CreatorPage />);
      
      // Default tab should be content
      expect(screen.getByText('Content & Assets')).toBeInTheDocument();
      
      // Click monetization tab
      const monetizationTab = screen.getByText('Monetization');
      await act(async () => {
        fireEvent.click(monetizationTab);
      });
      expect(screen.getByText('Tips')).toBeInTheDocument();
      expect(screen.getByText('Airdrops')).toBeInTheDocument();
      
      // Click analytics tab
      const analyticsTab = screen.getByText('Analytics');
      await act(async () => {
        fireEvent.click(analyticsTab);
      });
      expect(screen.getByText('Audience')).toBeInTheDocument();
      expect(screen.getByText('Engagement')).toBeInTheDocument();
    });

    it('displays agent inbox with messages', () => {
      render(<CreatorPage />);
      
      expect(screen.getByText('AI Crew (DMs)')).toBeInTheDocument();
      expect(screen.getByText('Serenity')).toBeInTheDocument();
      expect(screen.getByText('Vault')).toBeInTheDocument();
      expect(screen.getByText('Broker')).toBeInTheDocument();
      expect(screen.getByText('Flux')).toBeInTheDocument();
    });

    it('shows onboarding tasks', () => {
      render(<CreatorPage />);
      
      expect(screen.getByText('Onboarding')).toBeInTheDocument();
      expect(screen.getByText('Request creator access')).toBeInTheDocument();
      expect(screen.getByText('Upload first track')).toBeInTheDocument();
      expect(screen.getByText('Create a poster unit')).toBeInTheDocument();
      expect(screen.getByText('Schedule a drop')).toBeInTheDocument();
    });

    it('displays content in list view', () => {
      render(<CreatorPage />);

      // Should display content in list view
      expect(screen.getAllByText('plays')).toHaveLength(4); // Multiple instances expected
      expect(screen.getAllByText('saves')).toHaveLength(4); // Multiple instances expected
      expect(screen.getAllByText('earned')).toHaveLength(4); // Multiple instances expected

      // Should show content items
      expect(screen.getByText('Music For The Future')).toBeInTheDocument();
    });
  });

  describe('Analytics Dashboard', () => {
    it('renders analytics with loading state', async () => {
      render(<Analytics />);
      
      // Should show loading state initially
      expect(screen.getAllByRole('generic')).toHaveLength(27); // Specific count expected
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      });
    });

    it('displays metrics correctly', async () => {
      render(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Plays')).toBeInTheDocument();
        expect(screen.getByText('12,400')).toBeInTheDocument();
        expect(screen.getByText('Saves')).toBeInTheDocument();
        expect(screen.getByText('892')).toBeInTheDocument();
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        expect(screen.getByText('$156.50')).toBeInTheDocument();
      });
    });

    it('switches time ranges', async () => {
      render(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText('30d')).toBeInTheDocument();
      });
      
      // Click 7d range
      const sevenDayButton = screen.getByText('7d');
      await act(async () => {
        fireEvent.click(sevenDayButton);
      });
      
      // Should make new API call
      expect(fetch).toHaveBeenCalledWith('/api/creator/stats?range=7d', { cache: 'no-store' });
    });

    it('displays top tracks section', async () => {
      render(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Top Performing Tracks')).toBeInTheDocument();
        expect(screen.getByText('Music For The Future')).toBeInTheDocument();
        expect(screen.getByText('Midnight Horizon')).toBeInTheDocument();
      });
    });

    it('shows audience demographics', async () => {
      render(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Audience by Location')).toBeInTheDocument();
        expect(screen.getByText('United States')).toBeInTheDocument();
        expect(screen.getByText('United Kingdom')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      (fetch as any).mockRejectedValue(new Error('API Error'));
      
      render(<Analytics />);
      
      // Should still render with fallback data
      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
        expect(screen.getByText('12,400')).toBeInTheDocument(); // Fallback data
      });
    });
  });
});
