import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { resolveSchoolByDomainApi } from './api/school.api';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import SuperAdminLogin from './pages/auth/SuperAdminLogin';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import GoogleAuthCallback from './pages/auth/GoogleAuthCallback';

// Super Admin
import SuperAdminDashboard from './pages/superAdmin/Dashboard';
import ManageSchools from './pages/superAdmin/ManageSchools';
import CreateSchool from './pages/superAdmin/CreateSchool';
import Plans from './pages/superAdmin/Plans';
import SubdomainRequests from './pages/superAdmin/SubdomainRequests';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import ModuleSelector from './pages/admin/ModuleSelector';
import AcceptTerms from './pages/admin/AcceptTerms';
import Billing from './pages/admin/Billing';
import AdminSettings from './pages/admin/Settings';
import ModulePage from './pages/admin/ModulePage';
import ContactUs from './pages/admin/ContactUs';
import HomePage from './pages/admin/modules/HomePage';
import AboutUs from './pages/admin/modules/AboutUs';
import FeeStructure from './pages/admin/modules/FeeStructure';
import Courses from './pages/admin/modules/Courses';
import Faculty from './pages/admin/modules/Faculty';
import Infrastructure from './pages/admin/modules/Infrastructure';
import Sports from './pages/admin/modules/Sports';
import Gallery from './pages/admin/modules/Gallery';
import Achievements from './pages/admin/modules/Achievements';
import Alumni from './pages/admin/modules/Alumni';
import Testimonials from './pages/admin/modules/Testimonials';
import AdmissionProcedure from './pages/admin/modules/AdmissionProcedure';
import BookList from './pages/admin/modules/BookList';
import ParentsCorner from './pages/admin/modules/ParentsCorner';
import PublicDisclosure from './pages/admin/modules/PublicDisclosure';
import TCInformation from './pages/admin/modules/TCInformation';
import Announcements from './pages/admin/modules/Announcements';
import Events from './pages/admin/modules/Events';
import Circulars from './pages/admin/modules/Circulars';
import Faqs from './pages/admin/modules/Faqs';
import Calendar from './pages/admin/modules/Calendar';
import Results from './pages/admin/modules/Results';
import AdmissionEnquiry from './pages/admin/modules/AdmissionEnquiry';
import CareerEnquiry from './pages/admin/modules/CareerEnquiry';
// School Website
import SchoolWebsite from './pages/school/SchoolWebsite';
import AboutUsPublic from './pages/school/AboutUsPublic';
import FeeStructurePublic from './pages/school/FeeStructurePublic';
import CoursesPublic from './pages/school/CoursesPublic';
import SchoolNotFound from './pages/school/SchoolNotFound';
import FacultyPublic from './pages/school/FacultyPublic';
import SchoolLevelPublic from './pages/school/SchoolLevelPublic';
import InfrastructurePublic from './pages/school/InfrastructurePublic';
import GalleryPublic from './pages/school/GalleryPublic';
import SportsPublic from './pages/school/SportsPublic';
import AchievementsPublic from './pages/school/AchievementsPublic';
import AlumniPublic from './pages/school/AlumniPublic';
import TestimonialsPublic from './pages/school/TestimonialsPublic';
import AdmissionProcedurePublic from './pages/school/AdmissionProcedurePublic';
import BookListPublic from './pages/school/BookListPublic';
import ParentsCornerPublic from './pages/school/ParentsCornerPublic';
import PublicDisclosurePublic from './pages/school/PublicDisclosurePublic';
import TCInformationPublic from './pages/school/TCInformationPublic';
import AnnouncementsPublic from './pages/school/AnnouncementsPublic';
import AnnouncementDetailPublic from './pages/school/AnnouncementDetailPublic';
import EventsPublic from './pages/school/EventsPublic';
import EventDetailPublic from './pages/school/EventDetailPublic';
import CircularsPublic from './pages/school/CircularsPublic';
import CircularDetailPublic from './pages/school/CircularDetailPublic';
import FaqsPublic from './pages/school/FaqsPublic';
import CalendarPublic from './pages/school/CalendarPublic';
import ResultsPublic from './pages/school/ResultsPublic';
// Layouts
import SuperAdminLayout from './layouts/SuperAdminLayout';
import AdminLayout from './layouts/AdminLayout';

// Protected Route
import ProtectedRoute from './components/common/ProtectedRoute';
import EnquiryWidget from './components/public/EnquiryWidget';

