import React, { useEffect, useState } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import NewChatModal from '../components/sidebar/NewChatModal';
import { useChatContext } from '../context/ChatContext';

const Chat = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const { activeConversation } = useChatContext();

  // Below md (phones) the sidebar is a drawer. With no chat selected it becomes the main view.
  const hasActive = !!activeConversation;
  const isSidebarVisible = isDrawerOpen || !hasActive;

  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKey = (e) => e.key === 'Escape' && hasActive && setIsDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDrawerOpen, hasActive]);

  const openNewChat = () => setIsNewChatOpen(true);

  return (
    <div className="flex app-screen w-full overflow-hidden bg-ink-950 text-fg">
      {/* Drawer backdrop (tablet / mobile only) */}
      <div
        className={`fixed inset-0 z-20 bg-black/50 backdrop-blur-[1px] md:hidden transition-opacity duration-200 ${
          isDrawerOpen && hasActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsDrawerOpen(false)}
      />

      <Sidebar
        isOpenOnMobile={isSidebarVisible}
        isPrimaryView={!hasActive}
        canCloseMobile={hasActive}
        onCloseMobile={() => setIsDrawerOpen(false)}
        onNewChat={openNewChat}
      />

      <ChatWindow onOpenMobileSidebar={() => setIsDrawerOpen(true)} onNewChat={openNewChat} />

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onStarted={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};

export default Chat;
