import React, { useState, useEffect } from 'react';

const STAGES = {
  THINKING: 'Thinking',
  SUMMARIZING: 'Summarizing',
  FINISHING: 'Finishing up',
};

const TypingIndicator: React.FC = () => {
  const [stage, setStage] = useState(STAGES.THINKING);
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prevDots) => (prevDots % 3) + 1);
    }, 500);

    const summarizingTimer = setTimeout(() => {
      setStage(STAGES.SUMMARIZING);
    }, 10000);

    const finishingTimer = setTimeout(() => {
      setStage(STAGES.FINISHING);
    }, 20000);

    return () => {
      clearInterval(dotInterval);
      clearTimeout(summarizingTimer);
      clearTimeout(finishingTimer);
    };
  }, []);

  return (
    <div className="text-sm text-muted-foreground p-1">
      {stage}{'.'.repeat(dots)}
    </div>
  );
};

export default TypingIndicator;