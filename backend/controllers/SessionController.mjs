import express from "express";
import { SessionModel } from "../models/SessionModel.mjs";
import { ActivityModel } from "../models/ActivityModel.mjs";
import { LocationModel } from "../models/LocationModel.mjs";
import { UserModel } from "../models/UserModel.mjs";

export class SessionController {
    static routes = express.Router();

    static {
        this.routes.get("/", this.viewAdmin);
        this.routes.get("/:id", this.viewAdmin);
        this.routes.post("/", this.handleAdmin);
        this.routes.post("/:id", this.handleAdmin);

        this.routes.post("/:id/delete", this.handleDelete);
    }

    static validateSessionData(data, isUpdate = false) {
        const errors = [];


        if (!data.activity_id || data.activity_id === "") {
            errors.push("Activity is required");
        }

        if (!data.location_id || data.location_id === "") {
            errors.push("Location is required");
        }


        if (!data.trainer_id || data.trainer_id === "") {
            errors.push("Trainer is required");
        }


        if (!data.date || data.date.trim().length === 0) {
            errors.push("Date is required");
        } else {
            const sessionDate = new Date(data.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            sessionDate.setHours(0, 0, 0, 0);

            if (sessionDate < today) {
                errors.push("Session date cannot be in the past");
            }


            const isToday = sessionDate.getTime() === today.getTime();

            if (isToday && data.start_time) {
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();

                const [startHour, startMinute] = data.start_time.split(':').map(Number);

                if (startHour < currentHour || (startHour === currentHour && startMinute < currentMinute)) {
                    errors.push("Session start time cannot be in the past for today's date");
                }
            }


            if (isToday && data.end_time) {
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();

                const [endHour, endMinute] = data.end_time.split(':').map(Number);


                if (endHour < currentHour || (endHour === currentHour && endMinute <= currentMinute)) {
                    errors.push("Session end time must be in the future for today's date");
                }
            }
        }


        if (!data.start_time || data.start_time.trim().length === 0) {
            errors.push("Start time is required");
        }


        if (!data.end_time || data.end_time.trim().length === 0) {
            errors.push("End time is required");
        }


        if (data.start_time && data.end_time && data.start_time >= data.end_time) {
            errors.push("End time must be after start time");
        }


        if (!data.max_capacity || isNaN(data.max_capacity) || Number(data.max_capacity) <= 0) {
            errors.push("Max capacity must be a positive number");
        } else if (Number(data.max_capacity) > 100) {
            errors.push("Max capacity cannot exceed 100 people");
        }

        return errors;
    }

    static async viewAdmin(req, res) {
        try {
            const selectedId = req.params.id;

            console.log('Loading sessions...');
            let sessions = await SessionModel.getAllWithDetails();
            console.log('Sessions loaded:', sessions.length);

            const activities = await ActivityModel.getAll();
            const locations = await LocationModel.getAll();
            const trainers = await UserModel.getAll().then(us => us.filter(u => u.role === "trainer"));


            const filterStatus = req.query.status || '';
            const filterActivity = req.query.activity || '';
            const filterTrainer = req.query.trainer || '';
            const filterLocation = req.query.location || '';
            const filterDate = req.query.date || '';


            if (filterStatus) {
                sessions = sessions.filter(s => s.status === filterStatus);
            }

            if (filterActivity) {
                sessions = sessions.filter(s => s.activity_id == filterActivity);
            }

            if (filterTrainer) {
                sessions = sessions.filter(s => s.trainer_id == filterTrainer);
            }

            if (filterLocation) {
                sessions = sessions.filter(s => s.location_id == filterLocation);
            }

            if (filterDate) {
                sessions = sessions.filter(s => s.date === filterDate);
            }

            const selectedSession =
                sessions.find(s => s.id == selectedId) ??
                {
                    id: null, activity_id: "", location_id: "", trainer_id: "", date: "", start_time: "", end_time: "",
                    max_capacity: 20, current_bookings: 0, special_notes: "", status: "scheduled"
                };


            const success = req.query.success || null;
            const error = req.query.error || null;
            const errors = [];

            res.render("sessions_admin.ejs", {
                sessions,
                selectedSession,
                activities,
                locations,
                trainers,
                success,
                error,
                errors,
                filterStatus,
                filterActivity,
                filterTrainer,
                filterLocation,
                filterDate
            });
        } catch (e) {
            console.error('ERROR in viewAdmin:', e);
            res.status(500).send(`Error: ${e.message}`);
        }
    }
    static async handleAdmin(req, res) {
        const id = req.params.id;
        const f = req.body;
        const action = f.action;

        console.log('=== SESSION ADMIN ACTION ===');
        console.log('Action:', action);
        console.log('Session ID:', id);


        const isUpdate = action === 'update';
        const validationErrors = SessionController.validateSessionData(f, isUpdate);

        if (validationErrors.length > 0) {

            const sessions = await SessionModel.getAllWithDetails();
            const activities = await ActivityModel.getAll();
            const locations = await LocationModel.getAll();
            const trainers = await UserModel.getAll().then(us => us.filter(u => u.role === "trainer"));

            return res.render("sessions_admin.ejs", {
                sessions,
                selectedSession: { id, ...f },
                activities,
                locations,
                trainers,
                errors: validationErrors,
                success: null,
                error: null,
                filterStatus: '',
                filterActivity: '',
                filterTrainer: '',
                filterLocation: '',
                filterDate: ''
            });
        }

        const dto = {
            id,
            activity_id: Number(f.activity_id),
            location_id: Number(f.location_id),
            trainer_id: Number(f.trainer_id),
            date: f.date,
            start_time: f.start_time,
            end_time: f.end_time,
            max_capacity: Number(f.max_capacity ?? 20),
            current_bookings: Number(f.current_bookings ?? 0),
            special_notes: f.special_notes ?? "",
            status: f.status || "scheduled"
        };

        try {
            if (action === "create") {
                await SessionModel.create(dto);
                return res.redirect("/sessions?success=session_created");
            }
            if (action === "update") {
                await SessionModel.update(dto);
                return res.redirect("/sessions?success=session_updated");
            }
            if (action === "delete") {
                await SessionModel.delete(id);
                return res.redirect("/sessions?success=session_deleted");
            }
            return res.status(400).render("status.ejs", {
                status: "Invalid action",
                message: "Unsupported action.",
                user: req.session.user || null
            });
        } catch (e) {
            console.error("Error in handleAdmin:", e);

            const sessions = await SessionModel.getAllWithDetails();
            const activities = await ActivityModel.getAll();
            const locations = await LocationModel.getAll();
            const trainers = await UserModel.getAll().then(us => us.filter(u => u.role === "trainer"));

            res.render("sessions_admin.ejs", {
                sessions,
                selectedSession: { id, ...f },
                activities,
                locations,
                trainers,
                errors: ["Database error: " + e.message],
                success: null,
                error: null,
                filterStatus: '',
                filterActivity: '',
                filterTrainer: '',
                filterLocation: '',
                filterDate: ''
            });
        }
    }


    static async handleDelete(req, res) {
        const id = req.params.id;
        try {
            await SessionModel.delete(id);
            res.redirect("/sessions?success=session_deleted");
        } catch (e) {
            console.error('Delete error:', e);
            res.redirect("/sessions?error=delete_failed");
        }
    }
}