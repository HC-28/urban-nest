import React from 'react';

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
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #060d18 0%, #0d1526 50%, #060d18 100%)',
                    color: '#f1f5f9',
                    padding: '40px 20px',
                    fontFamily: '"Outfit", "Inter", system-ui, sans-serif',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '5rem',
                        marginBottom: '16px',
                        animation: 'float 3s ease-in-out infinite'
                    }}>⚠️</div>
                    <h1 style={{
                        fontFamily: '"Outfit", sans-serif',
                        fontSize: '2.25rem',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #ef4444, #f87171)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '12px'
                    }}>Something went wrong</h1>
                    <p style={{
                        color: '#94a3b8',
                        fontSize: '1.05rem',
                        marginBottom: '32px',
                        maxWidth: '400px',
                        lineHeight: '1.6'
                    }}>We're sorry for the inconvenience. Please try refreshing the page or return home.</p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '12px 28px',
                                background: 'transparent',
                                color: '#60a5fa',
                                border: '2px solid rgba(59,130,246,0.4)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            🔄 Try Again
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            style={{
                                padding: '12px 28px',
                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                fontFamily: 'inherit',
                                boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            🏠 Go Home
                        </button>
                    </div>

                    {process.env.NODE_ENV === 'development' && (
                        <div style={{ marginTop: '40px', padding: '20px', backgroundColor: 'rgba(255,0,0,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', maxWidth: '800px', width: '100%', overflow: 'auto', textAlign: 'left' }}>
                            <h3 style={{ color: '#ef4444', marginBottom: '8px', fontSize: '0.9rem' }}>🐛 {this.state.error?.toString()}</h3>
                            <pre style={{ color: '#f87171', fontSize: '11px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;



