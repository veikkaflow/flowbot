import React, { ReactNode } from 'react';

interface EmbedWrapperProps {
  children: ReactNode;
}

const EmbedWrapper: React.FC<EmbedWrapperProps> = ({ children }) => {
    return (
        <div className="w-screen h-screen overflow-hidden bg-transparent">
            {children}
        </div>
    );
};

export default EmbedWrapper;
