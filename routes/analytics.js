const express = require('express');
const router = express.Router();
const { ensureDatabaseConnection } = require('../database/init');
const Analytics = require('../database/models/Analytics');

// POST /api/analytics/track - Track visitor analytics
router.post('/track', async (req, res) => {
  try {
    await ensureDatabaseConnection();
    const {
      visitorId,
      page,
      userAgent,
      referrer,
      ipAddress
    } = req.body;
    
    if (!visitorId || !page) {
      return res.status(400).json({ error: 'visitorId and page are required' });
    }
    
    const analytics = new Analytics({
      visitor_id: visitorId,
      page,
      user_agent: userAgent || '',
      referrer: referrer || '',
      ip_address: ipAddress || '',
      timestamp: new Date()
    });
    
    await analytics.save();
    
    res.json({ message: 'Analytics tracked successfully', id: analytics._id.toString() });
  } catch (error) {
    console.error('Error tracking analytics:', error);
    res.status(500).json({ error: 'Failed to track analytics' });
  }
});

// GET /api/analytics/visitors - Get visitor analytics
router.get('/visitors', async (req, res) => {
  try {
    await ensureDatabaseConnection();
    const { period = '30', page } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));
    
    const query = { timestamp: { $gte: daysAgo } };
    
    if (page) {
      query.page = page;
    }
    
    const visitors = await Analytics.find(query)
      .sort({ timestamp: -1 })
      .select('visitor_id page user_agent referrer ip_address timestamp');
    
    res.json({ 
      visitors: visitors.map(v => v.toObject()), 
      count: visitors.length 
    });
  } catch (error) {
    console.error('Error fetching visitor analytics:', error);
    res.status(500).json({ error: 'Failed to fetch visitor analytics' });
  }
});

// GET /api/analytics/stats - Get analytics statistics
router.get('/stats', async (req, res) => {
  try {
    await ensureDatabaseConnection();
    const { period = '30' } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));
    
    const analyticsData = await Analytics.find({ timestamp: { $gte: daysAgo } });
    
    const uniqueVisitorIds = [...new Set(analyticsData.map(a => a.visitor_id.toString()))];
    
    const totalVisitors = uniqueVisitorIds.length;
    const totalPageViews = analyticsData.length;
    const uniqueVisitors = uniqueVisitorIds.length;
    
    // Popular pages
    const popularPages = await Analytics.aggregate([
      { $match: { timestamp: { $gte: daysAgo } } },
      { $group: { _id: '$page', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
      { $project: { page: '$_id', views: 1, _id: 0 } }
    ]);
    
    // Daily visitors
    const dailyVisitors = await Analytics.aggregate([
      { $match: { timestamp: { $gte: daysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          visitors: { $addToSet: '$visitor_id' }
        }
      },
      {
        $project: {
          date: '$_id',
          visitors: { $size: '$visitors' },
          _id: 0
        }
      },
      { $sort: { date: -1 } }
    ]);
    
    // Device stats
    const deviceStats = await Analytics.aggregate([
      { $match: { timestamp: { $gte: daysAgo } } },
      {
        $project: {
          visitor_id: 1,
          device_type: {
            $cond: {
              if: {
                $or: [
                  { $regexMatch: { input: '$user_agent', regex: /Mobile|Android|iPhone/i } },
                ]
              },
              then: 'Mobile',
              else: {
                $cond: {
                  if: {
                    $or: [
                      { $regexMatch: { input: '$user_agent', regex: /Tablet|iPad/i } },
                    ]
                  },
                  then: 'Tablet',
                  else: 'Desktop'
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$device_type',
          count: { $addToSet: '$visitor_id' }
        }
      },
      {
        $project: {
          device_type: '$_id',
          count: { $size: '$count' },
          _id: 0
        }
      }
    ]);
    
    res.json({
      success: true,
      totalVisitors,
      totalPageViews,
      uniqueVisitors,
      popularPages,
      dailyVisitors,
      deviceStats
    });
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/timeline - Get visitor timeline
router.get('/timeline', async (req, res) => {
  try {
    await ensureDatabaseConnection();
    const { period = '7' } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));
    
    const timeline = await Analytics.aggregate([
      { $match: { timestamp: { $gte: daysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          unique_visitors: { $addToSet: '$visitor_id' },
          page_views: { $sum: 1 }
        }
      },
      {
        $project: {
          date: '$_id',
          unique_visitors: { $size: '$unique_visitors' },
          page_views: 1,
          _id: 0
        }
      },
      { $sort: { date: -1 } }
    ]);
    
    res.json({ success: true, timeline });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch timeline' });
  }
});

// GET /api/analytics/pages - Get page analytics
router.get('/pages', async (req, res) => {
  try {
    await ensureDatabaseConnection();
    const { period = '30' } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));
    
    const pages = await Analytics.aggregate([
      { $match: { timestamp: { $gte: daysAgo } } },
      {
        $group: {
          _id: '$page',
          views: { $sum: 1 },
          unique_visitors: { $addToSet: '$visitor_id' }
        }
      },
      {
        $project: {
          page: '$_id',
          views: 1,
          unique_visitors: { $size: '$unique_visitors' },
          bounce_rate: 0, // Calculate bounce rate if needed
          _id: 0
        }
      },
      { $sort: { views: -1 } }
    ]);
    
    res.json({ success: true, pages });
  } catch (error) {
    console.error('Error fetching page analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch page analytics' });
  }
});

module.exports = router;
