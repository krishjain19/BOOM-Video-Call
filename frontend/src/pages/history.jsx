import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "src/context/AuthContext";
import HomeIcon from "@mui/icons-material/Home";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history);
      } catch (e) {}
    };
    fetchHistory();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Navbar */}
      <nav className="d-flex align-items-center px-3 px-md-5 py-3 bg-white border-bottom gap-3">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary rounded-1 d-flex align-items-center gap-1"
          onClick={() => routeTo("/home")}
        >
          <HomeIcon fontSize="small" />
          <span className="d-none d-sm-inline">Home</span>
        </button>
        <h5 className="mb-0 fw-semibold">Meeting History</h5>
      </nav>

      {/* Content */}
      <div className="container py-4" style={{ maxWidth: "720px" }}>
        {meetings.length === 0 ? (
          <div className="text-center text-secondary py-5">
            <p className="mb-0">No meetings in your history yet.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {meetings.map((meeting, i) => (
              <div
                key={i}
                className="card border rounded-2 shadow-sm"
                style={{ cursor: "pointer" }}
                onClick={() => routeTo(`/${meeting.meetingCode}`)}
              >
                <div className="card-body d-flex justify-content-between align-items-center py-3 px-4">
                  <div>
                    <p className="mb-0 fw-semibold" style={{ fontSize: "0.95rem" }}>
                      {meeting.meetingCode}
                    </p>
                    <p className="mb-0 text-secondary small">
                      {formatDate(meeting.date)}
                    </p>
                  </div>
                  <span className="badge rounded-1 text-white" style={{ backgroundColor: "#ff7b00", fontSize: "0.75rem" }}>
                    Rejoin
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
