import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '@/components/states';
import { isChunkLoadError, reloadOnceForChunkError } from '@/lib/chunk-reload';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches render errors in a page so one broken page shows a recoverable error instead of a blank
 * app. `AppLayout` keys it by route, so navigating away clears the error.
 *
 * After a deploy, an open tab may ask for page chunks that no longer exist. That case reloads the
 * app once to pick up the new version instead of showing an error.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (isChunkLoadError(error) && reloadOnceForChunkError()) return;
    console.error('Page crashed', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-xl px-4 py-16">
          <ErrorState
            title="This page couldn’t be displayed"
            message="Something unexpected happened. Reload the page to try again."
            onRetry={() => window.location.reload()}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
