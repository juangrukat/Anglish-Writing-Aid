import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [analyzedText, setAnalyzedText] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5002/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Backend response data:', data);
      
      // Process the text to intersperse original text with highlighted words
      let currentIdx = 0;
      const parts = [];
      // Ensure data.matches is an array and sort it
      const sortedMatches = Array.isArray(data.matches) ? data.matches.sort((a, b) => a.start - b.start) : [];
      console.log('Sorted matches:', sortedMatches);

      sortedMatches.forEach(match => {
        // Add text before the current match
        if (match.start > currentIdx) {
          parts.push({ type: 'text', content: inputText.substring(currentIdx, match.start) });
        }
        // Add the matched word
        parts.push({
          type: 'highlight',
          content: match.word,
          suggestions: match.suggestions,
          originalStart: match.start, // Store original start for replacement
          originalEnd: match.end      // Store original end for replacement
        });
        currentIdx = match.end;
      });

      // Add any remaining text after the last match
      if (currentIdx < inputText.length) {
        parts.push({ type: 'text', content: inputText.substring(currentIdx) });
      }
      console.log('Processed parts for rendering:', parts);
      setAnalyzedText(parts);
      console.log('analyzedText state updated.');

    } catch (e) {
      setError('Failed to analyze text: ' + e.message);
      console.error("Error analyzing text:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleReplace = (originalStart, originalEnd, newWord) => {
    console.log('handleReplace called with:', { originalStart, originalEnd, newWord });
    if (!analyzedText || analyzedText.length === 0) {
      console.log('analyzedText is empty or null, cannot replace.');
      return;
    }

    const currentText = inputText;
    console.log('Current text before replacement:', currentText);

    const newText = currentText.substring(0, originalStart) + newWord + currentText.substring(originalEnd);
    console.log('New text after replacement:', newText);

    setInputText(newText);
    console.log('inputText state updated.');

    // Re-analyze the new text
    handleAnalyze(newText);
    console.log('handleAnalyze called after replacement.');
  };

  // Removed automatic analysis on inputText change to prevent premature analysis and crashes.

  return (
    <div className="App">
      <header className="App-header">
        <h1>Anglish Writing Aid</h1>
      </header>
      <main>
        <textarea
          id="text-input"
          placeholder="Paste or type your text here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows="10"
          cols="80"
        ></textarea>
        <button onClick={handleAnalyze} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Text'}
        </button>

        {error && <p className="error-message">{error}</p>}
      </main>
      <div className="analyzed-output-container">
        <div className="analyzed-output">
          {analyzedText.length > 0 ? (
            <ErrorBoundary>
              {analyzedText.map((part, index) => {
                if (part.type === 'text') {
                  return <span key={index}>{part.content}</span>;
                } else if (part.type === 'highlight') {
                  console.log('Rendering highlight part:', JSON.stringify(part)); // Log the whole part as a string to avoid browser collapsing
                  console.log('Part suggestions for highlight:', JSON.stringify(part.suggestions)); // Log suggestions specifically
                  return (
                    <span key={index} className="highlighted-word">
                      {part.content}
                      {(part.suggestions && (
                        (Array.isArray(part.suggestions.attested) && part.suggestions.attested.length > 0) ||
                        (Array.isArray(part.suggestions.unattested) && part.suggestions.unattested.length > 0)
                      )) && (
                        <div className="suggestions-tooltip" ref={(el) => {
                          // Add positioning logic for tooltips
                          if (el) {
                            const rect = el.getBoundingClientRect();
                            const parentRect = el.parentElement.getBoundingClientRect();
                            
                            // Check if tooltip would be cut off on the right side
                            if (rect.right > window.innerWidth) {
                              el.classList.add('right-aligned');
                            } else {
                              el.classList.remove('right-aligned');
                            }
                            
                            // Check if tooltip would be cut off at the top
                            if (rect.top < 0) {
                              el.classList.add('bottom-aligned');
                            } else {
                              el.classList.remove('bottom-aligned');
                            }
                          }
                        }}>
                          {part.suggestions && Array.isArray(part.suggestions.attested) && part.suggestions.attested.length > 0 && (
                            <div className="suggestion-category">
                              <p>Attested:</p>
                              <div className="suggestion-buttons">
                                {part.suggestions.attested.map((s, i) => (
                                  <button key={`${index}-${i}-attested`} onClick={() => handleReplace(part.originalStart, part.originalEnd, s)}>{s}</button>
                                ))}
                              </div>
                            </div>
                          )}
                          {part.suggestions && Array.isArray(part.suggestions.unattested) && part.suggestions.unattested.length > 0 && (
                            <div className="suggestion-category">
                              <p>Unattested:</p>
                              <div className="suggestion-buttons">
                                {part.suggestions.unattested.map((s, i) => (
                                  <button key={`${index}-${i}-unattested`} onClick={() => handleReplace(part.originalStart, part.originalEnd, s)}>{s}</button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </span>
                  );
                }
                return null;
              })}
            </ErrorBoundary>
          ) : (
            <p>Type or paste text above to see Anglish suggestions.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// New ErrorBoundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div>
          <h2>Something went wrong during rendering.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default App;