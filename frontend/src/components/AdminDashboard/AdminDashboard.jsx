import React from 'react'
import './AdminDashboard.css'
import { useEffect,useState } from 'react';

function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const gentPendingUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:5000/api/auth/admin/pending-users", 
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch pending users");
            }
            setUsers(data);
        } catch (error) {
            setError(error.message || "Failed to fetch pending users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        gentPendingUsers();
    }, []);

    const updateUserStatus = async (userId, action) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:5000/api/auth/admin/approve", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ userId, action })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to update user status");
            }
            setUsers(currentUsers => currentUsers.filter(user => user._id !== userId));
        } catch (error) {
            setError(error.message || "Failed to update user status");
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

     return (
    <main className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <p className="admin-label">Administration</p>
            <h1>Pending users</h1>
            <p>Approve or reject new account requests.</p>
          </div>

          <span className="user-count">{users.length} pending</span>
        </div>

        {error && <p className="error-message">{error}</p>}

        {users.length === 0 ? (
          <div className="empty-state">
            <h2>No pending users</h2>
            <p>There are currently no accounts waiting for approval.</p>
          </div>
        ) : (
          <div className="user-list">
            {users.map((user) => (
              <article className="user-card" key={user._id}>
                <div className="user-information">
                  <div className="user-avatar">
                    {user.username.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h2>{user.username}</h2>
                    <p>Status: {user.status}</p>
                  </div>
                </div>

                <div className="user-actions">
                  <button
                    className="approve-button"
                    onClick={() =>
                      updateUserStatus(user._id, "approved")
                    }
                  >
                    Approve
                  </button>

                  <button
                    className="reject-button"
                    onClick={() =>
                      updateUserStatus(user._id, "rejected")
                    }
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default AdminDashboard