import React, { Component } from 'react';

export class ZodErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, name: error.name, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          <h1>{this.state.name}</h1>
          <pre>{this.state.message}</pre>
        </>
      );
    }
    return this.props.children;
  }
}
