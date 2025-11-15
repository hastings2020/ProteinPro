import React, { useState, useEffect } from 'react';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Calendar.css';
import { fetchDailyTotals, fetchEntriesByDate } from '../services/api';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

const Calendar = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyTotals, setDailyTotals] = useState({});
  const [selectedDayEntries, setSelectedDayEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadMonthData(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    loadDayEntries(selectedDate);
  }, [selectedDate]);

  const loadMonthData = async (date) => {
    try {
      setLoading(true);
      const start = format(startOfMonth(date), 'yyyy-MM-dd');
      const end = format(endOfMonth(date), 'yyyy-MM-dd');

      const data = await fetchDailyTotals(user.id, start, end);

      // Convert array to object with dates as keys
      const totalsMap = {};
      data.forEach(day => {
        totalsMap[day.entry_date] = {
          protein: day.total_protein,
          calories: day.total_calories,
          count: day.entry_count
        };
      });

      setDailyTotals(totalsMap);
    } catch (error) {
      console.error('Error loading month data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDayEntries = async (date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const entries = await fetchEntriesByDate(user.id, dateStr);
      setSelectedDayEntries(entries);
    } catch (error) {
      console.error('Error loading day entries:', error);
    }
  };

  const getTileClassName = ({ date, view }) => {
    if (view !== 'month') return null;

    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = dailyTotals[dateStr];

    if (!dayData) return 'no-data';

    const target = user?.daily_protein_target || 150;
    const percentage = (dayData.protein / target) * 100;

    if (percentage >= 100) return 'goal-met';
    if (percentage >= 75) return 'goal-close';
    if (percentage >= 50) return 'goal-halfway';
    return 'goal-under';
  };

  const getTileContent = ({ date, view }) => {
    if (view !== 'month') return null;

    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = dailyTotals[dateStr];

    if (!dayData) return null;

    return (
      <div className="tile-content">
        <span className="tile-protein">{Math.round(dayData.protein)}g</span>
      </div>
    );
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handleActiveStartDateChange = ({ activeStartDate }) => {
    setCurrentMonth(activeStartDate);
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayData = dailyTotals[selectedDateStr];
  const target = user?.daily_protein_target || 150;

  return (
    <div className="page calendar-page">
      <div className="page-header">
        <h1 className="page-title">Calendar</h1>
        <p className="page-subtitle">Track your protein intake over time</p>
      </div>

      {/* Legend */}
      <div className="card legend-card">
        <h3 className="legend-title">Color Guide</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color goal-met"></div>
            <span>Goal Met (100%+)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color goal-close"></div>
            <span>Close (75-99%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color goal-halfway"></div>
            <span>Halfway (50-74%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color goal-under"></div>
            <span>Under (0-49%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color no-data"></div>
            <span>No Data</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card calendar-card">
        <ReactCalendar
          onChange={handleDateClick}
          value={selectedDate}
          tileClassName={getTileClassName}
          tileContent={getTileContent}
          onActiveStartDateChange={handleActiveStartDateChange}
          maxDate={new Date()}
        />
      </div>

      {/* Selected Day Details */}
      <div className="card day-details-card">
        <h3 className="card-header">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h3>

        {selectedDayData ? (
          <>
            <div className="day-summary">
              <div className="summary-item">
                <div className="summary-label">Total Protein</div>
                <div className="summary-value protein-value">
                  {Math.round(selectedDayData.protein)}g
                </div>
                <div className="summary-subtitle">
                  {Math.round((selectedDayData.protein / target) * 100)}% of {target}g goal
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Calories</div>
                <div className="summary-value">{selectedDayData.calories || 0}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Entries</div>
                <div className="summary-value">{selectedDayData.count}</div>
              </div>
            </div>

            {selectedDayEntries.length > 0 && (
              <div className="day-entries">
                <h4 className="entries-header">Foods Logged</h4>
                {selectedDayEntries.map(entry => (
                  <div key={entry.id} className="day-entry-item">
                    <div className="entry-info">
                      <div className="entry-name">{entry.food_name}</div>
                      <div className="entry-meta">
                        {entry.serving_size && <span>{entry.serving_size}</span>}
                        {entry.meal_type && <span className="meal-badge">{entry.meal_type}</span>}
                        {entry.entry_time && <span>{entry.entry_time.slice(0, 5)}</span>}
                      </div>
                    </div>
                    <div className="entry-protein">{entry.protein_grams}g</div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <p>No entries for this day.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
