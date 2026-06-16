import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Nav, NavContainer, NavLogo, MobileIconButton,
  NavMenu, NavItem, NavLinkStyled, SignOutButton
} from './navbarElements';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth() || {};
  const { isModerator = false, signOut = async () => {} } = auth;
  const menuRef = useRef(null);
  const toggleRef = useRef(null);

  const toggle = () => setIsOpen(o => !o);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      navigate('/', { replace: true });
    }
  };

  // Focus trap: keep Tab inside the menu when open
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      setIsOpen(false);
      toggleRef.current?.focus();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusable = menuRef.current?.querySelectorAll(
      'a[href], button, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus the first menu link when opened
      const firstLink = menuRef.current?.querySelector('a[href], button');
      firstLink?.focus();
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  return (
    <Nav role="navigation" aria-label="Primary">
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          zIndex: 9999,
        }}
        onFocus={(e) => {
          e.target.style.position = 'fixed';
          e.target.style.left = '16px';
          e.target.style.top = '16px';
          e.target.style.width = 'auto';
          e.target.style.height = 'auto';
          e.target.style.overflow = 'visible';
          e.target.style.background = '#0f172a';
          e.target.style.color = '#38bdf8';
          e.target.style.padding = '10px 18px';
          e.target.style.borderRadius = '6px';
          e.target.style.fontWeight = '600';
          e.target.style.fontSize = '14px';
          e.target.style.textDecoration = 'none';
          e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        }}
        onBlur={(e) => {
          e.target.style.position = 'absolute';
          e.target.style.left = '-9999px';
          e.target.style.width = '1px';
          e.target.style.height = '1px';
          e.target.style.overflow = 'hidden';
        }}
      >
        Skip to main content
      </a>
      <NavContainer>
        <NavLogo to="/report" onClick={closeMenu} aria-label="Home"></NavLogo>
        <MobileIconButton ref={toggleRef} onClick={toggle} aria-expanded={isOpen} aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}>
          <span aria-hidden="true">{isOpen ? '✕' : '☰'}</span>
        </MobileIconButton>
        <NavMenu data-open={isOpen} ref={menuRef}>
          <NavItem>
            <NavLinkStyled to="/map" onClick={closeMenu}>Map</NavLinkStyled>
          </NavItem>
          <NavItem>
            <NavLinkStyled to="/userProfile" onClick={closeMenu}>User Profile</NavLinkStyled>
          </NavItem>
          <NavItem>
            <NavLinkStyled to="/report" onClick={closeMenu}>Reports</NavLinkStyled>
          </NavItem>
          {isModerator && (
            <NavItem>
              <NavLinkStyled to="/moderation" onClick={closeMenu}>Moderation</NavLinkStyled>
            </NavItem>
          )}
          {isModerator && (
            <NavItem>
              <NavLinkStyled to="/moderatorMap" onClick={closeMenu}>Moderator Map</NavLinkStyled>
            </NavItem>
          )}
          <NavItem>
            <NavLinkStyled to="/notification" onClick={closeMenu}>Notification</NavLinkStyled>
          </NavItem>
          <NavItem>
            <SignOutButton onClick={handleLogout}>Log Out</SignOutButton>
          </NavItem>
        </NavMenu>
      </NavContainer>
    </Nav>
  );
}

