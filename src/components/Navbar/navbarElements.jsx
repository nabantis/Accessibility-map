import styled from 'styled-components';
import { NavLink, Link } from 'react-router-dom';

const colors = {
  bg: 'var(--navbar-bg, #0f172a)',
  fg: 'var(--navbar-text, #e2e8f0)',
  fgMuted: 'var(--muted, #94a3b8)',
  brand: '#38bdf8',
  brandHover: '#0ea5e9',
  danger: '#ef4444',
  dangerHover: '#dc2626'
};

export const Nav = styled.nav`
  background: ${colors.bg};
  color: ${colors.fg};
  position: relative;
  width: 100%;
  z-index: 1000;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
`;

export const NavContainer = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const NavLogo = styled(Link)`
  color: ${colors.fg};
  font-weight: 700;
  font-size: 1.25rem;
  text-decoration: none;
  letter-spacing: 0.3px;

  &:hover,
  &:focus-visible {
    color: ${colors.brand};
    outline: none;
  }
`;

export const MobileIconButton = styled.button`
  background: transparent;
  border: none;
  color: ${colors.fg};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover,
  &:focus-visible {
    color: ${colors.brand};
    outline: 2px solid ${colors.brand};
    outline-offset: 2px;
  }

  @media (min-width: 768px) {
    display: none;
  }
`;

export const NavMenu = styled.ul`
  list-style: none;
  display: grid;
  grid-auto-flow: row;
  gap: 0.5rem;
  padding: 0.75rem 0;
  margin: 0;

  position: absolute;
  top: 64px;
  left: 0;
  right: 0;
  background: ${colors.bg};
  border-bottom: 1px solid rgba(255,255,255,0.08);
  transform: translateY(-10px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease, transform 180ms ease;

  &[data-open="true"] {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  @media (min-width: 768px) {
    position: static;
    grid-auto-flow: column;
    gap: 1rem;
    padding: 0;
    border: 0;
    opacity: 1;
    transform: none;
    pointer-events: auto;
    background: transparent;
  }
`;

export const NavItem = styled.li`
  display: flex;
`;

export const NavLinkStyled = styled(NavLink)`
  color: ${colors.fgMuted};
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-weight: 500;
  transition: background 120ms ease, color 120ms ease;

  &.active {
    color: ${colors.fg};
    background: rgba(56, 189, 248, 0.12);
  }

  &:hover,
  &:focus-visible {
    color: ${colors.brand};
    outline: none;
    background: rgba(56, 189, 248, 0.08);
  }
`;

export const SignOutButton = styled.button`
  background: ${colors.danger};
  color: white;
  border: none;
  padding: 0.5rem 0.9rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 120ms ease;

  &:hover,
  &:focus-visible {
    background: ${colors.dangerHover};
    outline: 2px solid ${colors.brand};
    outline-offset: 2px;
  }
`;
