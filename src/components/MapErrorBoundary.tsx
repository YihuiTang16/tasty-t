import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export class MapErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex h-full items-center justify-center bg-paper-deep p-6 text-center text-sm text-muted" role="alert">
          The map could not be drawn. The place list and transit links still work.
        </div>
      );
    }
    return this.props.children;
  }
}
