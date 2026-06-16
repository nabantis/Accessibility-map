import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const STATUS_OPTIONS = [
  { id: 'operational', label: 'Operational', color: 'var(--status-green, #22c55e)' },
  { id: 'under_repair', label: 'Under Repair', color: 'var(--status-yellow, #f59e0b)' },
  { id: 'inaccessible', label: 'Inaccessible', color: 'var(--status-red, #ef4444)' },
];

const STATUS_COLOR = {
  operational: 'var(--status-green, #22c55e)',
  under_repair: 'var(--status-yellow, #f59e0b)',
  inaccessible: 'var(--status-red, #ef4444)',
};



export default function Sidebar({ onLocationSelect, selectedLocationId, onLocationsLoaded }) {
  const [locations, setLocations] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [accessFeatures, setAccessFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState({
    operational: true,
    under_repair: true,
    inaccessible: true,
  });
  const [featureFilters, setFeatureFilters] = useState({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [locRes, prefRes, featureRes] = await Promise.all([
          supabase.from('locations').select('*'),
          supabase.from('accessibility_preferences').select('*'),
          supabase.from('accessibility_features').select('*'),
        ]);

        if (locRes.error) throw locRes.error;
        if (featureRes.error) throw featureRes.error;
        if (prefRes.error) {
          console.warn('Preferences query failed:', prefRes.error.message);
        }

        const nextLocations = locRes.data ?? [];
        const nextPreferences = prefRes.data ?? [];
        const nextAccessFeatures = featureRes.data ?? [];

        setLocations(nextLocations);
        setPreferences(nextPreferences);
        setAccessFeatures(nextAccessFeatures);
        setFeatureFilters(
          Object.fromEntries(
            nextPreferences.map((preference) => [String(preference.id), true]),
          ),
        );
      } catch (err) {
        setError(err.message ?? 'Failed to load sidebar data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  function normalizeStatus(value) {
    const normalized = String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');

    if (normalized === 'underrepair') return 'under_repair';
    if (normalized === 'not_accessible') return 'inaccessible';
    if (normalized === 'accessible') return 'operational';
    return normalized || 'operational';
  }

  function getLocationRows(locationId) {
    return accessFeatures.filter(
      (row) => String(row.location_id) === String(locationId),
    );
  }

  function getLocationStatus(locationId) {
    const rows = getLocationRows(locationId);
    if (!rows.length) return 'operational';

    const statuses = rows.map((row) => normalizeStatus(row.status));
    if (statuses.includes('inaccessible')) return 'inaccessible';
    if (statuses.includes('under_repair')) return 'under_repair';
    return 'operational';
  }

  function getLocationName(location) {
    return (
      location.name ??
      location.location_name ??
      location.title ??
      `Location ${location.id}`
    );
  }

  function getLocationDescription(location) {
    return (
      location.description ??
      location.details ??
      location.category ??
      location.address ??
      ''
    );
  }

  function getPreferenceLabel(preference) {
    return (
      preference.name ??
      preference.preference_name ??
      preference.label ??
      preference.title ??
      String(preference.id)
    );
  }

  function rowMatchesPreference(row, preference) {
    const possibleIds = [
      row.preference_id,
      row.accessibility_preference_id,
      row.feature_id,
      row.preference,
      row.preference_key,
    ]
      .filter(Boolean)
      .map(String);

    if (possibleIds.includes(String(preference.id))) {
      return true;
    }

    const preferenceLabel = getPreferenceLabel(preference).toLowerCase();
    const possibleNames = [
      row.feature_name,
      row.feature_type,
      row.preference_name,
      row.name,
      row.label,
      row.type,
    ]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase());

    return possibleNames.includes(preferenceLabel);
  }

  const filteredLocations = useMemo(() => {
    const anyFeatureFilterOff = Object.values(featureFilters).some((value) => !value);

    return locations.filter((location) => {
      const locationStatus = getLocationStatus(location.id);
      if (!statusFilters[locationStatus]) return false;

      if (anyFeatureFilterOff) {
        const activePreferenceIds = Object.entries(featureFilters)
          .filter(([, enabled]) => enabled)
          .map(([id]) => id);

        const matchesAnyActivePreference = getLocationRows(location.id).some((row) =>
          preferences.some(
            (preference) =>
              activePreferenceIds.includes(String(preference.id)) &&
              rowMatchesPreference(row, preference),
          ),
        );

        if (!matchesAnyActivePreference) return false;
      }

      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      return (
        getLocationName(location).toLowerCase().includes(query) ||
        getLocationDescription(location).toLowerCase().includes(query)
      );
    }).sort((a, b) => getLocationName(a).localeCompare(getLocationName(b)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, statusFilters, featureFilters, preferences, searchQuery, accessFeatures]);

  function toggleStatus(id) {
    setStatusFilters((current) => ({ ...current, [id]: !current[id] }));
  }

  function toggleFeature(id) {
    const key = String(id);
    setFeatureFilters((current) => ({ ...current, [key]: !current[key] }));
  }

  function clearAllFilters() {
    setStatusFilters({
      operational: true,
      under_repair: true,
      inaccessible: true,
    });
    setFeatureFilters(
      Object.fromEntries(
        preferences.map((preference) => [String(preference.id), true]),
      ),
    );
    setSearchQuery('');
  }

  useEffect(() => {
    onLocationsLoaded?.(
      filteredLocations.map((loc) => ({
        ...loc,
        status: getLocationStatus(loc.id),
      }))
    );
  }, [filteredLocations, onLocationsLoaded]);

  return (
    <aside className="sidebar" style={styles.sidebar}>
      <div style={styles.searchWrap}>
        <svg style={styles.searchIcon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle
            cx="6.5"
            cy="6.5"
            r="4.75"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <line
            x1="10.5"
            y1="10.5"
            x2="14"
            y2="14"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Search locations..."
          aria-label="Search locations"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      <div style={styles.scroll}>
        {loading && (
          <p style={styles.message} role="status" aria-live="polite">
            Loading...
          </p>
        )}
        {error && (
          <p style={styles.errorMessage} role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <Section title="STATUS FILTER">
              {STATUS_OPTIONS.map((status) => (
                <FilterRow key={status.id}>
                  <input
                    type="checkbox"
                    checked={Boolean(statusFilters[status.id])}
                    onChange={() => toggleStatus(status.id)}
                    style={styles.checkbox}
                  />
                  <span
                    style={{
                      ...styles.statusDot,
                      background: status.color,
                      border: '1px solid #222',
                    }}
                  />
                  <span style={styles.filterLabel}>{status.label}</span>
                </FilterRow>
              ))}
            </Section>

            <Section title={`LOCATIONS (${filteredLocations.length})`}>
              {filteredLocations.length === 0 && (
                <p style={styles.message}>No locations match the current filters.</p>
              )}

              {filteredLocations.map((location) => {
                const status = getLocationStatus(location.id);
                const active = String(selectedLocationId) === String(location.id);

                return (
                  <button
                    key={location.id}
                    type="button"
                    style={{
                      ...styles.locationButton,
                      ...(active ? styles.locationButtonActive : {}),
                    }}
                    onClick={() => onLocationSelect?.(location)}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        ...styles.locationIndicator,
                        background: STATUS_COLOR[status] ?? '#64748b',
                        border: '1px solid #222',
                      }}
                    />
                    <span
                      style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
                    >
                      Status: {status.replace(/_/g, ' ')}
                    </span>
                    <span style={styles.locationText}>
                      <span style={styles.locationName}>
                        {getLocationName(location)}
                      </span>
                      {getLocationDescription(location) && (
                        <span style={styles.locationDescription}>
                          {getLocationDescription(location)}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </Section>

            <Section title="MAP LEGEND">
              <LegendRow color="var(--status-green, #22c55e)" label="All features operational" />
              <LegendRow color="var(--status-yellow, #f59e0b)" label="Some features under repair" />
              <LegendRow color="var(--status-red, #ef4444)" label="Feature inaccessible" />
            </Section>
          </>
        )}
      </div>
    </aside>
  );
}

function Section({ title, children }) {
  return (
    <section style={styles.section}>
      <p style={styles.sectionTitle}>{title}</p>
      {children}
    </section>
  );
}

function FilterRow({ children }) {
  return <label style={styles.filterRow}>{children}</label>;
}

function LegendRow({ color, label }) {
  return (
    <div style={styles.legendRow}>
      <span style={{ ...styles.statusDot, background: color, border: '1px solid #222' }} />
      <span style={styles.legendText}>{label}</span>
    </div>
  );
}

const styles = {
  sidebar: {
    width: 276,
    minWidth: 276,
    height: '100%',
    background: 'var(--sidebar-bg, #162431)',
    color: 'var(--sidebar-text, #e2e8f0)',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid rgba(148, 163, 184, 0.18)',
    boxShadow: '12px 0 32px rgba(2, 6, 23, 0.22)',
    overflow: 'hidden',
  },
  searchWrap: {
    position: 'relative',
    padding: '16px 14px 12px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
  },
  searchIcon: {
    position: 'absolute',
    left: 24,
    top: '50%',
    transform: 'translateY(-48%)',
    color: '#7f93a8',
    width: 15,
    height: 15,
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid rgba(148, 163, 184, 0.16)',
    background: 'var(--sidebar-input-bg, #1b2a39)',
    color: 'var(--sidebar-text, #d9e4ef)',
    borderRadius: 12,
    padding: '11px 14px 11px 34px',
    fontSize: 15,
    outline: 'none',
  },
  scroll: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: 24,
  },
  section: {
    padding: '14px 14px 12px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
  },
  sectionTitle: {
    margin: '0 0 14px',
    fontSize: 12,
    lineHeight: 1.2,
    letterSpacing: '0.08em',
    color: 'var(--sidebar-muted, #6f879f)',
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '7px 0',
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: '#19d3f3',
    width: 13,
    height: 13,
    margin: 0,
    flexShrink: 0,
    cursor: 'pointer',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },
  filterLabel: {
    color: 'var(--sidebar-text, #dde7f1)',
    fontSize: 14,
    lineHeight: 1.3,
  },
  clearButton: {
    marginTop: 12,
    padding: 0,
    background: 'none',
    border: 'none',
    color: '#14d9f5',
    fontSize: 14,
    cursor: 'pointer',
    textAlign: 'left',
  },
  locationButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '12px 10px',
    border: 'none',
    borderRadius: 12,
    background: 'transparent',
    color: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
    position: 'relative',
  },
  locationButtonActive: {
    background: 'rgba(20, 217, 245, 0.08)',
    boxShadow: 'inset 0 0 0 1px rgba(20, 217, 245, 0.14)',
  },
  locationIndicator: {
    width: 9,
    height: 9,
    borderRadius: '50%',
    marginTop: 7,
    flexShrink: 0,
  },
  locationText: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  locationName: {
    fontSize: 15,
    lineHeight: 1.25,
    fontWeight: 600,
    color: 'var(--sidebar-text, #f1f5f9)',
  },
  locationDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 1.35,
    color: 'var(--sidebar-muted, #7f93a8)',
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '4px 0',
  },
  legendText: {
    color: 'var(--sidebar-muted, #7f93a8)',
    fontSize: 13,
  },
  message: {
    margin: 0,
    color: 'var(--sidebar-muted, #7f93a8)',
    fontSize: 13,
  },
  errorMessage: {
    margin: 0,
    color: '#fca5a5',
    fontSize: 13,
  },
};