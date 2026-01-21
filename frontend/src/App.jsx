import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Spinner from './components/Spinner';

const ShareReport = lazy(() => import('./pages/ShareReport'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const ProjectActivity = lazy(() => import('./pages/ProjectActivity'));
const Profile = lazy(() => import('./pages/Profile'));
const Billing = lazy(() => import('./pages/Billing'));
const APIKeys = lazy(() => import('./pages/APIKeys'));
const Landing = lazy(() => import('./pages/Landing'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Blog = lazy(() => import('./pages/Blog'));
const Legal = lazy(() => import('./pages/Legal'));
const Features = lazy(() => import('./pages/Features'));
const API = lazy(() => import('./pages/API'));
const Integrations = lazy(() => import('./pages/Integrations'));
const Documentation = lazy(() => import('./pages/Documentation'));
const Community = lazy(() => import('./pages/Community'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const NotFound = lazy(() => import('./pages/NotFound'));
import { ToastProvider } from './context/ToastContext';
import { isAuthenticated } from './utils/auth';
import './App.css';

function PrivateRoute({ children }) {
    return isAuthenticated() ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <BrowserRouter>
                    <div className="min-h-screen">
                        <Suspense fallback={<Spinner />}>
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/share/:shareToken" element={<ShareReport />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />

                                <Route
                                    path="/dashboard/projects/:idOrName/activity"
                                    element={
                                        <PrivateRoute>
                                            <ProjectActivity />
                                        </PrivateRoute>
                                    }
                                />

                                {/* Protected Routes wrapped in Layout */}
                                <Route element={<Layout />}>
                                    <Route
                                        path="/dashboard"
                                        element={
                                            <PrivateRoute>
                                                <Dashboard />
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/dashboard/projects"
                                        element={
                                            <PrivateRoute>
                                                <Projects />
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/dashboard/projects/:idOrName/:tab?"
                                        element={
                                            <PrivateRoute>
                                                <ProjectDetail />
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/dashboard/api-key"
                                        element={
                                            <PrivateRoute>
                                                <APIKeys />
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/dashboard/profile"
                                        element={
                                            <PrivateRoute>
                                                <Profile />
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/dashboard/billing"
                                        element={
                                            <PrivateRoute>
                                                <Billing />
                                            </PrivateRoute>
                                        }
                                    />
                                </Route>

                                <Route path="/" element={<Landing />} />
                                <Route path="/pricing" element={<Pricing />} />
                                <Route path="/blog" element={<Blog />} />
                                <Route path="/features" element={<Features />} />
                                <Route path="/api" element={<API />} />
                                <Route path="/integrations" element={<Integrations />} />
                                <Route path="/docs" element={<Documentation />} />
                                <Route path="/community" element={<Community />} />
                                <Route path="/help" element={<HelpCenter />} />
                                <Route path="/privacy" element={<Legal type="privacy" />} />
                                <Route path="/terms" element={<Legal type="terms" />} />
                                <Route path="/cookies" element={<Legal type="cookies" />} />
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Suspense>
                    </div>
                </BrowserRouter>
            </ToastProvider>
        </ErrorBoundary>
    );
}

export default App;
