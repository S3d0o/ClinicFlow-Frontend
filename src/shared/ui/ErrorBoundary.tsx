import { Component, type ErrorInfo, type ReactNode } from 'react';
import { isChunkLoadError, reloadOnceForChunkError } from '@/shared/lib/chunk-reload';
import { CrashFallback } from './CrashFallback';

interface State {
  hasError: boolean;
}

/**
 * Catches rendering errors so one broken screen doesn't blank the app. Give it a `key` that changes
 * on navigation so leaving the page clears the error.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // A page chunk from an older deploy is gone: reload once to fetch the new build
    if (isChunkLoadError(error) && reloadOnceForChunkError()) return;
    console.error('Screen crashed', error, info.componentStack);
  }

  render() {
    return this.state.hasError ? <CrashFallback /> : this.props.children;
  }
}
