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

	const from = (/*table*/) => ({
		select: () => ({
			// supports .eq(...).single() or .maybeSingle()
			eq: () => ({
				maybeSingle: async () => ({ data: null, error: null }),
				single: async () => ({ data: null, error: null }),
			}),
			maybeSingle: async () => ({ data: null, error: null }),
			single: async () => ({ data: null, error: null }),
			// when called without chaining, return empty array
			then: async (resolve) => resolve({ data: [], error: null }),
		})
	});

	supabase = { auth, from };

} else {
	supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };
