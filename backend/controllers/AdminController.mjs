import express from "express";
import { UserModel } from "../models/UserModel.mjs";
import { SessionModel } from "../models/SessionModel.mjs";
import { BookingModel } from "../models/BookingModel.mjs";

export class AdminController {
    static routes = express.Router();

    static {
        this.routes.get("/admin/dashboard", this.viewDashboard);
        this.routes.get("/admin/users", (req, res) => res.redirect("/users"));
        this.routes.get("/admin/sessions", (req, res) => res.redirect("/sessions"));
        this.routes.get("/admin/bookings", (req, res) => res.redirect("/bookings"));
        this.routes.get("/admin/activities", (req, res) => res.redirect("/activities"));
        this.routes.get("/admin/locations", (req, res) => res.redirect("/locations"));
        this.routes.get("/admin/posts", (req, res) => res.redirect("/posts"));
    }

    static async viewDashboard(req, res) {
        try {
            // Get statistics
            const allUsers = await UserModel.getAll();
            const allSessions = await SessionModel.getAll();
            const allBookings = await BookingModel.getAll();

            const stats = {
                totalUsers: allUsers.length,
                totalMembers: allUsers.filter(u => u.role === 'member').length,
                upcomingSessions: allSessions.filter(s => {
                    const sessionDate = new Date(s.date);
                    return sessionDate >= new Date() && s.status === 'scheduled';
                }).length,
                totalBookings: allBookings.filter(b => b.status === 'confirmed').length
            };


            const recentBookingsData = await BookingModel.query(`
                SELECT 
                    b.id, b.status, b.created_at,
                    CONCAT(u.first_name, ' ', u.last_name) as member_name,
                    a.name as activity_name,
                    s.date as session_date
                FROM bookings b
                JOIN users u ON b.member_id = u.id
                JOIN sessions s ON b.session_id = s.id
                JOIN activities a ON s.activity_id = a.id
                ORDER BY b.created_at DESC
                LIMIT 10
            `);

            const recentBookings = recentBookingsData.map(row => ({
                member_name: row.member_name,
                activity_name: row.a?.activity_name || row.activity_name,
                session_date: new Date(row.s?.session_date || row.session_date).toLocaleDateString('en-AU'),
                status: row.b?.status || row.status
            }));

            res.render("admin_dashboard", {
                user: req.session.user,
                stats,
                recentBookings
            });

        } catch (error) {
            console.error("Dashboard error:", error);
            res.status(500).send("Failed to load dashboard: " + error.message);
        }
    }
}