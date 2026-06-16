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

	// Helper to create a chainable query builder
	const createQueryBuilder = () => {
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
				return Promise.resolve({ data: [], error: null }).then(resolve);
			}
		};
		return builder;
	};

	const from = (/*table*/) => createQueryBuilder();

	supabase = { auth, from };

} else {
	supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };
