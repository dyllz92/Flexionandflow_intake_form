const fs = require('fs');
const path = require('path');

/**
 * AnalyticsService - Calculates all analytics metrics with caching
 * Reads data directly from master JSON files instead of individual metadata files
 */
class AnalyticsService {
  constructor(metadataStore) {
    this.metadataStore = metadataStore;
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    this.masterFeedbackPath = path.join(__dirname, '..', 'pdfs', 'master_feedback.json');
    this.masterIntakesPath = path.join(__dirname, '..', 'pdfs', 'master_intakes.json');
  }

  /**
   * Get cached value if fresh, otherwise return null
   */
  getFromCache(key) {
    if (this.cache.has(key)) {
      const item = this.cache.get(key);
      if (Date.now() - item.timestamp < this.cacheTTL) {
        return item.value;
      }
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Set cache value
   */
  setCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Load all metadata from master files (feedback + intakes)
   */
  async loadAllMetadataFromMasterFiles() {
    const allData = [];

    try {
      // Load feedback submissions
      if (fs.existsSync(this.masterFeedbackPath)) {
        const feedbackContent = fs.readFileSync(this.masterFeedbackPath, 'utf8');
        const feedbackData = JSON.parse(feedbackContent);
        if (Array.isArray(feedbackData)) {
          allData.push(...feedbackData);
        } else if (feedbackData) {
          allData.push(feedbackData);
        }
      }

      // Load intake submissions
      if (fs.existsSync(this.masterIntakesPath)) {
        const intakesContent = fs.readFileSync(this.masterIntakesPath, 'utf8');
        const intakesData = JSON.parse(intakesContent);
        if (Array.isArray(intakesData)) {
          allData.push(...intakesData);
        } else if (intakesData) {
          allData.push(intakesData);
        }
      }

      return allData;
    } catch (error) {
      console.error('[Analytics] Error loading from master files:', error.message);
      return [];
    }
  }

  /**
   * Calculate submission trends by day/week/month
   */
  async calculateSubmissionTrends(period = 'daily') {
    const cacheKey = `trends_${period}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const metadata = await this.loadAllMetadataFromMasterFiles();
    const trends = {};

    // Group by date based on period
    for (const item of metadata) {
      const date = new Date(item.submissionDate);
      let key;

      if (period === 'daily' || period === '7') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (period === 'weekly' || period === '30') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (period === 'monthly' || period === '90') {
        key = date.toISOString().substring(0, 7); // YYYY-MM
      }

      if (!trends[key]) {
        trends[key] = {
          date: key,
          count: 0,
          formTypes: { seated: 0, table: 0, feedback: 0 }
        };
      }

      trends[key].count++;
      const formType = item.formType || 'seated';
      if (trends[key].formTypes[formType] !== undefined) {
        trends[key].formTypes[formType]++;
      }
    }

    const result = Object.values(trends).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get health issue frequency
   */
  async getHealthIssueFrequency() {
    const cacheKey = 'health_issues';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const metadata = await this.loadAllMetadataFromMasterFiles();
    const frequencyMap = {};
    const intakeCount = metadata.filter(m => m.formType === 'seated' || m.formType === 'table').length;

    for (const item of metadata) {
      if (!item.health || !item.health.healthChecks) continue;

      for (const issue of item.health.healthChecks) {
        if (!frequencyMap[issue]) {
          frequencyMap[issue] = 0;
        }
        frequencyMap[issue]++;
      }
    }

    // Convert to array with counts and percentages
    const result = Object.entries(frequencyMap)
      .map(([issue, count]) => ({
        issue,
        count,
        percentage: intakeCount > 0 ? Math.round((count / intakeCount) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get therapist workload
   */
  async getTherapistWorkload() {
    const cacheKey = 'therapist_workload';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const metadata = await this.loadAllMetadataFromMasterFiles();
    const therapistMap = {};

    for (const item of metadata) {
      const therapist = item.ao?.therapistName || 'Unknown';

      if (!therapistMap[therapist]) {
        therapistMap[therapist] = {
          therapist,
          sessionCount: 0,
          feelingPreScores: [],
          feelingPostScores: [],
          avgFeelingPre: 0,
          avgFeelingPost: 0
        };
      }

      therapistMap[therapist].sessionCount++;

      if (item.ao?.feelingPre) {
        therapistMap[therapist].feelingPreScores.push(item.ao.feelingPre);
      }

      if (item.feedback?.feelingPost) {
        therapistMap[therapist].feelingPostScores.push(item.feedback.feelingPost);
      }
    }

    // Calculate averages
    const result = Object.values(therapistMap)
      .map(t => ({
        therapist: t.therapist,
        sessionCount: t.sessionCount,
        avgFeelingPre: t.feelingPreScores.length > 0
          ? Math.round((t.feelingPreScores.reduce((a, b) => a + b, 0) / t.feelingPreScores.length) * 10) / 10
          : 0,
        avgFeelingPost: t.feelingPostScores.length > 0
          ? Math.round((t.feelingPostScores.reduce((a, b) => a + b, 0) / t.feelingPostScores.length) * 10) / 10
          : 0,
        feedbackCount: t.feelingPostScores.length
      }))
      .sort((a, b) => b.sessionCount - a.sessionCount);

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get pressure preferences
   */
  async getPressurePreferences() {
    const cacheKey = 'pressure_preferences';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const metadata = await this.loadAllMetadataFromMasterFiles();
    const intakes = metadata.filter(m => m.formType === 'seated' || m.formType === 'table');
    const preferenceMap = { Light: 0, Medium: 0, Firm: 0, Unknown: 0 };

    for (const item of intakes) {
      const pressure = item.preferences?.pressure || 'Unknown';
      if (preferenceMap[pressure] !== undefined) {
        preferenceMap[pressure]++;
      } else {
        preferenceMap.Unknown++;
      }
    }

    const total = intakes.length || 1;
    const result = Object.entries(preferenceMap)
      .map(([preference, count]) => ({
        preference,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get feeling score comparison (pre vs post)
   */
  async getFeelingScoreComparison() {
    const cacheKey = 'feeling_scores';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const metadata = await this.loadAllMetadataFromMasterFiles();

    const preScores = [];
    const postScores = [];
    const improvements = [];

    // Separate intakes and feedback
    const intakes = [];
    const feedbacks = [];

    for (const item of metadata) {
      if (item.formType === 'seated' || item.formType === 'table') {
        if (item.ao?.feelingPre) {
          preScores.push(item.ao.feelingPre);
          intakes.push(item);
        }
      } else if (item.formType === 'feedback') {
        if (item.feedback?.feelingPost) {
          postScores.push(item.feedback.feelingPost);
          feedbacks.push(item);
        }
      }
    }

    // Calculate improvements (matched pairs with better matching strategy)
    for (const intake of intakes) {
      // Try to find matching feedback using mobile, therapist, and time proximity (within 24 hours)
      const intakeTime = new Date(intake.submissionDate).getTime();

      let bestMatch = null;
      let bestScore = -1;

      for (const feedback of feedbacks) {
        const feedbackTime = new Date(feedback.submissionDate).getTime();
        const timeDiff = Math.abs(feedbackTime - intakeTime);
        const withinDay = timeDiff < 24 * 60 * 60 * 1000; // Within 24 hours

        if (!withinDay) continue; // Skip if not within same day

        let matchScore = 0;

        // Exact mobile match is strongest
        if (intake.client?.mobile && feedback.client?.mobile &&
            intake.client.mobile === feedback.client.mobile) {
          matchScore += 100;
        } else if (intake.client?.fullName && feedback.client?.fullName &&
                   intake.client.fullName.toLowerCase() === feedback.client.fullName.toLowerCase()) {
          matchScore += 50; // Name match is secondary
        }

        // Therapist match adds confidence
        if (intake.ao?.therapistName && feedback.ao?.therapistName &&
            intake.ao.therapistName === feedback.ao.therapistName) {
          matchScore += 20;
        }

        // Prefer closer time differences
        if (timeDiff < 60 * 60 * 1000) { // Less than 1 hour
          matchScore += 10;
        }

        if (matchScore > bestScore) {
          bestScore = matchScore;
          bestMatch = feedback;
        }
      }

      if (bestMatch && bestScore >= 50 && intake.ao?.feelingPre && bestMatch.feedback?.feelingPost) {
        const improvement = bestMatch.feedback.feelingPost - intake.ao.feelingPre;
        improvements.push(improvement);
      }
    }

    const avgPre = preScores.length > 0
      ? Math.round((preScores.reduce((a, b) => a + b, 0) / preScores.length) * 10) / 10
      : 0;

    const avgPost = postScores.length > 0
      ? Math.round((postScores.reduce((a, b) => a + b, 0) / postScores.length) * 10) / 10
      : 0;

    const avgImprovement = improvements.length > 0
      ? Math.round((improvements.reduce((a, b) => a + b, 0) / improvements.length) * 10) / 10
      : 0;

    const result = {
      avgPre,
      avgPost,
      avgImprovement,
      preScoresCount: preScores.length,
      postScoresCount: postScores.length,
      matchedPairsCount: improvements.length,
      distribution: {
        pre: this.getScoreDistribution(preScores),
        post: this.getScoreDistribution(postScores)
      }
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get score distribution for charting
   */
  getScoreDistribution(scores) {
    const distribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
      6: 0, 7: 0, 8: 0, 9: 0, 10: 0
    };

    for (const score of scores) {
      if (distribution[score] !== undefined) {
        distribution[score]++;
      }
    }

    return Object.entries(distribution).map(([score, count]) => ({
      score: parseInt(score),
      count
    }));
  }

  /**
   * Get overall impact summary
   */
  async getOverallImpact() {
    const cacheKey = 'overall_impact';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const metadata = await this.loadAllMetadataFromMasterFiles();
    const trends = await this.calculateSubmissionTrends('daily');
    const feelingScores = await this.getFeelingScoreComparison();
    const therapists = await this.getTherapistWorkload();

    const intakes = metadata.filter(m => m.formType === 'seated' || m.formType === 'table');
    const feedback = metadata.filter(m => m.formType === 'feedback');
    const withConsent = intakes.filter(m => m.consent?.consentAll).length;
    const emailOptIn = intakes.filter(m => m.marketing?.emailOptIn).length;

    // Calculate week-over-week trend
    const recentTrends = trends.slice(-14); // Last 14 days
    const weekOverWeekChange = recentTrends.length >= 7
      ? ((recentTrends.slice(-7).reduce((a, b) => a + b.count, 0) -
          recentTrends.slice(-14, -7).reduce((a, b) => a + b.count, 0)) / Math.max(recentTrends.slice(-14, -7).reduce((a, b) => a + b.count, 0), 1)) * 100
      : 0;

    const result = {
      totalSubmissions: metadata.length,
      totalIntakes: intakes.length,
      totalFeedback: feedback.length,
      consentRate: intakes.length > 0 ? Math.round((withConsent / intakes.length) * 100) : 0,
      emailOptInRate: intakes.length > 0 ? Math.round((emailOptIn / intakes.length) * 100) : 0,
      recommendationRate: feedback.length > 0
        ? Math.round((feedback.filter(f => f.feedback?.wouldRecommend === 'Yes').length / feedback.length) * 100)
        : 0,
      avgImprovement: feelingScores.avgImprovement,
      matchedFeedbackRate: intakes.length > 0
        ? Math.round((feelingScores.matchedPairsCount / intakes.length) * 100)
        : 0,
      topTherapist: therapists[0]?.therapist || 'N/A',
      topTherapistSessions: therapists[0]?.sessionCount || 0,
      weekOverWeekChange: Math.round(weekOverWeekChange),
      lastUpdated: new Date().toISOString()
    };

    this.setCache(cacheKey, result);
    return result;
  }
}

module.exports = AnalyticsService;
