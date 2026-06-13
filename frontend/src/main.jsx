import React from "react";
window.React = React;
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import App from "./App";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import { ThemeProvider } from "next-themes";
import "./index.css";
import "./i18n";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </Provider>
);
