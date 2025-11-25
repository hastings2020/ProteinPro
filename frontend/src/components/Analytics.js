import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import './Analytics.css';
import { fetchAnalytics, exportData } from '../services/api';
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { FaDownload, FaTrophy, FaFire, FaChartLine } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = ({ user }) => {
  const [period, setPeriod] = useState('week'); // week, month, 3months, year, custom
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(period);
      const data = await fetchAnalytics(user.id, startDate, endDate);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalyticsData({ dailyData: [], statistics: { avgProtein: 0, daysMetGoal: 0, goalPercentage: 0, currentStreak: 0, target: user?.daily_protein_target || 150, totalDays: 0 } });
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (period) => {
    const today = new Date();
    let startDate, endDate;

    switch (period) {
      case 'week':
        startDate = format(subDays(today, 6), 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
        break;
      case 'month':
        startDate = format(subDays(today, 29), 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
        break;
      case '3months':
        startDate = format(subMonths(today, 3), 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
        break;
      case 'year':
        startDate = format(subMonths(today, 11), 'yyyy-MM-01');
        endDate = format(today, 'yyyy-MM-dd');
        break;
      case 'custom':
        startDate = customStartDate || format(subDays(today, 29), 'yyyy-MM-dd');
        endDate = customEndDate || format(today, 'yyyy-MM-dd');
        break;
      default:
        startDate = format(subDays(today, 6), 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
    }

    return { startDate, endDate };
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod === 'custom') {
      setShowCustomDatePicker(true);
      // Set default custom dates
      const today = new Date();
      const thirtyDaysAgo = subDays(today, 29);
      setCustomStartDate(format(thirtyDaysAgo, 'yyyy-MM-dd'));
      setCustomEndDate(format(today, 'yyyy-MM-dd'));
    } else {
      setShowCustomDatePicker(false);
    }
  };

  const applyCustomDateRange = () => {
    if (!customStartDate || !customEndDate) {
      alert('Please select both start and end dates');
      return;
    }
    if (new Date(customStartDate) > new Date(customEndDate)) {
      alert('Start date must be before end date');
      return;
    }
    loadAnalytics();
  };

  const getChartData = () => {
    if (!analyticsData || !analyticsData.dailyData) {
      return { labels: [], datasets: [] };
    }

    const { startDate, endDate } = getDateRange(period);
    let labels = [];
    let proteinData = [];
    const target = analyticsData.statistics.target;

    if (period === 'year') {
      // Group by month for yearly view
      const monthlyData = {};
      analyticsData.dailyData.forEach(day => {
        const monthKey = day.entry_date.substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { total: 0, count: 0 };
        }
        monthlyData[monthKey].total += day.total_protein;
        monthlyData[monthKey].count++;
      });

      // Generate all months in range
      const start = new Date(startDate);
      const end = new Date(endDate);
      let currentDate = new Date(start);

      while (currentDate <= end) {
        const monthKey = format(currentDate, 'yyyy-MM');
        const monthLabel = format(currentDate, 'MMM yyyy');
        labels.push(monthLabel);

        if (monthlyData[monthKey]) {
          const avgProtein = monthlyData[monthKey].total / monthlyData[monthKey].count;
          proteinData.push(Math.round(avgProtein));
        } else {
          proteinData.push(0);
        }

        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    } else if (period === '3months') {
      // Group by week for 3 months view
      const weeklyData = {};
      analyticsData.dailyData.forEach(day => {
        const date = new Date(day.entry_date);
        const weekStart = startOfWeek(date);
        const weekKey = format(weekStart, 'yyyy-MM-dd');
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { total: 0, count: 0 };
        }
        weeklyData[weekKey].total += day.total_protein;
        weeklyData[weekKey].count++;
      });

      // Generate all weeks in range
      const start = new Date(startDate);
      const end = new Date(endDate);
      let currentDate = startOfWeek(start);

      while (currentDate <= end) {
        const weekKey = format(currentDate, 'yyyy-MM-dd');
        const weekLabel = format(currentDate, 'MMM d');
        labels.push(weekLabel);

        if (weeklyData[weekKey]) {
          const avgProtein = weeklyData[weekKey].total / weeklyData[weekKey].count;
          proteinData.push(Math.round(avgProtein));
        } else {
          proteinData.push(0);
        }

        currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
    } else {
      // Daily view for week and month
      const dataMap = {};
      analyticsData.dailyData.forEach(day => {
        dataMap[day.entry_date] = day.total_protein;
      });

      const start = new Date(startDate);
      const end = new Date(endDate);
      const allDates = eachDayOfInterval({ start, end });

      allDates.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const label = period === 'week' ? format(date, 'EEE') : format(date, 'MMM d');
        labels.push(label);
        proteinData.push(dataMap[dateStr] ? Math.round(dataMap[dateStr]) : 0);
      });
    }

    return {
      labels,
      datasets: [
        {
          label: 'Protein (g)',
          data: proteinData,
          backgroundColor: 'rgba(102, 126, 234, 0.7)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 2,
          borderRadius: 8,
        },
        {
          label: 'Target',
          data: labels.map(() => target),
          type: 'line',
          borderColor: 'rgba(244, 67, 54, 0.8)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + 'g';
          }
        }
      }
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportData(user.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proteinpro-data-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="page analytics-page">
        <div className="loading-text">Loading analytics...</div>
      </div>
    );
  }

  const stats = analyticsData?.statistics || {};
  const hasData = analyticsData?.dailyData && analyticsData.dailyData.length > 0;

  return (
    <div className="page analytics-page">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Track your progress and insights</p>
      </div>

      {!hasData && !loading && (
        <div className="empty-state-analytics">
          <div className="empty-icon">📊</div>
          <h3>No Data Yet</h3>
          <p>Start tracking your protein intake to see analytics and insights!</p>
          <p className="empty-hint">Analytics will show here once you add some entries.</p>
        </div>
      )}

      {hasData && (
        <>
      {/* Period Selector */}
      <div className="period-selector">
        <button
          className={`period-btn ${period === 'week' ? 'active' : ''}`}
          onClick={() => handlePeriodChange('week')}
        >
          7 Days
        </button>
        <button
          className={`period-btn ${period === 'month' ? 'active' : ''}`}
          onClick={() => handlePeriodChange('month')}
        >
          30 Days
        </button>
        <button
          className={`period-btn ${period === '3months' ? 'active' : ''}`}
          onClick={() => handlePeriodChange('3months')}
        >
          90 Days
        </button>
        <button
          className={`period-btn ${period === 'year' ? 'active' : ''}`}
          onClick={() => handlePeriodChange('year')}
        >
          Year
        </button>
        <button
          className={`period-btn ${period === 'custom' ? 'active' : ''}`}
          onClick={() => handlePeriodChange('custom')}
        >
          Custom
        </button>
      </div>

      {/* Custom Date Range Picker */}
      {showCustomDatePicker && (
        <div className="custom-date-range">
          <div className="date-range-inputs">
            <div className="date-range-input">
              <label>Start Date:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                max={customEndDate || new Date().toISOString().split('T')[0]}
                className="date-input"
              />
            </div>
            <div className="date-range-input">
              <label>End Date:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                min={customStartDate}
                max={new Date().toISOString().split('T')[0]}
                className="date-input"
              />
            </div>
          </div>
          <button className="btn btn-primary apply-date-btn" onClick={applyCustomDateRange}>
            Apply Date Range
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <FaChartLine />
          </div>
          <div className="stat-content">
            <div className="stat-label">Average Protein</div>
            <div className="stat-value">{stats.avgProtein || 0}g</div>
            <div className="stat-subtitle">per day</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' }}>
            <FaTrophy />
          </div>
          <div className="stat-content">
            <div className="stat-label">Goal Met</div>
            <div className="stat-value">{stats.daysMetGoal || 0}</div>
            <div className="stat-subtitle">
              {stats.totalDays > 0 ? `${stats.goalPercentage}% of days` : 'No data'}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)' }}>
            <FaFire />
          </div>
          <div className="stat-content">
            <div className="stat-label">Current Streak</div>
            <div className="stat-value">{stats.currentStreak || 0}</div>
            <div className="stat-subtitle">days in a row</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card chart-card">
        <div className="chart-header">
          <h3 className="chart-title">
            {period === 'week' && 'Last 7 Days'}
            {period === 'month' && 'Last 30 Days'}
            {period === '3months' && 'Last 90 Days'}
            {period === 'year' && 'Last 12 Months (Avg)'}
            {period === 'custom' && `Custom Range: ${customStartDate} to ${customEndDate}`}
          </h3>
        </div>
        <div className="chart-container">
          <Bar data={getChartData()} options={chartOptions} />
        </div>
      </div>

      {/* Export Button */}
      <button className="btn btn-secondary export-btn" onClick={handleExport}>
        <FaDownload /> Export Data as CSV
      </button>
      </>
      )}
    </div>
  );
};

export default Analytics;
