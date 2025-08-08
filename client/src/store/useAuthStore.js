import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL=import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");

            set({ authUser: res.data });

            get().connectSocket();
        } catch (error) {
            console.log("error in checkAuth: ", error);
            set({ authUser: null })
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({ authUser: res.data });
            toast.success("Account created successfully");
            
            get().connectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true});
        try {
            const res = await axiosInstance.post("/auth/login", data);
            console.log("login res: -> ", res);
            set({ authUser: res.data });
            toast.success("Logged in successfully");

            get().connectSocket();
        } catch (error) {
            console.log("error in login: ", error);
            toast.error(error.response?.data?.message);
        } finally {
            set({ isLoggingIn: false })
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
            toast.success("Logged Out Successfully");
            get().disconnectSocket();
        } catch (error) {
            toast.error(error.response.data.message); 
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await axiosInstance.put("/auth/update-profile", data);
            set({ authUser: res.data });
            toast.success("Profile updated successfully");
        } catch (error) {
            console.log("error in update profile: ", error);
            toast.error(error.response?.data.message);
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    connectSocket: () => {
        const { authUser } = get();
        if(!authUser || get().socket?.connected) return;

        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id,
            }
        });
        socket.connect();

        set({ socket:socket });

        socket.on("getOnlineUsers", (userIds) => {
            set({ onlineUsers: userIds });
        })
    },

    disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect();
    }
    
}))



/*
## isCheckingAuth: true (explanation below)
While the guard is checking your ID, you’re in a “waiting” state.

Once checked, you’re either allowed in (authenticated) or denied (not authenticated).

In your app:

The security guard is your checkAuth() logic (checking if the user is logged in).

The "waiting" state is isCheckingAuth: true.

Once the check is complete, isCheckingAuth becomes false.


🔁 Flow:
App starts ➡️ authUser = null, isCheckingAuth = true

App runs checkAuth() to see if user is logged in

When done:

If logged in → authUser = user, isCheckingAuth = false

If not → authUser = null, isCheckingAuth = false


If the user is authenticated:

authUser is set to the user's data.

isCheckingAuth is set to false.
*/