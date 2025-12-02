// FIX: This file was created to wrap the LiveAgentConsole for displaying a selected conversation.
import React from 'react';
// FIX: Replaced non-existent Avatars type with AvatarSettings.
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