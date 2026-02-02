const { login, logout } = require('../utils/authMiddleware');

/**
 * Analytics Controller - Handles all analytics API endpoints
 */

class AnalyticsController {
  constructor(analyticsService) {
    this.analyticsService = analyticsService;
  }

  /**
   * GET /api/analytics/summary
   * Returns overall impact metrics
   */
  async getSummary(req, res) {
    try {
      const data = await this.analyticsService.getOverallImpact();
      res.json(data);
    } catch (error) {
      console.error('Error getting summary:', error);
      res.status(500).json({ error: 'Failed to get summary' });
    }
  }

  /**
   * GET /api/analytics/trends?period=30
   * Returns submission trends
   * Query params: period = 7|30|90|all
   */
  async getTrends(req, res) {
    try {
      const period = req.query.period || '30';
      let periodName = 'daily';

      if (period === '7') periodName = 'daily';
      else if (period === '30') periodName = 'weekly';
      else if (period === '90') periodName = 'monthly';
      else periodName = 'daily';

      const data = await this.analyticsService.calculateSubmissionTrends(periodName);

      // Format for Chart.js
      const result = {
        labels: data.map(d => d.date),
        values: data.map(d => d.count),
        datasets: [
          {
            label: 'Seated',
            data: data.map(d => d.formTypes.seated)
          },
          {
            label: 'Table',
            data: data.map(d => d.formTypes.table)
          },
          {
            label: 'Feedback',
            data: data.map(d => d.formTypes.feedback)
          }
        ]
      };

      res.json(result);
    } catch (error) {
      console.error('Error getting trends:', error);
      res.status(500).json({ error: 'Failed to get trends' });
    }
  }

  /**
   * GET /api/analytics/health-issues
   * Returns top health issues
   */
  async getHealthIssues(req, res) {
    try {
      const data = await this.analyticsService.getHealthIssueFrequency();

      // Format for Chart.js
      const result = {
        labels: data.map(d => d.issue),
        data: data.map(d => d.count),
        percentages: data.map(d => d.percentage)
      };

      res.json(result);
    } catch (error) {
      console.error('Error getting health issues:', error);
      res.status(500).json({ error: 'Failed to get health issues' });
    }
  }

  /**
   * GET /api/analytics/therapists
   * Returns therapist workload and performance
   */
  async getTherapists(req, res) {
    try {
      const data = await this.analyticsService.getTherapistWorkload();

      // Format for Chart.js
      const result = {
        labels: data.map(t => t.therapist),
        datasets: [
          {
            label: 'Sessions',
            data: data.map(t => t.sessionCount)
          },
          {
            label: 'Avg Pre-Feeling',
            data: data.map(t => t.avgFeelingPre)
          },
          {
            label: 'Avg Post-Feeling',
            data: data.map(t => t.avgFeelingPost)
          }
        ],
        detail: data
      };

      res.json(result);
    } catch (error) {
      console.error('Error getting therapists:', error);
      res.status(500).json({ error: 'Failed to get therapist data' });
    }
  }

  /**
   * GET /api/analytics/pressure
   * Returns pressure preference breakdown
   */
  async getPressure(req, res) {
    try {
      const data = await this.analyticsService.getPressurePreferences();

      // Format for Chart.js
      const result = {
        labels: data.map(p => p.preference),
        data: data.map(p => p.count),
        percentages: data.map(p => p.percentage),
        backgroundColor: [
          '#9D4EDD',
          '#7B2CBF',
          '#AD63ED'
        ]
      };

      res.json(result);
    } catch (error) {
      console.error('Error getting pressure preferences:', error);
      res.status(500).json({ error: 'Failed to get pressure data' });
    }
  }

  /**
   * GET /api/analytics/feeling-scores
   * Returns pre vs post feeling scores with match quality metrics
   */
  async getFeelingScores(req, res) {
    try {
      const data = await this.analyticsService.getFeelingScoreComparison();

      // Calculate match quality percentage
      const matchQuality = data.preScoresCount > 0
        ? Math.round((data.matchedPairsCount / data.preScoresCount) * 100)
        : 0;

      // Format for Chart.js
      const result = {
        summary: {
          avgPre: data.avgPre,
          avgPost: data.avgPost,
          avgImprovement: data.avgImprovement,
          improvement: data.avgImprovement > 0 ? '✓ Positive' : 'ⓘ Neutral',
          matchQuality: matchQuality,
          matchQualityLabel: matchQuality >= 80 ? 'Excellent' : matchQuality >= 60 ? 'Good' : 'Fair'
        },
        distributions: {
          pre: data.distribution.pre,
          post: data.distribution.post
        },
        stats: {
          preScoresCount: data.preScoresCount,
          postScoresCount: data.postScoresCount,
          matchedPairsCount: data.matchedPairsCount,
          unmatchedCount: data.preScoresCount - data.matchedPairsCount
        }
      };

      res.json(result);
    } catch (error) {
      console.error('Error getting feeling scores:', error);
      res.status(500).json({ error: 'Failed to get feeling score data' });
    }
  }

  /**
   * GET /api/analytics/health-notes
   * Returns aggregated health notes and concerns
   */
  async getHealthNotes(req, res) {
    try {
      const data = await this.analyticsService.getHealthNotesAnalysis();
      res.json(data);
    } catch (error) {
      console.error('Error getting health notes:', error);
      res.status(500).json({ error: 'Failed to get health notes data' });
    }
  }

  /**
   * GET /api/analytics/data-quality
   * Returns metrics about data collection quality
   */
  async getDataQuality(req, res) {
    try {
      const data = await this.analyticsService.getDataQualityMetrics();
      res.json(data);
    } catch (error) {
      console.error('Error getting data quality metrics:', error);
      res.status(500).json({ error: 'Failed to get data quality data' });
    }
  }

  /**
   * GET /api/analytics/sessions?period=30
   * Returns day-by-day session counts for calendar display
   */
  async getSessions(req, res) {
    try {
      const period = req.query.period || '30';
      const data = await this.analyticsService.getSessionCalendar(period);
      res.json(data);
    } catch (error) {
      console.error('Error getting session calendar:', error);
      res.status(500).json({ error: 'Failed to get session calendar' });
    }
  }
}

module.exports = AnalyticsController;
