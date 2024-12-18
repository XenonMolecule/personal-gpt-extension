// Login.jsx
import React, { useState } from 'react';
import styled from 'styled-components';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

const HeaderContainer = styled.div`
  margin-top: 20px;
  padding-bottom: 10px;
`;

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    onLogin(email, password);
  };

  return (
    <Container>
      <HeaderContainer>
        <h1>Please log in to link your account</h1>
        <p>Don't have an account? <a href="https://personal-rm-ui.vercel.app/signup" target="_blank" rel="noreferrer">Signup</a></p>
        <hr/>
        <Container>
          <Form>
            <Form.Group className="mb-3" controlId="userEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control 
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />        
            </Form.Group>

            <Form.Group className="mb-3" controlId="userPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
              />
            </Form.Group>

            <Button variant="primary" onClick={handleSubmit}>
              Login
            </Button>
          </Form>
        </Container>
      </HeaderContainer>
    </Container>
  );
}
