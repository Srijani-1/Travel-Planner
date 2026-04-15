import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";


export const router = createBrowserRouter([
    {
        path: "/",
        Component: LandingPage,
    },
    {
        path: "/login",
        Component: LoginPage,
    },
]);
