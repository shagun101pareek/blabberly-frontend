'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import { MutualFriend } from '@/api/auth/users/getMutualFriends';

interface MutualFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mutualFriends: MutualFriend[];
  isLoading?: boolean;
  error?: string | null;
}

export default function MutualFriendsModal({
  isOpen,
  onClose,
  mutualFriends,
  isLoading = false,
  error = null,
}: MutualFriendsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="mutual-friends-modal">
        <h2 className="mutual-friends-modal-title">Mutual Friends</h2>
        
        {isLoading ? (
          <div className="mutual-friends-modal-loading">
            <div className="connections-spinner" style={{ margin: '0 auto' }}></div>
            <p className="mt-4 text-sm text-slate-500">Loading mutual friends...</p>
          </div>
        ) : error ? (
          <div className="mutual-friends-modal-error">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : mutualFriends.length === 0 ? (
          <div className="mutual-friends-modal-empty">
            <p className="text-sm text-slate-500">No mutual friends</p>
          </div>
        ) : (
          <div className="mutual-friends-modal-list">
            {mutualFriends.map((friend) => {
              const fullName = [friend.firstName, friend.lastName]
                .filter(Boolean)
                .join(' ') || friend.username;

              return (
                <div key={friend._id} className="mutual-friends-modal-item">
                  <div className="mutual-friends-modal-avatar">
                    {friend.firstName
                      ? friend.firstName.charAt(0).toUpperCase()
                      : friend.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="mutual-friends-modal-info">
                    <p className="mutual-friends-modal-name">{fullName}</p>
                    <p className="mutual-friends-modal-username">@{friend.username}</p>
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

