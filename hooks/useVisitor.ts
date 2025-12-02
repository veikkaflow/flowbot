

import { useState, useEffect } from 'react';
import { generateId } from '../utils/id.ts';

const VISITOR_ID_KEY = 'flowbot_ai_visitor_id';

export const useVisitor = () => {
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    try {
      let id = window.sessionStorage.getItem(VISITOR_ID_KEY);
      if (!id) {
        id = generateId();
        window.sessionStorage.setItem(VISITOR_ID_KEY, id);
      }
      setVisitorId(id);
    } catch (error) {
        console.error("Could not access session storage. Using a temporary visitor ID.", error);
        setVisitorId(generateId());
    }
  }, []);

  return { visitorId };
};