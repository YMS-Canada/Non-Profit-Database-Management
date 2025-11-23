import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMonthlyReport } from '../lib/api';
import './MonthlyReportsPage.css';

export default function MonthlyReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const response = await getMonthlyReport();
        setReportData(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Group data by month
  const dataByMonth = reportData.reduce((acc, item) => {
    if (!acc[item.month]) {
      acc[item.month] = [];
    }
    acc[item.month].push(item);
    return acc;
  }, {});

  // Sort months in descending order
  const sortedMonths = Object.keys(dataByMonth).sort().reverse();

  // Format month for display (e.g., "2025-11" -> "November 2025")
  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) return <div className="mr-page mr-loading">Loading monthly reports...</div>;
  if (error) return <div className="mr-page mr-error">Error: {error}</div>;

  return (
    <div className="mr-page">
      <div className="mr-header">
        <div>
          <h1>Monthly Budget Reports</h1>
        </div>
        <div className="mr-actions">
          <Link to="/admin-dashboard" className="mr-btn mr-back">← Dashboard</Link>
        </div>
      </div>

      {reportData.length === 0 ? (
        <div className="mr-empty">
          <h2>No data available</h2>
          <p>Budget requests will appear here once they are submitted and approved.</p>
        </div>
      ) : (
        <>
          {sortedMonths.map((month) => {
            const monthData = dataByMonth[month];
            const monthTotal = monthData.reduce((sum, item) => sum + item.total_requested, 0);
            
            return (
              <div key={month} className="mr-month-section">
                <h2 className="mr-month-title">{formatMonth(month)}</h2>
                <div className="mr-table-container">
                  <table className="mr-table">
                    <thead>
                      <tr>
                        <th>City</th>
                        <th className="mr-amount-col">Total ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthData.map((row, index) => (
                        <tr key={index}>
                          <td className="mr-city">{row.city}</td>
                          <td className="mr-amount-col">${row.total_requested.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td><strong>{formatMonth(month)} Total</strong></td>
                        <td className="mr-amount-col"><strong>${monthTotal.toFixed(2)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
