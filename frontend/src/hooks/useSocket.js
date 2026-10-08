import { useChatContext } from '../context/ChatContext';

export const useSocket = () => {
  const { socket, onlineUserIds, typingState, emitTyping } = useChatContext();
  return {
    socket,
    onlineUserIds,
    typingState,
    emitTyping,
  };
};
