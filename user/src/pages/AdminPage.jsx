import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

const AdminPage = () => {
    const { user, loading } = useAuth();
    
    const isAdmin = user?.role === 'admin';

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-1/2 bg-muted" />
                        <Skeleton className="h-10 w-full bg-muted" />
                        <Skeleton className="h-64 w-full bg-muted" />
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen flex flex-col bg-admin-bg text-foreground"
            style={{
                '--background': 'hsl(var(--admin-bg))',
                '--card': 'hsl(var(--admin-card))',
                '--border': 'hsl(var(--admin-border))',
                '--primary': 'hsl(var(--admin-primary))',
                '--highlight': 'hsl(var(--admin-highlight))',
            }}
        >
            <Helmet>
                <title>Trang Quản Trị | BVote Platform</title>
                <meta name="description" content="Khu vực quản trị dành cho quản trị viên của nền tảng BVote." />
                <meta property="og:title" content="Trang Quản Trị | BVote Platform" />
                <meta property="og:description" content="Khu vực quản trị dành cho quản trị viên của nền tảng BVote." />
            </Helmet>
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                <AdminDashboard />
            </main>
            <Footer />
        </motion.div>
    );
};

export default AdminPage;