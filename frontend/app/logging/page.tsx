// app/logging/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";

interface Log {
  status: "Warning" | "Info";
  date: string;
  id: number;
  sensor: string;
  problem: string;
  note: string;
}

export default function DataLoggingPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  const sampleLogs: Log[] = [
    { status: "Warning", date: "2023-09-28", id: 1, sensor: "Humidity Sensor",   problem: "Humidity level above 80%",        note: "Activated dehumidifier" },
    { status: "Info",    date: "2023-09-29", id: 2, sensor: "Light Sensor",      problem: "Light levels normal",              note: "No action needed" },
    { status: "Warning", date: "2023-09-30", id: 3, sensor: "Temperature Sensor", problem: "Temperature below 18°C",       note: "Turned on heating" },
    { status: "Info",    date: "2023-10-01", id: 4, sensor: "Motion Sensor",     problem: "Motion detected in living room",   note: "Checked camera feed, no issues" },
    { status: "Warning", date: "2023-10-02", id: 5, sensor: "Smoke Detector",    problem: "Smoke detected in kitchen",        note: "False alarm, cooking smoke" },
    { status: "Info",    date: "2023-10-03", id: 6, sensor: "Temperature Sensor", problem: "Temperature stable at 22°C",    note: "Optimal conditions" },
    { status: "Warning", date: "2023-10-04", id: 7, sensor: "Humidity Sensor",   problem: "Humidity level below 30%",        note: "Activated humidifier" },
    { status: "Info",    date: "2023-10-05", id: 8, sensor: "Light Sensor",      problem: "Light levels low",                note: "Turned on lights" },
    { status: "Warning", date: "2023-10-06", id: 9, sensor: "Motion Sensor",     problem: "Motion detected in bedroom",      note: "Checked camera, pet movement" },
    { status: "Info",    date: "2023-10-07", id: 10, sensor: "Smoke Detector",   problem: "No smoke detected",                note: "Routine check" },
    { status: "Warning", date: "2023-10-08", id: 11, sensor: "Temperature Sensor", problem: "Temperature above 28°C",           note: "Turned on air conditioning" },
    { status: "Info",    date: "2023-10-09", id: 12, sensor: "Humidity Sensor",   problem: "Humidity level at 50%",           note: "Ideal conditions" },
    { status: "Warning", date: "2023-10-10", id: 13, sensor: "Light Sensor",      problem: "Light levels too high",           note: "Adjusted blinds" },
    { status: "Info",    date: "2023-10-11", id: 14, sensor: "Motion Sensor",     problem: "No motion detected",              note: "All quiet" },
    { status: "Warning", date: "2023-10-12", id: 15, sensor: "Smoke Detector",    problem: "Smoke detected in garage",        note: "Investigated, found exhaust fumes" },

  ];

  useEffect(() => {
    setLogs(sampleLogs);
  }, []);

  const deleteLog = (id: number) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      setLogs((prev) => prev.filter((log) => log.id !== id));
      // Reset to first page if current page has no items
      setCurrentPage(1);
    }
  };

  const filtered = logs.filter((row) => {
    if (statusFilter && row.status !== statusFilter) return false;
    if (dateFrom && row.date < dateFrom) return false;
    if (dateTo && row.date > dateTo) return false;
    if (
      searchText &&
      !Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(searchText.toLowerCase())
    )
      return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const paginatedLogs = filtered.slice(startIdx, startIdx + pageSize);

  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col p-6 overflow-auto">
        <Header />

        <div className="min-h-screen bg-gray-50 p-6 font-poppins text-gray-800">
          {/* Page Header */}
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-purple-700">Data Logging</h1>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow">
              Filter
            </button>
          </header>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-3 py-2 text-gray-800 focus:ring-purple-300 focus:border-purple-500"
            >
              <option value="">All Statuses</option>
              <option value="Warning">Warning</option>
              <option value="Info">Info</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded px-3 py-2 text-gray-800 focus:ring-purple-300 focus:border-purple-500"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border rounded px-3 py-2 text-gray-800 focus:ring-purple-300 focus:border-purple-500"
            />
            <input
              type="text"
              placeholder="Search data..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="border rounded px-3 py-2 text-gray-800 focus:ring-purple-300 focus:border-purple-500"
            />
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-purple-100">
                <tr>
                  {[
                    "Status",
                    "Date",
                    "ID",
                    "Sensor",
                    "Problem",
                    "Note",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedLogs.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={idx % 2 === 0 ? "bg-white" : "bg-purple-50"}
                  >
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          row.status === "Warning"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-900">{row.date}</td>
                    <td className="px-4 py-2 text-gray-900">{row.id}</td>
                    <td className="px-4 py-2 text-gray-900">{row.sensor}</td>
                    <td className="px-4 py-2 text-gray-900">{row.problem}</td>
                    <td className="px-4 py-2 text-gray-900">{row.note}</td>
                    <td className="px-4 py-2 space-x-2">
                      <button className="text-purple-600 hover:text-purple-800">
                        Download
                      </button>
                      <button className="text-blue-600 hover:text-blue-800">✏️</button>
                      <button
                        onClick={() => deleteLog(row.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex justify-end items-center space-x-2 text-gray-800">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded hover:bg-purple-100 disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded hover:bg-purple-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
