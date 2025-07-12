//frontend/src/pages/LandingPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const LandingPage = () => {
  return (
    <div className="max-w-4xl mx-auto text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to MERN + Clerk Boilerplate
        </h1>
        <p className="text-xl text-muted-foreground">
          A complete authentication solution with MongoDB, Express, React, and
          Node.js
        </p>
      </div>

      <SignedOut>
        <div className="space-y-4">
          <p className="text-lg">Get started by signing up for an account</p>
          <SignUpButton mode="modal">
            <Button size="lg">Get Started</Button>
          </SignUpButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="space-y-4">
          <p className="text-lg">Welcome back! Check out your dashboard</p>
          <Link to="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
        </div>
      </SignedIn>

      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card>
          <CardHeader>
            <CardTitle>🔐 Authentication</CardTitle>
            <CardDescription>Complete auth solution with Clerk</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sign up, sign in, profile management, and webhooks all configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📱 Modern UI</CardTitle>
            <CardDescription>
              Built with Tailwind CSS and shadcn/ui
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Beautiful, responsive components ready to customize
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🚀 Full Stack</CardTitle>
            <CardDescription>Complete MERN stack setup</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              MongoDB, Express, React, Node.js all configured and connected
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LandingPage;
