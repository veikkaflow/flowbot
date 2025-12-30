import React from 'react';
import { Conversation, AvatarSettings } from '../types.ts';
import LiveAgentConsole from './LiveAgentConsole.tsx';

interface ConversationDetailProps {
    conversation: Conversation;
    avatars: AvatarSettings;
    onSendMessage: (text: string) => void;
}

const ConversationDetail: React.FC<ConversationDetailProps> = ({ conversation, avatars, onSendMessage }) => {
    
    return (
        <LiveAgentConsole
            conversation={conversation}
            onSendMessage={onSendMessage}
            avatars={avatars}
        />
    );
};

export default ConversationDetail;