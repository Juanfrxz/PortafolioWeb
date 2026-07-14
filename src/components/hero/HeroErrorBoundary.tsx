import { Component, type ErrorInfo, type ReactNode } from 'react';

interface HeroErrorBoundaryProps {
  children: ReactNode;
  onError: (error: Error, info: ErrorInfo) => void;
}

interface HeroErrorBoundaryState {
  failed: boolean;
}

export class HeroErrorBoundary extends Component<
  HeroErrorBoundaryProps,
  HeroErrorBoundaryState
> {
  override state: HeroErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): HeroErrorBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError(error, info);
  }

  override render() {
    if (this.state.failed) {
      return null;
    }

    return this.props.children;
  }
}
