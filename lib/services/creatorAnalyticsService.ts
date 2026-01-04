/**
 * TapTap Matrix Creator Analytics Service
 * Comprehensive analytics and insights for music creators
 */

export interface CreatorStats {
  totalStreams: number;
  totalRevenue: number;
  totalFans: number;
  totalTracks: number;
  monthlyGrowth: number;
  averageRating: number;
  topTrack: string;
  recentActivity: ActivityItem[];
}

export interface TrackAnalytics {
  trackId: string;
  title: string;
  streams: number;
  revenue: number;
  likes: number;
  shares: number;
  comments: number;
  averageListenTime: number;
  skipRate: number;
  demographics: Demographics;
  streamingHistory: StreamingDataPoint[];
  topRegions: RegionData[];
}

export interface Demographics {
  ageGroups: { range: string; percentage: number }[];
  genders: { type: string; percentage: number }[];
  locations: { country: string; percentage: number }[];
  devices: { type: string; percentage: number }[];
}

export interface StreamingDataPoint {
  date: string;
  streams: number;
  revenue: number;
  newFans: number;
}

export interface RegionData {
  region: string;
  streams: number;
  revenue: number;
  growth: number;
}

export interface ActivityItem {
  id: string;
  type: 'stream' | 'purchase' | 'follow' | 'comment' | 'share';
  description: string;
  timestamp: Date;
  value?: number;
  trackId?: string;
  userId?: string;
}

export interface RevenueBreakdown {
  streaming: number;
  sales: number;
  tips: number;
  licensing: number;
  total: number;
  projectedMonthly: number;
}

export class CreatorAnalyticsService {
  /**
   * Get comprehensive creator statistics
   */
  static async getCreatorStats(creatorId: string): Promise<CreatorStats> {
    // Mock data for Music For The Future creator (VX)
    const mockStats: CreatorStats = {
      totalStreams: 15420,
      totalRevenue: 2847.50,
      totalFans: 892,
      totalTracks: 14,
      monthlyGrowth: 23.5,
      averageRating: 4.7,
      topTrack: "life is worth the wait 2.0",
      recentActivity: [
        {
          id: '1',
          type: 'stream',
          description: 'New stream from Tokyo, Japan',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          trackId: 'life-is-worth-the-wait-2'
        },
        {
          id: '2',
          type: 'purchase',
          description: 'Track purchased for 50 TapCoins',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          value: 50,
          trackId: 'deep-end'
        },
        {
          id: '3',
          type: 'follow',
          description: 'New follower from Berlin, Germany',
          timestamp: new Date(Date.now() - 32 * 60 * 1000),
          userId: 'user-berlin-123'
        },
        {
          id: '4',
          type: 'comment',
          description: 'Comment on "MHMH": "This track is incredible!"',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          trackId: 'mhmh'
        },
        {
          id: '5',
          type: 'share',
          description: 'Track shared on social media',
          timestamp: new Date(Date.now() - 67 * 60 * 1000),
          trackId: '2horns'
        }
      ]
    };

    return mockStats;
  }

  /**
   * Get detailed analytics for a specific track
   */
  static async getTrackAnalytics(trackId: string): Promise<TrackAnalytics> {
    // Generate mock analytics based on track
    const trackTitles = {
      'mhmh': 'MHMH',
      'lost-stay-frosty': 'Lost (Stay Frosty)',
      'life-is-worth-the-wait-2': 'life is worth the wait 2.0',
      'deep-end': 'deep end',
      '2horns': '2Horns'
    };

    const title = trackTitles[trackId] || 'Unknown Track';
    const baseStreams = Math.floor(Math.random() * 3000) + 500;

    const mockAnalytics: TrackAnalytics = {
      trackId,
      title,
      streams: baseStreams,
      revenue: baseStreams * 0.15,
      likes: Math.floor(baseStreams * 0.12),
      shares: Math.floor(baseStreams * 0.05),
      comments: Math.floor(baseStreams * 0.03),
      averageListenTime: 180 + Math.floor(Math.random() * 60),
      skipRate: 0.15 + Math.random() * 0.1,
      demographics: {
        ageGroups: [
          { range: '18-24', percentage: 35 },
          { range: '25-34', percentage: 40 },
          { range: '35-44', percentage: 20 },
          { range: '45+', percentage: 5 }
        ],
        genders: [
          { type: 'Male', percentage: 55 },
          { type: 'Female', percentage: 42 },
          { type: 'Other', percentage: 3 }
        ],
        locations: [
          { country: 'United States', percentage: 35 },
          { country: 'Germany', percentage: 15 },
          { country: 'Japan', percentage: 12 },
          { country: 'United Kingdom', percentage: 10 },
          { country: 'Canada', percentage: 8 },
          { country: 'Other', percentage: 20 }
        ],
        devices: [
          { type: 'Mobile', percentage: 65 },
          { type: 'Desktop', percentage: 25 },
          { type: 'Tablet', percentage: 10 }
        ]
      },
      streamingHistory: this.generateStreamingHistory(30),
      topRegions: [
        { region: 'North America', streams: Math.floor(baseStreams * 0.4), revenue: Math.floor(baseStreams * 0.4 * 0.15), growth: 15.2 },
        { region: 'Europe', streams: Math.floor(baseStreams * 0.35), revenue: Math.floor(baseStreams * 0.35 * 0.15), growth: 22.8 },
        { region: 'Asia', streams: Math.floor(baseStreams * 0.2), revenue: Math.floor(baseStreams * 0.2 * 0.15), growth: 45.1 },
        { region: 'Other', streams: Math.floor(baseStreams * 0.05), revenue: Math.floor(baseStreams * 0.05 * 0.15), growth: 8.3 }
      ]
    };

    return mockAnalytics;
  }

