import React from 'react';
import Modal from '../common/Modal';
import UserSearch from './UserSearch';

const NewChatModal = ({ isOpen, onClose, onStarted }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="New conversation"
    description="Search for someone to start chatting."
    maxWidth="max-w-md"
    bodyClassName="pt-4"
  >
    <UserSearch
      onSelected={() => {
        onClose();
        onStarted?.();
      }}
    />
  </Modal>
);

export default NewChatModal;
