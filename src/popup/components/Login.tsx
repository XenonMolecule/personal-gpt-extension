import styled from 'styled-components';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import React, { useState } from 'react';
import CONSTANTS from '../../services/constants';

const HeaderContainer = styled.div`
  margin-top: 20px;
  padding-bottom: 10px;
`;

export default function Login(props: {
  tried: boolean;
  success: boolean;
  failMsg: string;
  onAttemptLogin: (email: string, password: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const handleLoginClick = () => {
    props.onAttemptLogin(email, pass);
  };

  return (
    <Container>
      <HeaderContainer>
        <h1>Please log in to link your account</h1>
        <p>Don't have an account? <a href="https://personal-rm-ui.vercel.app/signup" target="_blank" rel="noreferrer">Signup</a></p>
        <hr/>
        <Container>
          {props.success && props.tried ? 
            <div style={{"textAlign":"center"}}>
              <img src={`${CONSTANTS.URL}/spinning-loading.gif`} alt={"loading..."} style={{"width":"200px", "height":"150px"}}/>
            </div> 
          :
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
                  value={pass}
                  onChange={(e) => setPass(e.target.value)} 
                />
              </Form.Group>

              <Button variant="primary" onClick={handleLoginClick}>
                Login
              </Button>
              {props.tried && !props.success ? 
                <p style={{"color":"red"}}>{props.failMsg}</p>
              : null}
            </Form>
          }
        </Container>
      </HeaderContainer>
    </Container>
  );
}