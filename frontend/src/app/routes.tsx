import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardLayout } from "./pages/DashboardLayout";
import { DashboardHome } from "./pages/DashboardHome";
import { OTPVerify } from "./pages/OTPverify";
import { PlanTrip } from "./pages/PlanTrip";
import { Profile } from "./pages/Profile";
import { ItineraryResult } from "./pages/ItineraryResult";

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
        path: "/verify-otp",
        Component: OTPVerify,
    },
    {
        path: "/dashboard",
        Component: DashboardLayout,
        children: [
            { index: true, Component: DashboardHome },
            { path: "plan-trip", Component: PlanTrip },
            { path: "profile", Component: Profile },
            { path: "itinerary/:id", Component: ItineraryResult },
        ]
    }
]);