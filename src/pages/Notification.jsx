import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

export default function Notification() {
     const { user } = useAuth();
     const [notifications, setNotifications] = useState([]);
     const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("notifications")
            .select(`
                *,
                reports (
                description,
                status,
                accessibility_features (
                    type,
                    locations ( name )
                )
                )
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (!error) setNotifications(data);
        setLoading(false);
    };

    useEffect(() => {
      if (!user) return;

      (async () => { await fetchNotifications(); })();

      const channel = supabase
        .channel("notifications-page")
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        })
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function markAsRead(id) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    // update local state
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  async function markAllAsRead() {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function deleteNotification(id) {
    await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) return <div style={{ padding: "20px" }} role="status" aria-live="polite">Loading...</div>;

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
      }}>
        <h1>
          Notifications
          {unreadCount > 0 && (
            <span
              aria-label={`${unreadCount} unread notifications`}
              style={{
              marginLeft: "10px",
              background: "red",
              color: "white",
              borderRadius: "50%",
              padding: "2px 8px",
              fontSize: "14px"
            }}>
              {unreadCount}
            </span>
          )}
        </h1>

        {unreadCount > 0 && (
          <button onClick={markAllAsRead} style={{
            cursor: "pointer",
            background: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "6px 12px",
            fontWeight: 600
          }}>
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No notifications yet.</p>
      ) : (
        notifications.map((n) => (
          <div key={n.id} style={{
            border: "1px solid var(--border)",
            borderLeft: n.is_read ? "1px solid var(--border)" : "4px solid var(--accent)",
            borderRadius: "var(--radius)",
            padding: "14px",
            marginBottom: "10px",
            background: n.is_read ? "var(--surface)" : "var(--surface2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "10px"
          }}>
            <div style={{ flex: 1 }}>
              {/* Notification message */}
              <p style={{ margin: "0 0 6px 0", color: "var(--text)" }}>{n.message}</p>

              {/* Related report info from the join */}
              {n.reports && (
                <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "var(--muted)" }}>
                  {n.reports.accessibility_features?.locations?.name} —{" "}
                  {n.reports.accessibility_features?.type}
                </p>
              )}

              {/* Timestamp */}
              <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {!n.is_read && (
                <button
                  onClick={() => markAsRead(n.id)}
                  aria-label="Mark this notification as read"
                  style={{
                    fontSize: "12px",
                    cursor: "pointer",
                    background: "var(--accent)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radius)",
                    padding: "4px 8px",
                    fontWeight: 600
                  }}
                >
                  Mark read
                </button>
              )}
              <button
                onClick={() => deleteNotification(n.id)}
                aria-label="Delete this notification"
                style={{
                  fontSize: "12px",
                  cursor: "pointer",
                  background: "none",
                  color: "var(--red)",
                  border: "1px solid var(--red)",
                  borderRadius: "4px",
                  padding: "2px 6px"
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}