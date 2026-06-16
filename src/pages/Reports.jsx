import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Map.css";

export default function Reports({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/map');
  };

  const [locations, setLocations]   = useState([]);
  const [features, setFeatures]     = useState([]);
  const [locationId, setLocationId] = useState("");
  const [featureId, setFeatureId]   = useState("");
  const [description, setDesc]      = useState("");
  const [errors, setErrors]         = useState({});
  const [loading, setLoading]       = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [searchParams]              = useSearchParams();

  // fetchLocations
  useEffect(() => {
    supabase
      .from("locations")
      .select("id, name")
      .order("name")
      .then(({ data }) => setLocations(data || []));
  }, []);

  // fetchFeatures
  useEffect(() => {
    setFeatureId("");
    setFeatures([]);
    if (!locationId) return;
    supabase
      .from("accessibility_features")
      .select("id, type, description")
      .eq("location_id", locationId)
      .order("type")
      .then(({ data }) => setFeatures(data || []));
  }, [locationId]);

  // prefillFromMap
  useEffect(() => {
    const paramId = searchParams.get("location_id");
    if (paramId) setLocationId(paramId);
  }, [searchParams]);

  function validate() {
    const e = {};
    if (!locationId)             e.location    = "Please select a location.";
    if (!featureId)              e.feature     = "Please select a feature.";
    if (description.length < 20) e.description = "Please add a description (at least 20 characters).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("reports").insert({
      user_id:        user.id,
      feature_id:     featureId,
      description,
      status:         "pending",
      date_submitted: new Date().toISOString(),
    });

    setLoading(false);
    if (error) {
      setErrors({ submit: error.message });
    } else {
      setSubmitted(true);
    }
  }

  const selectedLocation = locations.find(l => l.id === locationId);
  const selectedFeature  = features.find(f => f.id === featureId);

  // successScreen
  if (submitted) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        width: '100%', height: '100%', padding: '20px',
        backgroundColor: 'var(--bg)', color: 'var(--text)'
      }}>
        <div style={{
          padding: '40px', border: '1px solid var(--green)',
          borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column',
          gap: '15px', width: '100%', maxWidth: '500px',
          backgroundColor: 'var(--surface)', boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <div aria-hidden="true" style={{ fontSize: 48, marginBottom: 10, color: 'var(--green)' }}>✓</div>
          <h2 style={{ margin: 0, color: 'var(--green)' }} role="status" aria-live="polite">Report submitted</h2>
          <div style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
            Your report for <strong>{selectedLocation?.name}</strong> has been received and is pending review.
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
            <button
              onClick={() => { setLocationId(""); setFeatureId(""); setDesc(""); setErrors({}); setSubmitted(false); }}
              style={{
                padding: '12px', borderRadius: 'var(--radius)',
                background: 'var(--surface2)', color: 'var(--text)',
                border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              Submit another
            </button>
            <button
              onClick={handleBack}
              style={{
                padding: '12px', borderRadius: 'var(--radius)',
                background: 'transparent', color: 'var(--muted)',
                border: '1px solid var(--border)', cursor: 'pointer'
              }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // formScreen
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      width: '100%', height: '100%', padding: '20px',
      backgroundColor: 'var(--bg)', color: 'var(--text)', overflowY: 'auto'
    }}>
      <div style={{
        padding: '40px', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column',
        gap: '20px', width: '100%', maxWidth: '500px',
        backgroundColor: 'var(--surface)', boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
      }}>

        {/* header */}
        <div>
          <button
            onClick={handleBack}
            style={{
              background: 'none', border: 'none', color: 'var(--muted)',
              cursor: 'pointer', padding: 0, marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 5
            }}
            aria-label="Go back to map"
          >← Back</button>
          <h2 style={{ margin: 0, color: 'var(--text)' }}>New Report</h2>
          <p style={{ margin: '5px 0 0', color: 'var(--muted)', fontSize: '0.9em' }}>
            Report an accessibility issue for review.
          </p>
        </div>

        {/* formFields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>

          {/* location */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label htmlFor="report-location" style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Location <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <select
              id="report-location"
              value={locationId}
              aria-describedby={errors.location ? "location-error" : undefined}
              onChange={e => { setLocationId(e.target.value); setErrors(p => ({ ...p, location: null })); }}
              style={{
                padding: '12px', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', background: 'var(--bg)',
                color: 'var(--text)', outline: 'none', width: '100%'
              }}
            >
              <option value="">Select a location…</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            {errors.location && <div id="location-error" role="alert" style={{ color: 'var(--red)', fontSize: 12 }}>{errors.location}</div>}
          </div>

          {/* feature */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label htmlFor="report-feature" style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Feature <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <select
              id="report-feature"
              value={featureId}
              aria-describedby={errors.feature ? "feature-error" : undefined}
              onChange={e => { setFeatureId(e.target.value); setErrors(p => ({ ...p, feature: null })); }}
              disabled={!locationId}
              style={{
                padding: '12px', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: locationId ? 'var(--bg)' : 'var(--surface2)',
                color: locationId ? 'var(--text)' : 'var(--muted)',
                outline: 'none', cursor: locationId ? 'default' : 'not-allowed', width: '100%'
              }}
            >
              <option value="">{locationId ? (features.length ? "Select a feature…" : "No features found") : "Select a location first…"}</option>
              {features.map(f => (
                <option key={f.id} value={f.id}>{f.type}</option>
              ))}
            </select>
            {featureId && selectedFeature?.description && (
              <div style={{ padding: 10, background: 'var(--surface2)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--muted)' }}>
                {selectedFeature.description}
              </div>
            )}
            {errors.feature && <div id="feature-error" role="alert" style={{ color: 'var(--red)', fontSize: 12 }}>{errors.feature}</div>}
          </div>

          {/* description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label htmlFor="report-description" style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Description <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <textarea
              id="report-description"
              value={description}
              aria-describedby={errors.description ? "description-error" : undefined}
              onChange={e => { setDesc(e.target.value); if (e.target.value.length >= 20) setErrors(p => ({ ...p, description: null })); }}
              maxLength={1000}
              placeholder="Describe the problem, where exactly it is, and how it affects access…"
              style={{
                padding: '12px', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', background: 'var(--bg)',
                color: 'var(--text)', minHeight: 100, resize: 'vertical',
                outline: 'none', fontFamily: 'inherit', width: '100%'
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: 'var(--muted)' }}>
              <div>Be specific.</div>
              <div style={{ color: description.length > 850 ? 'var(--amber)' : 'inherit' }}>{description.length}/1000</div>
            </div>
            {errors.description && <div id="description-error" role="alert" style={{ color: 'var(--red)', fontSize: 12 }}>{errors.description}</div>}
          </div>

        </div>

        {errors.submit && (
          <div role="alert" style={{ color: 'var(--red)', background: 'rgba(248, 81, 73, 0.1)', padding: 10, borderRadius: 'var(--radius)' }}>
            Failed to submit: {errors.submit}
          </div>
        )}

        {/* actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button
            onClick={handleBack}
            style={{
              flex: 1, padding: '12px', borderRadius: 'var(--radius)',
              background: 'transparent', color: 'var(--text)',
              border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600
            }}
          >Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            aria-busy={loading}
            style={{
              flex: 2, padding: '12px', borderRadius: 'var(--radius)',
              background: 'var(--accent)', color: 'white', border: 'none',
              cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1, fontWeight: 600
            }}
          >
            {loading ? "Submitting…" : "Submit report"}
          </button>
        </div>

      </div>
    </div>
  );
}