// ── Public school site routes — shared between the normal `/school/:slug/*` tree
// and CustomDomainRoutes below (which reuses these same path patterns against a
// synthetic location so none of the ~20 public page components need to change). ──
const PUBLIC_SCHOOL_ROUTE_DEFS = [
    { path: '/school/:slug', element: <SchoolWebsite /> },
    { path: '/school/:slug/about', element: <AboutUsPublic /> },
    { path: '/school/:slug/fee', element: <FeeStructurePublic /> },
    { path: '/school/:slug/faculty', element: <FacultyPublic /> },
    { path: '/school/:slug/infrastructure/:categorySlug', element: <InfrastructurePublic /> },
    { path: '/school/:slug/infrastructure', element: <InfrastructurePublic /> },
    { path: '/school/:slug/sports/:pageSlug', element: <SportsPublic /> },
    { path: '/school/:slug/sports', element: <SportsPublic /> },
    { path: '/school/:slug/gallery/:tab', element: <GalleryPublic /> },
    { path: '/school/:slug/gallery', element: <GalleryPublic /> },
    { path: '/school/:slug/achievements', element: <AchievementsPublic /> },
    { path: '/school/:slug/alumni', element: <AlumniPublic /> },
    { path: '/school/:slug/testimonials', element: <TestimonialsPublic /> },
    { path: '/school/:slug/admission-procedure', element: <AdmissionProcedurePublic /> },
    { path: '/school/:slug/book-list', element: <BookListPublic /> },
    { path: '/school/:slug/parents-corner', element: <ParentsCornerPublic /> },
    { path: '/school/:slug/public-disclosure', element: <PublicDisclosurePublic /> },
    { path: '/school/:slug/tc', element: <TCInformationPublic /> },
    { path: '/school/:slug/announcements/:id', element: <AnnouncementDetailPublic /> },
    { path: '/school/:slug/announcements', element: <AnnouncementsPublic /> },
    { path: '/school/:slug/events/:id', element: <EventDetailPublic /> },
    { path: '/school/:slug/events', element: <EventsPublic /> },
    { path: '/school/:slug/circulars/:id', element: <CircularDetailPublic /> },
    { path: '/school/:slug/circulars', element: <CircularsPublic /> },
    { path: '/school/:slug/faqs', element: <FaqsPublic /> },
    { path: '/school/:slug/calendar', element: <CalendarPublic /> },
    { path: '/school/:slug/results', element: <ResultsPublic /> },
    { path: '/school/:slug/:levelSlug', element: <SchoolLevelPublic /> },
];

// ── Platform hosts — anything else attempting a page load is treated as a
// candidate custom domain and resolved via the backend before rendering. ──
const isPlatformHost = (host) => {
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app') || host === 'wbpro.in' || host === 'www.wbpro.in') return true;
    // Direct VPS IP access (e.g. 192.168.1.10, 159.65.1.2)
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return true;
    const configuredHost = import.meta.env.VITE_PLATFORM_HOST;
    if (configuredHost && (host === configuredHost || host === `www.${configuredHost}`)) return true;
    return false;
};