  /**
   * Generate streaming history data
   */
  private static generateStreamingHistory(days: number): StreamingDataPoint[] {
    const history: StreamingDataPoint[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const baseStreams = Math.floor(Math.random() * 100) + 20;
      
      history.push({
        date: date.toISOString().split('T')[0],
        streams: baseStreams,
        revenue: baseStreams * 0.15,
        newFans: Math.floor(Math.random() * 5)
      });
    }

    return history;
  }

  /**
   * Get revenue breakdown
   */
  static async getRevenueBreakdown(creatorId: string): Promise<RevenueBreakdown> {
    const mockRevenue: RevenueBreakdown = {
      streaming: 1847.30,
      sales: 750.20,
      tips: 180.00,
      licensing: 70.00,
      total: 2847.50,
      projectedMonthly: 3200.00
    };

    return mockRevenue;
  }

  /**
   * Get top performing tracks
   */
  static async getTopTracks(creatorId: string, limit: number = 10): Promise<TrackAnalytics[]> {
    const trackIds = ['life-is-worth-the-wait-2', 'mhmh', 'deep-end', 'lost-stay-frosty', '2horns'];
    const topTracks: TrackAnalytics[] = [];

    for (let i = 0; i < Math.min(limit, trackIds.length); i++) {
      const analytics = await this.getTrackAnalytics(trackIds[i]);
      topTracks.push(analytics);
    }

    // Sort by streams
    return topTracks.sort((a, b) => b.streams - a.streams);
  }

  /**
   * Get audience insights
   */
  static async getAudienceInsights(creatorId: string): Promise<{
    totalFans: number;
    newFansThisMonth: number;
    fanRetentionRate: number;
    topFanLocations: { location: string; fans: number }[];
    engagementRate: number;
    averageSessionTime: number;
  }> {
    return {
      totalFans: 892,
      newFansThisMonth: 156,
      fanRetentionRate: 0.78,
      topFanLocations: [
        { location: 'Los Angeles, CA', fans: 89 },
        { location: 'Berlin, Germany', fans: 67 },
        { location: 'Tokyo, Japan', fans: 54 },
        { location: 'London, UK', fans: 43 },
        { location: 'Toronto, Canada', fans: 38 }
      ],
      engagementRate: 0.24,
      averageSessionTime: 18.5
    };
  }

  /**
   * Get marketplace performance
   */
  static async getMarketplacePerformance(creatorId: string): Promise<{
    totalSales: number;
    totalRevenue: number;
    averagePrice: number;
    topSellingTrack: string;
    conversionRate: number;
    recentSales: { trackTitle: string; price: number; timestamp: Date }[];
  }> {
    return {
      totalSales: 47,
      totalRevenue: 750.20,
      averagePrice: 15.96,
      topSellingTrack: 'life is worth the wait 2.0',
      conversionRate: 0.053,
      recentSales: [
        { trackTitle: 'deep end', price: 25.00, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        { trackTitle: 'MHMH', price: 15.00, timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
        { trackTitle: 'life is worth the wait 2.0', price: 20.00, timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) },
        { trackTitle: '2Horns', price: 12.00, timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) },
        { trackTitle: 'Lost (Stay Frosty)', price: 18.00, timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000) }
      ]
    };
  }
}
