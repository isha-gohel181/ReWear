import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/toaster";

// Import components
import Header from "./components/Header";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Fallback for protected routes */}
            <Route
              path="*"
              element={
                <>
                  <SignedIn>
                    <div className="text-center">
                      <h1 className="text-2xl font-bold">Page Not Found</h1>
                      <p className="text-muted-foreground">
                        The page you're looking for doesn't exist.
                      </p>
                    </div>
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
          </Routes>
        </main>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
