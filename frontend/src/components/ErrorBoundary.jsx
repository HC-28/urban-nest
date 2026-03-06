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
                    backgroundColor: '#0f172a',
                    color: '#f1f5f9',
                    padding: '20px',
                    fontFamily: 'system-ui, sans-serif'
                }}>
                    <h1 style={{ color: '#ef4444', marginBottom: '10px' }}>Oops! Something went wrong.</h1>
                    <p style={{ color: '#94a3b8', marginBottom: '20px' }}>We're sorry, but the application encountered an unexpected error.</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Return to Home
                    </button>

                    {process.env.NODE_ENV === 'development' && (
                        <div style={{ marginTop: '40px', padding: '20px', backgroundColor: 'rgba(255,0,0,0.1)', borderRadius: '8px', maxWidth: '800px', width: '100%', overflow: 'auto' }}>
                            <h3 style={{ color: '#ef4444' }}>{this.state.error?.toString()}</h3>
                            <pre style={{ color: '#f87171', fontSize: '12px', marginTop: '10px' }}>
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
