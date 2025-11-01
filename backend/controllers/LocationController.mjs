import express from "express";
import { LocationModel } from "../models/LocationModel.mjs";

export class LocationController {
    static routes = express.Router();

    static {
        this.routes.get("/", this.viewAdmin);
        this.routes.get("/:id", this.viewAdmin);
        this.routes.post("/", this.handleAdmin);
        this.routes.post("/:id", this.handleAdmin);
        this.routes.post("/:id/delete", this.handleDelete);
    }



    static validateEmail(email) {
        if (!email) return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validateAustralianPhone(phone) {
        if (!phone) return true;
        const cleanPhone = phone.replace(/\s/g, '');
        const format1 = /^\+61\d{9}$/.test(cleanPhone);
        const format2 = /^0\d{9}$/.test(cleanPhone);
        return format1 || format2;
    }

    static validateLocationData(data) {
        const errors = [];

        if (!data.name || data.name.trim().length === 0) {
            errors.push("Location name is required");
        } else if (data.name.trim().length < 3) {
            errors.push("Location name must be at least 3 characters");
        }

        if (!data.address || data.address.trim().length === 0) {
            errors.push("Address is required");
        } else if (data.address.trim().length < 10) {
            errors.push("Address must be at least 10 characters");
        }

        if (data.email && !LocationController.validateEmail(data.email)) {
            errors.push("Please enter a valid email address");
        }

        if (data.phone && !LocationController.validateAustralianPhone(data.phone)) {
            errors.push("Phone must be in format +61XXXXXXXXX or 0XXXXXXXXX");
        }

        const capacity = Number(data.capacity);
        if (isNaN(capacity) || capacity < 10 || capacity > 500) {
            errors.push("Capacity must be a number between 10 and 500");
        }

        return errors;
    }



    static async viewAdmin(req, res) {
        try {
            const selectedId = req.params.id;


            const filterName = req.query.name || '';
            const filterAddress = req.query.address || '';

            let locations = await LocationModel.getAll();


            const locationNames = locations.map(l => ({ id: l.id, name: l.name }));


            if (filterName) {
                locations = locations.filter(l => l.id == filterName);
            }

            if (filterAddress) {
                const search = filterAddress.toLowerCase();
                locations = locations.filter(l => l.address?.toLowerCase().includes(search));
            }

            let selectedLocation = locations.find(l => l.id == selectedId);

            if (!selectedLocation && selectedId) {
                return res.status(404).render("status", {
                    status: "Not found",
                    message: "Location not found.",
                    user: req.session.user || null
                });
            }

            if (!selectedLocation) {
                selectedLocation = {
                    id: null,
                    name: "",
                    address: "",
                    phone: "",
                    email: "",
                    capacity: 50,
                    facilities: "",
                    opening_hours: ""
                };
            }


            const success = req.query.success || null;
            const error = req.query.error || null;

            res.render("locations_admin.ejs", {
                locations,
                selectedLocation,
                locationNames,
                errors: [],
                success,
                error,
                filterName,
                filterAddress
            });
        } catch (e) {
            console.error("Error in viewAdmin:", e);
            res.status(500).render("status", {
                status: "Error",
                message: "Cannot load locations.",
                user: req.session.user || null
            });
        }
    }


    static async handleAdmin(req, res) {
        const id = req.params.id;
        const f = req.body;
        const action = f.action;


        const validationErrors = LocationController.validateLocationData(f);

        if (validationErrors.length > 0) {
            const locations = await LocationModel.getAll();
            return res.render("locations_admin.ejs", {
                locations,
                selectedLocation: { id, ...f },
                errors: validationErrors,
                success: null,
                error: null
            });
        }


        const facilities = f.facilities?.trim() || "";
        const openingHours = f.opening_hours?.trim() || "";

        const dto = {
            id,
            name: f.name.trim(),
            address: f.address.trim(),
            phone: f.phone?.trim() || null,
            email: f.email?.trim() || null,
            capacity: Number(f.capacity ?? 50),
            facilities: facilities,
            opening_hours: openingHours
        };

        try {
            if (action === "create") {
                await LocationModel.create(dto);
                return res.redirect("/locations?success=location_created");
            }

            if (action === "update") {
                await LocationModel.update(dto);
                return res.redirect("/locations?success=location_updated");
            }

            if (action === "delete") {
                try {
                    await LocationModel.delete(id);
                    return res.redirect("/locations?success=location_deleted");
                } catch (e) {
                    if (e.code === 'ER_ROW_IS_REFERENCED' || e.errno === 1217 || e.errno === 1451) {
                        return res.redirect("/locations?error=constraint_failed");
                    }
                    throw e;
                }
            }

            return res.status(400).render("status", {
                status: "Invalid action",
                message: "Unsupported action.",
                user: req.session.user || null
            });
        } catch (e) {
            console.error("Error in handleAdmin:", e);


            if (e.code === 'ER_DUP_ENTRY') {
                const locations = await LocationModel.getAll();
                return res.render("locations_admin.ejs", {
                    locations,
                    selectedLocation: { id, ...f },
                    errors: ["This location name is already in use"],
                    success: null,
                    error: null
                });
            }

            res.status(500).render("status", {
                status: "DB error",
                message: "Location operation failed: " + e.message,
                user: req.session.user || null
            });
        }
    }


    static async handleDelete(req, res) {
        const id = req.params.id;
        console.log(' DELETE REQUEST received for location ID:', id);
        try {
            const result = await LocationModel.delete(id);
            console.log('✅ Delete successful:', result);
            res.redirect("/locations?success=location_deleted");
        } catch (e) {
            console.error('❌ Delete error:', e);

            if (e.code === 'ER_ROW_IS_REFERENCED' || e.errno === 1217 || e.errno === 1451) {
                return res.redirect("/locations?error=constraint_failed");
            }

            res.redirect("/locations?error=delete_failed");
        }
    }
}