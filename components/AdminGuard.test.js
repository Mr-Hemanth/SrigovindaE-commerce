import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminGuard from '@/components/AdminGuard';
import { useAuth } from '@/contexts/AuthContext';

// Provide an explicit factory so Jest never has to `require` the real
// AuthContext module (which pulls in the Firebase client and would fail to
// initialize in the jsdom/node test environment).
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('AdminGuard', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders a loading state when loading is true', () => {
    useAuth.mockReturnValue({ isAdmin: false, loading: true });

    render(<AdminGuard>secret content</AdminGuard>);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('secret content')).not.toBeInTheDocument();
  });

  it('renders "Access Denied" when isAdmin is false', () => {
    useAuth.mockReturnValue({ isAdmin: false, loading: false });

    render(<AdminGuard>secret content</AdminGuard>);

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('secret content')).not.toBeInTheDocument();
  });

  it('renders children when isAdmin is true', () => {
    useAuth.mockReturnValue({ isAdmin: true, loading: false });

    render(<AdminGuard>secret content</AdminGuard>);

    expect(screen.getByText('secret content')).toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });
});
