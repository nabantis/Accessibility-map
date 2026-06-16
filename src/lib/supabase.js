import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const useMock = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

let supabase;

if (useMock) {
	// Simple in-memory mock to satisfy auth + minimal `from()` calls used by the app
	const listeners = new Set();
	// Restore user from localStorage on first load
	let currentUser = null;
	try {
		const stored = localStorage.getItem('mock_auth_user');
		if (stored) {
			currentUser = JSON.parse(stored);
		}
	} catch (e) {
		console.warn('Failed to restore mock user from localStorage:', e);
	}

	const auth = {
		getSession: async () => ({ data: { session: currentUser ? { user: currentUser } : null }, error: null }),
		getUser: async () => ({ data: { user: currentUser }, error: null }),
		onAuthStateChange: (callback) => {
			listeners.add(callback);
			const subscription = { unsubscribe: () => listeners.delete(callback) };
			return { data: { subscription } };
		},
		signInWithPassword: async ({ email }) => {
			// Accept any credentials in mock mode
			currentUser = { id: 'local-user', email };
			localStorage.setItem('mock_auth_user', JSON.stringify(currentUser));
			// notify listeners
			for (const cb of Array.from(listeners)) cb('SIGNED_IN', { user: currentUser });
			return { data: { user: currentUser, session: { user: currentUser } }, error: null };
		},
		signUp: async ({ email }) => {
			currentUser = { id: 'local-user', email };
			localStorage.setItem('mock_auth_user', JSON.stringify(currentUser));
			for (const cb of Array.from(listeners)) cb('SIGNED_IN', { user: currentUser });
			return { data: { user: currentUser, session: { user: currentUser } }, error: null };
		},
		signOut: async () => {
			currentUser = null;
			localStorage.removeItem('mock_auth_user');
			for (const cb of Array.from(listeners)) cb('SIGNED_OUT', { session: null });
			return { error: null };
		}
	};

	// Mock data for locations and features
	const mockLocations = [
		{ id: 1, name: 'Library Building', lat: 40.8078, lng: -73.9644, status: 'operational' },
		{ id: 2, name: 'Student Center', lat: 40.8089, lng: -73.9664, status: 'operational' },
		{ id: 3, name: 'Science Hall', lat: 40.8095, lng: -73.9650, status: 'under_repair' },
		{ id: 4, name: 'Dining Hall', lat: 40.8070, lng: -73.9670, status: 'operational' },
		{ id: 5, name: 'Athletic Center', lat: 40.8110, lng: -73.9640, status: 'operational' },
	];

	const mockAccessibilityFeatures = [
		{ id: 1, location_id: 1, type: 'lift', description: 'Main entrance elevator to 4th floor', status: 'operational' },
		{ id: 2, location_id: 1, type: 'ramp', description: 'Wheelchair accessible ramp at south entrance', status: 'operational' },
		{ id: 3, location_id: 1, type: 'wide_path', description: 'Wide corridors throughout', status: 'operational' },
		{ id: 4, location_id: 1, type: 'tactile_paving', description: 'Tactile paving near entrance', status: 'under_repair' },
		{ id: 5, location_id: 1, type: 'automatic_door', description: 'Automatic door at main entrance', status: 'operational' },
		{ id: 6, location_id: 1, type: 'high_contrast', description: 'High contrast signage in hallways', status: 'operational' },
		{ id: 7, location_id: 2, type: 'lift', description: 'Elevators to all floors', status: 'operational' },
		{ id: 8, location_id: 2, type: 'ramp', description: 'Main plaza accessible via ramp', status: 'operational' },
		{ id: 9, location_id: 2, type: 'automatic_door', description: 'Automatic doors at entrance', status: 'operational' },
		{ id: 10, location_id: 3, type: 'lift', description: 'Lift currently under maintenance', status: 'under_repair' },
		{ id: 11, location_id: 3, type: 'ramp', description: 'Secondary accessible entrance', status: 'operational' },
		{ id: 12, location_id: 4, type: 'lift', description: 'Service lift available', status: 'operational' },
		{ id: 13, location_id: 4, type: 'wide_path', description: 'Spacious dining area', status: 'operational' },
		{ id: 14, location_id: 5, type: 'lift', description: 'Building elevator access', status: 'operational' },
		{ id: 15, location_id: 5, type: 'automatic_door', description: 'Automatic entry doors', status: 'operational' },
	];

	// Helper to create a chainable query builder with mock data support
	const createQueryBuilder = (table) => {
		let data = [];
		// Return mock data for specific tables
		if (table === 'locations') {
			data = mockLocations;
		} else if (table === 'accessibility_features') {
			data = mockAccessibilityFeatures;
		} else if (table === 'accessibility_preferences') {
			data = [];
		}

		const builder = {
			// Chainable methods that return builder for fluent API
			select: function() { return this; },
			order: function() { return this; },
			limit: function() { return this; },
			eq: function() { return this; },
			// Terminal methods that return promises
			maybeSingle: async () => ({ data: null, error: null }),
			single: async () => ({ data: null, error: null }),
			upsert: async () => ({ data: null, error: null }),
			// Allow implicit async resolution (for Promise chaining)
			then: function(resolve) {
				return Promise.resolve({ data, error: null }).then(resolve);
			}
		};
		return builder;
	};

	const from = (table) => createQueryBuilder(table);

	// Mock realtime channel for notifications
	const channel = (/*channelName*/) => ({
		on: function() { return this; },
		subscribe: function() { return this; },
		unsubscribe: function() { return this; }
	});

	supabase = { auth, from, channel };

} else {
	supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };
