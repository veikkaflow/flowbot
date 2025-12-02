// FIX: This file was created to resolve a module resolution error. It wraps the main InboxDashboard component.
import React from 'react';
import InboxDashboard from './InboxDashboard.tsx';

const InboxView: React.FC = () => {
    return <InboxDashboard />;
};

export default InboxView;