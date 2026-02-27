import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

type BoundaryState = {
	hasError: boolean;
	errorMessage: string;
};

class RootErrorBoundary extends React.Component<React.PropsWithChildren, BoundaryState> {
	state: BoundaryState = {
		hasError: false,
		errorMessage: "",
	};

	static getDerivedStateFromError(error: unknown): BoundaryState {
		return {
			hasError: true,
			errorMessage: error instanceof Error ? error.message : String(error),
		};
	}

	componentDidCatch(error: unknown, errorInfo: unknown) {
		console.error("[Renderer] React boundary error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div style={{
					minHeight: "100vh",
					background: "#0A0A0C",
					color: "#F3F4F6",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: "24px",
					fontFamily: "Inter, system-ui, sans-serif",
				}}>
					<div style={{ maxWidth: "720px", width: "100%", background: "#111218", borderRadius: "12px", padding: "20px" }}>
						<h2 style={{ margin: 0, marginBottom: "10px" }}>Connecta startup error</h2>
						<p style={{ opacity: 0.85, marginTop: 0 }}>Renderer crashed during initialization.</p>
						<pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", opacity: 0.95 }}>{this.state.errorMessage}</pre>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

const showFatalScreen = (message: string) => {
	const rootElement = document.getElementById("root");
	if (!rootElement) return;

	rootElement.innerHTML = `
		<div style="min-height:100vh;background:#0A0A0C;color:#F3F4F6;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Inter,system-ui,sans-serif;">
			<div style="max-width:720px;width:100%;background:#111218;border-radius:12px;padding:20px;">
				<h2 style="margin:0 0 10px 0;">Connecta fatal startup error</h2>
				<p style="opacity:.85;margin-top:0;">Application failed before React was fully mounted.</p>
				<pre style="white-space:pre-wrap;word-break:break-word;opacity:.95;">${message}</pre>
			</div>
		</div>
	`;
};

window.addEventListener("error", (event) => {
	console.error("[Renderer] window error:", event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
	console.error("[Renderer] unhandled rejection:", event.reason);
});

try {
	const rootElement = document.getElementById("root");
	if (!rootElement) {
		throw new Error("Root element #root not found");
	}

	createRoot(rootElement).render(
		<RootErrorBoundary>
			<App />
		</RootErrorBoundary>
	);
} catch (error) {
	const errorMessage = error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error);
	console.error("[Renderer] fatal bootstrap error:", error);
	showFatalScreen(errorMessage);
}
  