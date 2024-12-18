// Popup.jsx
import React, { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import browser from 'webextension-polyfill';
import Login from './components/Login';
import Progress from './components/Progress';
import Header from './components/Header';
import 'bootstrap/dist/css/bootstrap.min.css';

export const Popup = () => {
  const [isLoading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    async function init() {
      const { session } = await browser.runtime.sendMessage({ type: "getSession" });
      if (session) {
        const { userInfo } = await browser.runtime.sendMessage({ type: "getUserInfo" });
        if (userInfo) {
          setUserInfo(userInfo);
          setLoggedIn(true);
        } else {
          setLoggedIn(false);
        }
      } else {
        setLoggedIn(false);
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleLogin = async (email, password) => {
    setLoading(true);
    const response = await browser.runtime.sendMessage({ type: "login", email, password });
    if (response.success) {
      const { userInfo } = await browser.runtime.sendMessage({ type: "getUserInfo" });
      setUserInfo(userInfo);
      setLoggedIn(true);
    } else {
      alert(response.error || "Unknown login error.");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    await browser.runtime.sendMessage({ type: "logout" });
    setUserInfo(null);
    setLoggedIn(false);
    setLoading(false);
  };

  return (
    <>
      <Header name={userInfo?.first_name || "Please log in"} />
      <Container style={{ width: '500px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center' }}>
            <img src="/spinning-loading.gif" alt="loading..." style={{ width: '200px', height: '150px' }} />
          </div>
        ) : (
          <>
            {loggedIn ? (
              <Progress userInfo={userInfo} onLogout={handleLogout} />
            ) : (
              <Login onLogin={handleLogin} />
            )}
          </>
        )}
      </Container>
    </>
  );
};
