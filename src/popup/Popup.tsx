import React, { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import supabase from '../utils/supabase';
import { getUserInfoOrCreate } from '../utils/supabase-helpers';
import Login from './components/Login';
import Progress from './components/Progress';
import Header from './components/Header';
import 'bootstrap/dist/css/bootstrap.min.css';
import CONSTANTS from '../services/constants';

export const Popup = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  // States related to login attempts
  const [tried, setTried] = useState(false);
  const [success, setSuccess] = useState(false);
  const [failMsg, setFailMsg] = useState("Username and password did not match.  Please try again.");

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error checking session:", error);
        setLoading(false);
        return;
      }

      if (data?.session) {
        // Try to fetch user info
        const user = data.session.user;
        if (!user || !user.user_metadata?.first_name || !user.user_metadata?.language) {
          console.error("User metadata incomplete. Not logged in.");
          setLoggedIn(false);
          setLoading(false);
          return;
        }
        
        const { data:user_info, error } = await getUserInfoOrCreate(
          user.user_metadata.first_name, 
          user.user_metadata.language
        );

        if (error || !user_info || user_info.length === 0) {
          console.error("Error fetching user info or none returned.");
          setLoggedIn(false);
          setLoading(false);
        } else {
          setUserInfo(user_info[0]);
          setLoggedIn(true);
          setLoading(false);
        }
      } else {
        // No session
        setLoggedIn(false);
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const onLogin = (loggedInUserInfo) => {
    setUserInfo(loggedInUserInfo);
    setLoggedIn(true);
  };

  const handleAttemptLogin = async (email, password) => {
    setTried(false);
    setSuccess(false);
    setFailMsg("Username and password did not match.  Please try again.");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("Login error:", error);
      setTried(true);
      setSuccess(false);
      setFailMsg("Username and password did not match.  Please try again.");
      return;
    }

    if (data && data.user) {
      setTried(true);
      setSuccess(true);
      setFailMsg("Username and password did not match.  Please try again.");

      const { data:user_info, error:userInfoError } = await getUserInfoOrCreate(
        data.user.user_metadata?.first_name, 
        data.user.user_metadata?.language
      );

      if (userInfoError || !user_info || user_info.length === 0) {
        setSuccess(false);
        setFailMsg("Error on batch progress fetch.  Please try again later.");
      } else if (user_info) {
        // Login successful
        onLogin(user_info[0]);
      } else {
        setSuccess(false);
        setFailMsg("Well this is awkward.  Something went wrong and we don't know what.  Please try again later.");
      }
    } else {
      setTried(true);
      setSuccess(false);
      setFailMsg("Username and password did not match.  Please try again.");
    }
  };

  const onLogout = async () => {
    setLoggedIn(false);
    await supabase.auth.signOut();
    setUserInfo(null);
    // Reset login-related states so that when user is back on login screen, it's fresh
    setTried(false);
    setSuccess(false);
    setFailMsg("Username and password did not match.  Please try again.");
  };

  return (
    <>
      <Header name={userInfo?.first_name || "Please log in"} />
      <Container style={{ width: '500px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center' }}>
            <img src={`${CONSTANTS.URL}/spinning-loading.gif`} alt='loading...' style={{ width: '200px', height: '150px' }} />
          </div>
        ) : (
          <>
            {loggedIn ? (
              <Progress userInfo={userInfo} onLogout={onLogout} />
            ) : (
              <Login 
                tried={tried} 
                success={success} 
                failMsg={failMsg} 
                onAttemptLogin={handleAttemptLogin} 
              />
            )}
          </>
        )}
      </Container>
    </>
  );
};