const FullPageSpinner = () => (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTop: '3px solid #4169E1', borderRadius: '50%', animation: 'appSpin 1s linear infinite' }}></div>
        <style>{`@keyframes appSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

// ── Renders the exact same public school routes, but matched against a synthetic
// location that has the resolved slug's `/school/:slug` prefix prepended — so a
// visitor on their own connected domain sees clean URLs (yourschool.com/about)
// while every public page component still reads `slug` from useParams() as normal.
//
// Internal navigation (Navbar/Footer's `go()`, "Back to Home" buttons, etc.) calls
// `navigate('/school/${slug}/...')` unconditionally — the same absolute path used
// on the platform's own /school/:slug/* tree — since none of those ~25 public page
// components know whether they're being rendered on the platform host or a
// connected domain. Left unguarded, prepending the prefix a second time onto an
// already-prefixed real pathname produced /school/mcs/school/mcs/about, matched no
// route, and silently bounced to home — reproducible by clicking any nav link on a
// connected domain (typing the URL directly worked fine, since that always
// produces an unprefixed real pathname). Skip the prepend when the real pathname
// is already prefixed. ──
const CustomDomainRoutes = ({ slug }) => {
    const location = useLocation();
    const alreadyPrefixed = location.pathname === `/school/${slug}` || location.pathname.startsWith(`/school/${slug}/`);
    const syntheticLocation = alreadyPrefixed
        ? location
        : { ...location, pathname: `/school/${slug}${location.pathname === '/' ? '' : location.pathname}` };
    return (
        <Routes location={syntheticLocation}>
            {PUBLIC_SCHOOL_ROUTE_DEFS.map(r => <Route key={r.path} path={r.path} element={r.element} />)}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

// ── Detects whether the current hostname belongs to the platform itself or to a
// school's connected custom domain, and routes accordingly. ──
const RootRouter = () => {
    const [domainState, setDomainState] = useState(() => (
        isPlatformHost(window.location.hostname) ? { status: 'platform' } : { status: 'checking' }
    ));

    useEffect(() => {
        if (domainState.status !== 'checking') return;
        resolveSchoolByDomainApi(window.location.hostname)
            .then((res) => setDomainState(res?.data?.slug ? { status: 'custom', slug: res.data.slug } : { status: 'platform' }))
            .catch(() => setDomainState({ status: 'platform' }));
    }, [domainState.status]);

    if (domainState.status === 'checking') return <FullPageSpinner />;
    if (domainState.status === 'custom') {
        return (
            <>
                <EnquiryWidget customSlug={domainState.slug} />
                <CustomDomainRoutes slug={domainState.slug} />
            </>
        );
    }

    return (
        <>
        <EnquiryWidget />
        <Routes>

            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/super-admin/login" element={<SuperAdminLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword role="admin" />} />
            <Route path="/super-admin/forgot-password" element={<ForgotPassword role="super_admin" />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<GoogleAuthCallback />} />
            <Route path="/" element={<LandingPage />} />

            {/* Public School Website */}
            {PUBLIC_SCHOOL_ROUTE_DEFS.map(r => <Route key={r.path} path={r.path} element={r.element} />)}
            <Route path="/school-not-found" element={<SchoolNotFound />} />

            {/* Super Admin Protected Routes */}
            <Route path="/super-admin" element={
                <ProtectedRoute allowedRole="super_admin">
                    <SuperAdminLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<SuperAdminDashboard />} />
                <Route path="schools" element={<ManageSchools />} />
                <Route path="schools/create" element={<CreateSchool />} />
                <Route path="plans" element={<Plans />} />
                <Route path="subdomain-requests" element={<SubdomainRequests />} />
            </Route>

            {/* Admin Protected Routes */}
            <Route path="/admin" element={
                <ProtectedRoute allowedRole="admin">
                    <AdminLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="accept-terms" element={<AcceptTerms />} />
                <Route path="modules/select" element={<ModuleSelector />} />
                <Route path="billing" element={<Billing />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="contact" element={<ContactUs />} />
                {/* Specific module routes pehle */}
                <Route path="module/home" element={<HomePage />} />
                <Route path="module/about" element={<AboutUs />} />
                <Route path="module/fee" element={<FeeStructure />} />
                <Route path="module/courses" element={<Courses />} />
                <Route path="module/faculty" element={<Faculty />} />
                <Route path="module/infrastructure" element={<Infrastructure />} />
                <Route path="module/sports" element={<Sports />} />
                <Route path="module/gallery" element={<Gallery />} />
                <Route path="module/achievements" element={<Achievements />} />
                <Route path="module/alumni" element={<Alumni />} />
                <Route path="module/testimonials" element={<Testimonials />} />
                <Route path="module/admissionProcedure" element={<AdmissionProcedure />} />
                <Route path="module/bookList" element={<BookList />} />
                <Route path="module/parentsCorner" element={<ParentsCorner />} />
                <Route path="module/disclosure" element={<PublicDisclosure />} />
                <Route path="module/tc" element={<TCInformation />} />
                <Route path="module/announcements" element={<Announcements />} />
                <Route path="module/events" element={<Events />} />
                <Route path="module/circulars" element={<Circulars />} />
                <Route path="module/faqs" element={<Faqs />} />
                <Route path="module/calendar" element={<Calendar />} />
                <Route path="module/results" element={<Results />} />
                <Route path="module/admission" element={<AdmissionEnquiry />} />
                <Route path="module/career" element={<CareerEnquiry />} />
                {/* Generic module route baad mein */}
                <Route path="module/:moduleKey" element={<ModulePage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
        </>
    );
};

function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-right" />
            <RootRouter />
        </BrowserRouter>
    );
}

export default App;