import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Moderation() {
  const [reports, setReports] = useState([]);

  async function fetchReports() {
    const { data, error } = await supabase
      .from("reports")
      .select(`
        *,
        accessibility_features (
          id,
          type,
          description,
          location_id,
          status,
          locations ( name )
        )
      `)
      .order("date_submitted", { ascending: false });

    if (!error) setReports(data);
  }

  async function fetchSingleReport(reportId) {
    const { data, error } = await supabase
      .from("reports")
      .select(`
        *,
        accessibility_features (
          id,
          type,
          description,
          location_id,
          status,
          locations ( name )
        )
      `)
      .eq("id", reportId)
      .single();

    if (!error && data) {
      setReports(prev => [data, ...prev]);
    }
  }

  useEffect(() => {
    (async () => { await fetchReports(); })();

    // Real-time subscription for new and updated reports
    const channel = supabase
      .channel("moderation-reports")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "reports",
      }, (payload) => {
        fetchSingleReport(payload.new.id);
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "reports",
      }, (payload) => {
        setReports(prev =>
          prev.map(r => r.id === payload.new.id ? { ...r, status: payload.new.status } : r)
        );
      })
      .subscribe();

    return () => channel.unsubscribe();
  }, []);

  // --- Moderator note handlers ---
  function handleNoteChange(id, value) {
    setReports(prev =>
      prev.map(r => r.id === id ? { ...r, moderator_note: value } : r)
    );
  }

  async function saveNote(id, note) {
    const { error } = await supabase
      .from("reports")
      .update({ moderator_note: note })
      .eq("id", id);

    if (error) {
      console.error("Error saving note:", error);
    } else {
      alert("Note saved");
    }
  }

  // --- Feature status dropdown handlers ---
  function handleFeatureStatusChange(reportId, newStatus) {
    setReports(prev =>
      prev.map(r =>
        r.id === reportId
          ? { ...r, accessibility_features: { ...r.accessibility_features, status: newStatus } }
          : r
      )
    );
  }

  async function saveFeatureStatus(report) {
    const { error } = await supabase
      .from("accessibility_features")
      .update({ status: report.accessibility_features?.status })
      .eq("id", report.accessibility_features.id);

    if (error) {
      console.error("Error updating feature status:", error);
    } else {
      alert("Feature status saved");
    }
  }

  // --- Approve / Reject ---
  async function approveReport(id) {
    const report = reports.find(r => r.id === id);
    const featureStatus = report.accessibility_features?.status || "inaccessible";

    await supabase
      .from("reports")
      .update({ status: "approved" })
      .eq("id", id);

    await supabase
      .from("accessibility_features")
      .update({ status: featureStatus })
      .eq("id", report.feature_id);

    if (report?.user_id) {
      await supabase.from("notifications").insert({
        user_id: report.user_id,
        report_id: id,
        message: "Your report has been approved and the feature status has been updated."
      });
    }

    await notifyAffectedUsers(
      report.feature_id,
      report.accessibility_features?.type,
      featureStatus,
      report.user_id
    );
    // Real-time UPDATE subscription handles the UI update
  }

  async function rejectReport(id) {
    const report = reports.find(r => r.id === id);

    await supabase
      .from("reports")
      .update({ status: "rejected" })
      .eq("id", id);

    if (report?.user_id) {
      await supabase.from("notifications").insert({
        user_id: report.user_id,
        report_id: id,
        message: "Your report was reviewed but could not be verified."
      });
    }
    // Real-time UPDATE subscription handles the UI update
  }

  async function notifyAffectedUsers(featureId, featureType, newStatus, excludeUserId) {
    const typeToPreference = {
      lift:           "lift_access",
      ramp:           "ramp_access",
      wide_path:      "wide_paths",
      tactile_paving: "tactile_paving",
    };

    const preferenceColumn = typeToPreference[featureType];
    if (!preferenceColumn) return;

    const { data: featureData } = await supabase
      .from("accessibility_features")
      .select(`type, description, locations ( name )`)
      .eq("id", featureId)
      .single();

    if (!featureData) return;

    const locationName = featureData.locations?.name || "Unknown location";
    const featureDescription = featureData.description || featureType;

    const statusMessages = {
      inaccessible: `The ${featureType} at ${locationName} is now inaccessible. (${featureDescription})`,
      under_repair:  `The ${featureType} at ${locationName} is under repair. (${featureDescription})`,
      operational:   `The ${featureType} at ${locationName} has been restored. (${featureDescription})`,
    };

    const message = statusMessages[newStatus];
    if (!message) return;

    const { data: affectedUsers } = await supabase
      .from("accessibility_preferences")
      .select("user_id")
      .eq(preferenceColumn, true);

    if (!affectedUsers?.length) return;

    const notifications = affectedUsers
      .filter(u => u.user_id !== excludeUserId)
      .map(u => ({ user_id: u.user_id, report_id: null, message }));

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }
  }

  const pendingReports  = reports.filter(r => r.status === "pending");
  const actionedReports = reports.filter(r => r.status !== "pending");

  return (
    <div style={{
      maxWidth: "600px",
      margin: "0 auto",
      padding: "20px",
      background: "var(--bg)",
      color: "var(--text)",
      minHeight: "100vh"
    }}>
      <h1 style={{ color: "var(--text)", marginBottom: 24 }}>Moderation Platform</h1>

      <h2 style={{ color: "var(--text)" }}>Pending ({pendingReports.length})</h2>
      {pendingReports.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No pending reports.</p>
      ) : (
        pendingReports.map(r => (
          <ReportCard
            key={r.id}
            r={r}
            isPending={true}
            onApprove={approveReport}
            onReject={rejectReport}
            onNoteChange={handleNoteChange}
            onSaveNote={saveNote}
            onFeatureStatusChange={handleFeatureStatusChange}
            onSaveFeatureStatus={saveFeatureStatus}
          />
        ))
      )}

      <h2 style={{ color: "var(--text)", marginTop: 32 }}>
        Actioned ({actionedReports.length})
      </h2>
      {actionedReports.map(r => (
        <ReportCard
          key={r.id}
          r={r}
          isPending={false}
          onApprove={approveReport}
          onReject={rejectReport}
          onNoteChange={handleNoteChange}
          onSaveNote={saveNote}
          onFeatureStatusChange={handleFeatureStatusChange}
          onSaveFeatureStatus={saveFeatureStatus}
        />
      ))}
    </div>
  );
}

