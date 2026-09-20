import React, { useState, useCallback } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LocalOnboarding from "./pages/LocalOnboarding.jsx";
import { isOnboardingComplete } from "./services/localProfile.js";
import "./styles.css";

/**
 * Root — manages the entry flow:
 *
 *   Landing
 *     ↓ Start Learning (no profile) → Onboarding → App
 *     ↓ Continue Learning (profile exists) → App
 *
 *   Returning user (direct load):
 *     → App (skip landing entirely)
 */
function Root() {
  const [screen, setScreen] = useState(() =>
    isOnboardingComplete() ? "app" : "landing"
  );

  /**
   * "Start Learning" / "Continue Learning" from landing page.
   * If profile already exists, go straight to app.
   * If not, go to onboarding.
   */
  const handleStartLearning = useCallback(() => {
    if (isOnboardingComplete()) {
      setScreen("app");
    } else {
      setScreen("onboarding");
    }
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setScreen("app");
  }, []);

  if (screen === "landing") {
    return <LandingPage onStartLearning={handleStartLearning} />;
  }

  if (screen === "onboarding") {
    return <LocalOnboarding onComplete={handleOnboardingComplete} />;
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
