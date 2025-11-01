import express from "express";
import { SessionModel } from "../models/SessionModel.mjs";
import { ActivityModel } from "../models/ActivityModel.mjs";
import { LocationModel } from "../models/LocationModel.mjs";

export class TrainerController {
    static routes = express.Router();

    static {

        this.routes.get("/trainer-dashboard", this.viewDashboard);
        this.routes.get("/trainer-dashboard/:id", this.viewDashboard);


        this.routes.post("/trainer/sessions/", this.createSession);
        this.routes.post("/trainer/sessions/:id", this.updateSession);
        this.routes.post("/trainer/sessions/:id/delete", this.deleteSession);
    }

    static async viewDashboard(req, res) {
        try {
            if (!req.session.user || req.session.user.role !== 'trainer') {
                return res.redirect("/login");
            }

            const trainerId = req.session.user.id;
            const selectedId = req.params.id;

            const allSessions = await SessionModel.getAllWithDetails();
            const sessions = allSessions.filter(s => s.trainer_id === trainerId);


            const activities = await ActivityModel.getAll();
            const locations = await LocationModel.getAll();


            const selectedSession = sessions.find(s => s.id == selectedId) ?? {
                id: null,
                activity_id: "",
                location_id: "",
                trainer_id: trainerId,
                date: "",
                start_time: "",
                end_time: "",
                max_capacity: 20,
                current_bookings: 0,
                special_notes: "",
                status: "scheduled"
            };


            const success = req.query.success || null;
            const error = req.query.error || null;

            res.render("trainer_dashboard", {
                user: req.session.user,
                sessions,
                selectedSession,
                activities,
                locations,
                success,
                error
            });
        } catch (e) {
            console.error("Trainer dashboard error:", e);
            res.status(500).send("Error loading dashboard");
        }
    }

    static async createSession(req, res) {
        try {
            if (!req.session.user || req.session.user.role !== 'trainer') {
                return res.redirect("/login");
            }

            const f = req.body;

            const dto = {
                activity_id: Number(f.activity_id),
                location_id: Number(f.location_id),
                trainer_id: req.session.user.id,
                date: f.date,
                start_time: SessionModel.formatTimeForDB(f.start_time),
                end_time: SessionModel.formatTimeForDB(f.end_time),
                max_capacity: Number(f.max_capacity ?? 20),
                current_bookings: 0,
                special_notes: f.special_notes || "",
                status: "scheduled"
            };

            await SessionModel.create(dto);
            res.redirect("/trainer-dashboard?success=session_created");
        } catch (e) {
            console.error("Create session error:", e);
            res.redirect("/trainer-dashboard?error=Failed to create session");
        }
    }

    static async updateSession(req, res) {
        try {
            if (!req.session.user || req.session.user.role !== 'trainer') {
                return res.redirect("/login");
            }

            const sessionId = req.params.id;
            const f = req.body;


            const session = await SessionModel.getById(sessionId);
            if (session.trainer_id !== req.session.user.id) {
                return res.redirect("/trainer-dashboard?error=Access denied");
            }

            const dto = {
                id: sessionId,
                activity_id: Number(f.activity_id),
                location_id: Number(f.location_id),
                trainer_id: req.session.user.id,
                date: f.date,
                start_time: f.start_time,
                end_time: f.end_time,
                max_capacity: Number(f.max_capacity),
                current_bookings: session.current_bookings,
                special_notes: f.special_notes || "",
                status: session.status
            };

            await SessionModel.update(dto);
            res.redirect("/trainer-dashboard?success=session_updated");
        } catch (e) {
            console.error("Update session error:", e);
            res.redirect("/trainer-dashboard?error=Failed to update session");
        }
    }

    static async deleteSession(req, res) {
        try {
            if (!req.session.user || req.session.user.role !== 'trainer') {
                return res.redirect("/login");
            }

            const sessionId = req.params.id;


            const session = await SessionModel.getById(sessionId);
            if (session.trainer_id !== req.session.user.id) {
                return res.redirect("/trainer-dashboard?error=Access denied");
            }

            await SessionModel.delete(sessionId);
            res.redirect("/trainer-dashboard?success=session_deleted");
        } catch (e) {
            console.error("Delete session error:", e);
            res.redirect("/trainer-dashboard?error=Failed to delete session");
        }
    }
}