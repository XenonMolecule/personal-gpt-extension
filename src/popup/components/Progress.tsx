// Progress.jsx
import React from "react";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { FaInfoCircle, FaComments, FaRobot, FaCommentDots, FaThumbsUp, FaPencilAlt } from "react-icons/fa";

function Progress({ userInfo, onLogout }) {
  const [showError, setShowError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("Something went wrong. Please try again later.");

  const progressDescriptions = {
    num_conversations: (
      <div>
        <strong><FaComments /> Conversations:</strong> Participate in chatbot conversations.
      </div>
    ),
    num_interactions: (
      <div>
        <strong><FaRobot /> Interactions:</strong> Interact with the chatbot by asking questions or giving prompts.
      </div>
    ),
    num_feedback: (
      <div>
        <strong><FaCommentDots /> Feedback:</strong> Provide open ended feedback to help improve chatbot responses.
      </div>
    ),
    num_pairs: (
      <div>
        <strong><FaThumbsUp /> Preferences:</strong> Select preferred responses in pairwise comparisons.
      </div>
    ),
    num_edits: (
      <div>
        <strong><FaPencilAlt /> Edits:</strong> Edit chatbot responses to improve their quality.
      </div>
    ),
  };

  const fields = [
    { field: "num_conversations", goal: "targ_conversations", displayName: "Conversations" },
    { field: "num_interactions", goal: "targ_interactions", displayName: "Interactions" },
    { field: "num_feedback", goal: "targ_feedback", displayName: "Feedback" },
    { field: "num_pairs", goal: "targ_pairs", displayName: "Preference Pairs" },
    { field: "num_edits", goal: "targ_edits", displayName: "Edits" },
  ];

  const getTextStyle = (current, goal) => current < goal ? { color: "red", fontWeight: "bold" } : {};
  const allGoalsMet = () => fields.every(({ field, goal }) => (userInfo[field] || 0) >= (userInfo[goal] || 0));

  return (
    <Container style={{ marginTop: "0px" }}>
      {showError && (
        <Alert variant="danger" onClose={() => setShowError(false)} dismissible>
          <Alert.Heading>Error</Alert.Heading>
          <p>{errorMessage}</p>
        </Alert>
      )}
      <h2>Your Progress</h2>
      <Card>
        <Card.Body>
          <p><strong>Username:</strong> {userInfo.first_name || "Anonymous"}</p>
          <p>
            <strong>Account Creation Date:</strong>{" "}
            {userInfo.created_at ? new Date(userInfo.created_at).toLocaleDateString() : "N/A"}
          </p>
          {fields.map(({ field, goal, displayName }) => (
            <p key={field}>
              <strong>{displayName}:</strong>{" "}
              <span style={getTextStyle(userInfo[field] || 0, userInfo[goal] || 0)}>
                {(userInfo[field] || 0)}/{(userInfo[goal] || 0)}
              </span>{" "}
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id={`${field}-tooltip`} style={{ fontSize: "14px", maxWidth: "300px" }}>
                    {progressDescriptions[field] ?? <span>No description available.</span>}
                  </Tooltip>
                }
              >
                <span>
                  <FaInfoCircle
                    style={{
                      color: "black",
                      marginLeft: "5px",
                      cursor: "pointer",
                      fontSize: "16px",
                    }}
                  />
                </span>
              </OverlayTrigger>
            </p>
          ))}
          <p>
            <strong>Completion Code:</strong>{" "}
            {allGoalsMet() ? (
              <span style={{ color: "green", fontWeight: "bold" }}>
                {userInfo.completion_code || "N/A"}
              </span>
            ) : (
              <span style={{ color: "gray" }}>Revealed on completion of study</span>
            )}
          </p>
        </Card.Body>
      </Card>
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <Button variant="danger" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </Container>
  );
}

export default Progress;
