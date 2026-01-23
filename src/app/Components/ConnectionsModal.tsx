'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import { Connection, getUserConnectionsAPI } from '@/api/auth/users/getUserConnections';

interface ConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConnectionsModal({
  isOpen,
  onClose,
}: ConnectionsModalProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchConnections();
    } else {
      // Reset state when modal closes
      setConnections([]);
      setError(null);
    }
  }, [isOpen]);

  const fetchConnections = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getUserConnectionsAPI();
      // API function already normalizes the response to have a connections array
      setConnections(Array.isArray(data.connections) ? data.connections : []);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setError(err instanceof Error ? err.message : 'Failed to load connections');
      setConnections([]); // Reset to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="mutual-friends-modal">
        <h2 className="mutual-friends-modal-title">Connections</h2>
        
        {isLoading ? (
          <div className="mutual-friends-modal-loading">
            <div className="connections-spinner" style={{ margin: '0 auto' }}></div>
            <p className="mt-4 text-sm text-slate-500">Loading connections...</p>
          </div>
        ) : error ? (
          <div className="mutual-friends-modal-error">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : !Array.isArray(connections) || connections.length === 0 ? (
          <div className="mutual-friends-modal-empty">
            <p className="text-sm text-slate-500">No connections</p>
          </div>
        ) : (
          <div className="mutual-friends-modal-list">
            {Array.isArray(connections) && connections.map((connection) => {
              const fullName = [connection.firstName, connection.lastName]
                .filter(Boolean)
                .join(' ') || connection.username;
              
              const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
              let avatarUrl = connection.profilePicture || connection.avatarUrl || '/default-avatar.svg';
              
              // If profilePicture is a relative path, prefix with BASE_URL
              if (avatarUrl && avatarUrl !== '/default-avatar.svg' && !avatarUrl.startsWith('http://') && !avatarUrl.startsWith('https://')) {
                avatarUrl = `${BASE_URL}${avatarUrl}`;
              }
              
              const initials = connection.firstName
                ? connection.firstName.charAt(0).toUpperCase()
                : connection.username.charAt(0).toUpperCase();

              return (
                <div key={connection._id} className="mutual-friends-modal-item">
                  <div className="mutual-friends-modal-avatar">
                    {avatarUrl && avatarUrl !== '/default-avatar.svg' ? (
                      <img
                        src={avatarUrl}
                        alt={fullName}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.avatar-fallback')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'avatar-fallback';
                            fallback.textContent = initials;
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="mutual-friends-modal-info">
                    <p className="mutual-friends-modal-name">{fullName}</p>
                    <p className="mutual-friends-modal-username">@{connection.username}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

