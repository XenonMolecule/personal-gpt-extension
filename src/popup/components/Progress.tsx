import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { FaInfoCircle, FaComments, FaRobot, FaCommentDots, FaThumbsUp, FaPencilAlt, FaPen, FaLightbulb } from "react-icons/fa";
import supabase from "../../utils/supabase";

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

  const getTextStyle = (current, goal) => {
    return current < goal ? { color: "red", fontWeight: "bold" } : {};
  };

  const allGoalsMet = () => {
    const fields = [
      { current: "num_conversations", goal: "targ_conversations" },
      { current: "num_interactions", goal: "targ_interactions" },
      { current: "num_feedback", goal: "targ_feedback" },
      { current: "num_pairs", goal: "targ_pairs" },
      { current: "num_edits", goal: "targ_edits" },
    ];
    return fields.every(({ current, goal }) => (userInfo[current] || 0) >= (userInfo[goal] || 0));
  };

  const progressFields = [
    { field: "num_conversations", goal: "targ_conversations", displayName: "Conversations" },
    { field: "num_interactions", goal: "targ_interactions", displayName: "Interactions" },
    { field: "num_feedback", goal: "targ_feedback", displayName: "Feedback" },
    { field: "num_pairs", goal: "targ_pairs", displayName: "Preference Pairs" },
    { field: "num_edits", goal: "targ_edits", displayName: "Edits" },
  ];

  const handleLogout = async () => {
    try {
      onLogout();
    } catch (error) {
      console.error("Error logging out:", error);
      setShowError(true);
      setErrorMessage("Failed to log out. Please try again.");
    }
  };

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
          <p>
            <strong>Username:</strong> {userInfo.first_name || "Anonymous"}
          </p>
          <p>
            <strong>Account Creation Date:</strong>{" "}
            {userInfo.created_at ? new Date(userInfo.created_at).toLocaleDateString() : "N/A"}
          </p>
          {progressFields.map(({ field, goal, displayName }) => (
            <p key={field}>
              <strong>{displayName}:</strong>{" "}
              <span style={getTextStyle(userInfo[field] || 0, userInfo[goal] || 0)}>
                {userInfo[field] || 0}/{userInfo[goal] || 0}
              </span>{" "}
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id={`${field}-tooltip`} style={{ fontSize: "14px", maxWidth: "300px" }}>
                    {progressDescriptions[field] ? progressDescriptions[field] : <span>No description available.</span>}
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
        <Row>
          <Col>
            <Button variant="primary" href="https://personal-rm-ui.vercel.app/" target="_blank" rel="noreferrer">
              <FaLightbulb /> PersonalGPT
            </Button>
          </Col>
          <Col>
            <Button variant="danger" onClick={handleLogout}>
              Logout
            </Button>
          </Col>
        </Row>
        
      </div>
    </Container>
  );
}

export default Progress;