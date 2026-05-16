import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardLayout } from "./pages/DashboardLayout";
import { DashboardHome } from "./pages/DashboardHome";
import { PlanTrip } from "./pages/PlanTrip";
import { MyTrips } from "./pages/MyTrips";
import { SavedPlaces } from "./pages/SavedPlaces";
import { Safety } from "./pages/Safety";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { ItineraryResult } from "./pages/ItineraryResult";
import SafeRide from './pages/SafeRide';
import SafeStays from './pages/SafeStays';
import EmergencyContacts from './pages/EmergencyContacts';
import { Community } from './pages/Community';

export const router = createBrowserRouter([
    {
        path: "/",
        Component: LandingPage,
    },
    {
        path: "/login",
        Component: LoginPage,
    },
    {
        path: "/register",
        Component: RegisterPage,
    },
    {
        path: "/dashboard",
        Component: DashboardLayout,
        children: [
            { index: true, Component: DashboardHome },
            { path: "plan-trip", Component: PlanTrip },
            { path: "my-trips", Component: MyTrips },
            { path: "saved", Component: SavedPlaces },
            { path: "safety", Component: Safety },
            { path: "profile", Component: Profile },
            { path: "settings", Component: Settings },
            { path: "itinerary/:id", Component: ItineraryResult },
            { path: "trips/:id", Component: ItineraryResult },
            { path: "safe-ride", Component: SafeRide },
            { path: "safe-stays", Component: SafeStays },
            { path: "emergency-contacts", Component: EmergencyContacts },
            { path: "community", Component: Community },
        ],
    },
]);