function ReportCard({
  r, isPending,
  onApprove, onReject,
  onNoteChange, onSaveNote,
  onFeatureStatusChange, onSaveFeatureStatus
}) {
  return (
    <div style={{
      border: `1px solid var(--border)`,
      borderLeft: isPending ? "4px solid orange" : "1px solid var(--border)",
      background: "var(--surface)",
      color: "var(--text)",
      padding: "18px",
      marginBottom: "18px",
      borderRadius: "var(--radius)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      opacity: isPending ? 1 : 0.7
    }}>
      <p style={{ margin: 0 }}><strong>User:</strong> {r.user_id}</p>
      <p style={{ margin: 0 }}><strong>Location:</strong> {r.accessibility_features?.locations?.name ?? "Unknown"}</p>
      <p style={{ margin: 0 }}><strong>Feature:</strong> {r.accessibility_features?.type ?? "Unknown"}</p>
      <p style={{ margin: 0 }}><strong>Description:</strong> {r.description}</p>
      <p style={{ margin: 0 }}><strong>Report status:</strong> {r.status}</p>
      {r.date_submitted && (
        <p style={{ margin: 0 }}><strong>Submitted:</strong> {new Date(r.date_submitted).toLocaleString()}</p>
      )}

      <label htmlFor={`feature-status-${r.id}`} style={{ margin: 0, fontWeight: 700 }}>Feature status:</label>
      <select
        id={`feature-status-${r.id}`}
        value={r.accessibility_features?.status || ""}
        onChange={e => onFeatureStatusChange(r.id, e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          background: "var(--surface2)",
          color: "var(--text)",
        }}
      >
        <option value="">Select Status</option>
        <option value="operational">Operational</option>
        <option value="under_repair">Under Repair</option>
        <option value="inaccessible">Inaccessible</option>
      </select>
      <button
        onClick={() => onSaveFeatureStatus(r)}
        style={{
          background: "var(--accent)",
          color: "white",
          border: "none",
          borderRadius: "var(--radius)",
          padding: "8px 16px",
          cursor: "pointer",
          fontWeight: 600
        }}
      >
        Save Feature Status
      </button>

      <label htmlFor={`mod-note-${r.id}`} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Moderator note</label>
      <textarea
        id={`mod-note-${r.id}`}
        placeholder="Moderator note (optional)"
        value={r.moderator_note || ""}
        onChange={e => onNoteChange(r.id, e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          background: "var(--surface2)",
          color: "var(--text)"
        }}
      />
      <button
        onClick={() => onSaveNote(r.id, r.moderator_note || "")}
        style={{
          background: "var(--green)",
          color: "white",
          padding: "8px 16px",
          border: "none",
          borderRadius: "var(--radius)",
          cursor: "pointer",
          fontWeight: 600
        }}
      >
        Save Note
      </button>

      {isPending && (
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button
            onClick={() => onApprove(r.id)}
            aria-label="Approve this report"
            style={{
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius)",
              padding: "8px 16px",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Approve
          </button>
          <button
            onClick={() => onReject(r.id)}
            aria-label="Reject this report"
            style={{
              background: "var(--red)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius)",
              padding: "8px 16px",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}