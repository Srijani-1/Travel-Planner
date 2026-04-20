import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardLayout } from "./pages/DashboardLayout";
import { DashboardHome } from "./pages/DashboardHome";
import { OTPVerify } from "./pages/OTPVerify";

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
        ]
    }
]);