import React from 'react'

interface AIFirstUsePromptProps {
  onAccept: () => void
  onDecline: () => void
}

function AIFirstUsePrompt(props: AIFirstUsePromptProps) {
  const { onAccept, onDecline } = props;
  return (
    <div className="ai-first-use-prompt">
      <div className="prompt-content">
        <h2>AI Assistant Feature</h2>
        <p>The AI Assistant feature requires downloading a large model file (~2GB) to your device.</p>
        <p>Once downloaded, it will run locally in your browser without requiring an internet connection.</p>
        <p>Do you want to proceed with downloading the model?</p>
        <div className="prompt-buttons">
          <button onClick={onAccept}>Yes, download now</button>
          <button onClick={onDecline}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default AIFirstUsePrompt
