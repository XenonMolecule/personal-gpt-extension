import React from 'react';
import Navbar from 'react-bootstrap/Navbar';

function Header({ name }) {
  return (
    <Navbar bg="light" expand="lg" className="mb-3">
      <Navbar.Brand style={{ marginLeft: '20px' }}>
        Welcome, {name || "Please log in"}
      </Navbar.Brand>
    </Navbar>
  );
}

export default Header;