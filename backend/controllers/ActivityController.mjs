import express from "express";
import { ActivityModel } from "../models/ActivityModel.mjs";

export class ActivityController {
    static routes = express.Router();

    static {
        this.routes.get("/", this.viewAdmin);
        this.routes.get("/:id", this.viewAdmin);
        this.routes.post("/", this.handleAdmin);
        this.routes.post("/:id", this.handleAdmin);

        this.routes.post("/:id/delete", this.handleDelete);
    }

    static async viewAdmin(req, res) {
        try {
            const selectedId = req.params.id;

            const filterName = req.query.name || '';
            const filterCategory = req.query.category || '';
            const filterDuration = req.query.duration || '';
            const filterMaxParticipants = req.query.max_participants || '';

            let activities = await ActivityModel.getAll();

            // Получаем уникальные значения для фильтров
            const categories = [...new Set(activities.map(a => a.category).filter(c => c))];
            const activityNames = activities.map(a => ({ id: a.id, name: a.name }));
            const durations = [...new Set(activities.map(a => a.duration))].sort((a, b) => a - b);
            const maxParticipants = [...new Set(activities.map(a => a.max_participants))].sort((a, b) => a - b);

            // Применяем фильтры
            if (filterName) {
                activities = activities.filter(a => a.id == filterName);
            }

            if (filterCategory) {
                activities = activities.filter(a => a.category === filterCategory);
            }

            if (filterDuration) {
                activities = activities.filter(a => a.duration == filterDuration);
            }

            if (filterMaxParticipants) {
                activities = activities.filter(a => a.max_participants == filterMaxParticipants);
            }

            const selectedActivity =
                activities.find(a => a.id == selectedId) ??
                { id: null, name: "", description: "", duration: 60, max_participants: 20, equipment_needed: "", category: "" };

            const success = req.query.success || null;
            const error = req.query.error || null;

            res.render("activities_admin.ejs", {
                activities,
                selectedActivity,
                categories,
                activityNames,
                durations,
                maxParticipants,
                success,
                error,
                filterName,
                filterCategory,
                filterDuration,
                filterMaxParticipants
            });
        } catch (e) {
            console.error(e);
            res.status(500).render("status.ejs", { status: "Error", message: "Cannot load activities." });
        }
    }

    static async handleAdmin(req, res) {
        const id = req.params.id;
        const f = req.body;
        const action = f.action;

        const dto = {
            id,
            name: f.name,
            description: f.description,
            duration: Number(f.duration ?? 60),
            max_participants: Number(f.max_participants ?? 20),
            equipment_needed: f.equipment_needed,
            category: f.category
        };

        try {
            if (action === "create") {
                await ActivityModel.create(dto);
                return res.redirect("/activities?success=activity_created");
            }
            if (action === "update") {
                await ActivityModel.update(dto);
                return res.redirect("/activities?success=activity_updated");
            }
            if (action === "delete") {
                try {
                    await ActivityModel.delete(id);
                    return res.redirect("/activities?success=activity_deleted");
                } catch (e) {
                    if (e.code === 'ER_ROW_IS_REFERENCED' || e.errno === 1217 || e.errno === 1451) {
                        return res.redirect("/activities?error=constraint_failed");
                    }
                    throw e;
                }
            }
            return res.status(400).render("status.ejs", { status: "Invalid action", message: "Unsupported action." });
        } catch (e) {
            console.error(e);
            res.status(500).render("status.ejs", { status: "DB error", message: "Activity operation failed." });
        }
    }


    static async handleDelete(req, res) {
        const id = req.params.id;
        console.log('🗑️ DELETE REQUEST received for activity ID:', id);
        try {
            const result = await ActivityModel.delete(id);
            console.log('✅ Delete successful:', result);
            res.redirect("/activities?success=activity_deleted");
        } catch (e) {
            console.error('❌ Delete error:', e);


            if (e.code === 'ER_ROW_IS_REFERENCED' || e.errno === 1217 || e.errno === 1451) {
                return res.redirect("/activities?error=constraint_failed");
            }

            res.redirect("/activities?error=delete_failed");
        }
    }
}