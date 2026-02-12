import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md shadow-2xl">
            <div className="text-6xl mb-4 text-center">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-700 mb-6 text-center">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;