'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import {
    Mapping,
    fetchMappings,
    createMapping,
    updateMapping,
    deleteMapping,
    ActionType,
    GestureAction,
    GestureLog
} from '../../models/gestureMapping';
import { getSocket, subscribe } from "@/lib/socket";

// API Base URL
const API_BASE_URL = 'http://127.0.0.1:8000';

const GESTURES = [
    'open_palm',
    'fist',
    'thumbs_up',
    'thumbs_down',
    'peace',
    'four_fingers',
];

const ACTIONS = [
    'fan_on',
    'fan_off',
    'fan_speed_up',
    'fan_speed_down',
    'light_on',
    'light_off',
    'light_color',
];

export default function GestureConfigPage() {
    const [mappings, setMappings] = useState<Mapping[]>([]);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState<Partial<Mapping>>({
        gesture_name: 'open_palm',
        action_type: 'fan_on',
        action_value: '',
        is_active: true,
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [message, setMessage] = useState('');

    const [logs, setLogs] = useState<GestureLog[]>([]);

    // =========================
    // Load mappings
    // =========================
    const loadMappings = async () => {
        setLoading(true);
        try {
            const data = await fetchMappings();
            setMappings(data);
        } catch (err) {
            console.error(err);
            setMessage('❌ Failed to load mappings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMappings();
    }, []);

    useEffect(() => {
        getSocket(); // ensure socket initialized
 
        const unsubscribe = subscribe((data) => {
            if (data.type === "gesture_log") {
                setLogs((prev) => [
                    {
                        gesture: data.gesture,
                        confidence: data.confidence,
                        actions: data.actions || [],
                        timestamp: data.timestamp,
                        status: data.status
                    },
                    ...prev.slice(0, 19)
                ]);
            }
        });

        return () => unsubscribe();
    }, []);

    // fetch logs on page load
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/activitylog/gestures`);
                const data = await res.json();

	    // {
                // "data": []
            // }
                if (data.data) {
                    setLogs(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch gesture logs:", err);
            }
        };

        fetchLogs();
    }, []);

    // =========================
    // Handle form submit
    // =========================
    const normalizePayload = (form: Partial<Mapping>) => {
	return {
	    ...form,
	    action_type: form.action_type?.toLowerCase() as ActionType, // 🔥 FIX
	    action_value:
	        form.action_value === '' ? null : form.action_value, // 🔥 FIX
	};
    };

    const handleSubmit = async () => {
        try {
            if (!form.gesture_name || !form.action_type) {
                setMessage('⚠️ Missing required fields');
                return;
            }

            if (editingId) {
                await updateMapping(editingId, normalizePayload(form));
                setMessage('✅ Mapping updated');
            } else {
                await createMapping(normalizePayload(form));
                setMessage('✅ Mapping created');
            }

            setForm({
                gesture_name: 'open_palm',
                action_type: 'fan_on',
                action_value: '',
                is_active: true,
            });
            setEditingId(null);
            loadMappings();
        } catch (err) {
            console.error(err);
            setMessage('❌ Failed to save mapping');
        }
    };

    // =========================
    // Edit mapping
    // =========================
    const handleEdit = (m: Mapping) => {
        setForm(m);
        setEditingId(m.id);
    };

    // =========================
    // Delete mapping
    // =========================
    const handleDelete = async (id: string) => {
        if (!confirm('Delete this mapping?')) return;

        try {
            await deleteMapping(id);
            setMessage('🗑️ Mapping deleted');
            loadMappings();
        } catch (err) {
            console.error(err);
            setMessage('❌ Delete failed');
        }
    };

    // =========================
    // Toggle active
    // =========================
    const toggleActive = async (m: Mapping) => {
        try {
            await updateMapping(m.id, { is_active: !m.is_active });
            loadMappings();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">

            <Sidebar />

            <div className="flex-1 flex p-6 flex-col p-6 space-y-6">

	        {/* Shared header */}
                <Header />

		{/* Page title */}
                <h1 className="text-2xl font-bold mb-6 text-black">
                    Gesture Configuration
                </h1>


		{/* ================= FORM ================= */}
		<div className="bg-white p-6 rounded-xl shadow mb-6 border">
		    <h2 className="text-xl font-semibold mb-6 text-black">
			{editingId ? 'Edit Mapping' : 'Create Mapping'}
		    </h2>

		    {/* FORM GRID */}
		    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

			{/* Gesture */}
			<div className="flex flex-col gap-1">
			    <label className="text-sm font-medium text-black">
				Gesture
			    </label>
			    <select
				value={form.gesture_name}
				onChange={(e) =>
				    setForm({ ...form, gesture_name: e.target.value })
				}
				className="border rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-purple-500 outline-none"
			    >
				{GESTURES.map((g) => (
				    <option key={g}>{g}</option>
				))}
			    </select>
			</div>

			{/* Action */}
			<div className="flex flex-col gap-1">
			    <label className="text-sm font-medium text-black">
				Action
			    </label>
			    <select
				value={form.action_type}
				onChange={(e) =>
				    setForm({ ...form, action_type: e.target.value as ActionType})
				}
				className="border rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-purple-500 outline-none"
			    >
				{ACTIONS.map((a) => (
				    <option key={a}>{a}</option>
				))}
			    </select>
			</div>

			{/* Value */}
			<div className="flex flex-col gap-1">
			    <label className="text-sm font-medium text-black">
				Value (optional)
			    </label>
			    <input
				type="text"
				placeholder="e.g. 50 or #00CFFF"
				value={form.action_value ?? ''}
				onChange={(e) =>
				    setForm({ ...form, action_value: e.target.value })
				}
				className="border rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-purple-500 outline-none"
			    />
			</div>

			{/* Active toggle (modern switch) */}
			<div className="flex flex-col justify-end">
			    <label className="text-sm font-medium text-black mb-2">
				Status
			    </label>

			    <button
				onClick={() =>
				    setForm({ ...form, is_active: !form.is_active })
				}
				className={`w-16 h-8 flex items-center rounded-full p-1 transition ${
				    form.is_active ? 'bg-green-500' : 'bg-gray-300'
				}`}
			    >
				<div
				    className={`bg-white w-6 h-6 rounded-full shadow transform transition ${
					form.is_active ? 'translate-x-8' : ''
				    }`}
				/>
			    </button>

			    <span className="text-xs text-gray-500 mt-1">
				{form.is_active ? 'Active' : 'Inactive'}
			    </span>
			</div>
		    </div>

		    {/* ACTION BUTTONS */}
		    <div className="mt-6 flex items-center gap-3">
			<button
			    onClick={handleSubmit}
			    className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-medium transition"
			>
			    {editingId ? 'Update Mapping' : 'Create Mapping'}
			</button>

			{editingId && (
			    <button
				onClick={() => {
				    setEditingId(null);
				    setForm({
					gesture_name: 'open_palm',
					action_type: 'fan_on',
					action_value: '',
					is_active: true,
				    });
				}}
				className="bg-gray-200 hover:bg-gray-300 text-black px-5 py-2 rounded-lg"
			    >
				Cancel
			    </button>
			)}
		    </div>

		    {/* MESSAGE */}
		    {message && (
			<p className="mt-4 text-sm text-black">
			    {message}
			</p>
		    )}
		</div>

		{/* ================= CARDS ================= */}
		<div className="bg-white p-6 rounded shadow">
		    <h2 className="text-lg font-semibold mb-4 text-black">
			Current Mappings
		    </h2>

		    {loading ? (
			<p className="text-black">Loading...</p>
		    ) : (
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
			    {mappings.map((m) => (
				<div
				    key={m.id}
				    className="border rounded-lg p-4 shadow-sm hover:shadow-md transition bg-white"
				>
				    {/* HEADER */}
				    <div className="flex justify-between items-center mb-2">
					<h3 className="font-semibold text-black text-lg">
					    {m.gesture_name}
					</h3>

					{/* Active Badge */}
					<span
					    className={`px-3 py-1 text-xs rounded-full font-semibold ${
						m.is_active
						    ? 'bg-green-100 text-green-700'
						    : 'bg-gray-200 text-gray-600'
					    }`}
					>
					    {m.is_active ? 'Active' : 'Inactive'}
					</span>
				    </div>

				    {/* VALUE */}
				    <p className="text-sm text-black mb-1">
					<span className="font-medium">Value:</span>{' '}
					{m.action_value ?? '-'}
				    </p>

				    {/* CREATED */}
				    <p className="text-xs text-gray-500 mb-3">
					{m.created_at
					    ? new Date(m.created_at).toLocaleString()
					    : '-'}
				    </p>

				    {/* ACTION TYPE */}
				    <div className="mb-3">
					<span className="text-sm font-medium text-black">
					    Action:
					</span>
					<div className="text-sm text-purple-600 font-semibold">
					    {m.action_type}
					</div>
				    </div>

				    {/* BUTTONS */}
				    <div className="flex justify-end gap-2">
					<button
					    onClick={() => handleEdit(m)}
					    className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1 rounded text-sm"
					>
					    Edit
					</button>

					<button
					    onClick={() => handleDelete(m.id)}
					    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
					>
					    Delete
					</button>
				    </div>
				</div>
			    ))}
			</div>
		    )}
		</div>

	    {/* Log detected gestures */}
            <div className="bg-white p-6 rounded-xl shadow border">

	        <h2 className="text-xl font-semibold mb-6 text-black">
		    Gesture Logs
	        </h2>

	        {logs.length === 0 ? (
		    <p className="text-gray-500 text-sm">
		        No gestures detected yet...
		    </p>
	        ) : (
		    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
		        {logs.map((log, index) => (
			    <div
			        key={index}
			        className="border rounded-lg p-4 shadow-sm hover:shadow-md transition bg-white"
			    >
			        {/* HEADER */}
			        <div className="flex justify-between items-center mb-1">
				    <span className="font-semibold text-black">
				        {log.gesture}
				    </span>

				    <span className="text-xs text-gray-500">
				        {new Date(log.timestamp).toLocaleTimeString()}
				    </span>
			        </div>

			        {/* CONFIDENCE */}
			        <div className="text-sm text-gray-600 mb-1">
				    Confidence:{" "}
				    {log.confidence
				        ? log.confidence.toFixed(2)
				        : "-"}
			        </div>

			        {/* ACTIONS */}
			        {log.actions?.length > 0 && (
				    <div className="text-sm text-purple-600 font-medium mb-1">
				        {log.actions.map((a, i) => (
					    <div key={i}>
					        -> {a.action} {a.value ?? ""}
					    </div>
				        ))}
				    </div>
			        )}

			        {/* STATUS */}
			        <div
				    className={`text-xs font-medium ${
				        log.status === "processing"
					    ? "text-yellow-500"
					    : "text-green-600"
				    }`}
			        >
				    {log.status}
			        </div>
			    </div>
		        ))}
		    </div>
	        )}
	    </div>
        </div>
    </div>
    );
}
