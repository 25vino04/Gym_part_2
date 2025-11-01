import { DatabaseModel } from "./DatabaseModel.mjs";

export class ActivityModel extends DatabaseModel {
  constructor(id, name, description, duration, max_participants, equipment_needed, category, 
    created_at, updated_at) {
    super();
    this.id = id;
    this.name = name;
    this.description = description;
    this.duration = duration;
    this.max_participants = max_participants;
    this.equipment_needed = equipment_needed;
    this.category = category;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static tableToModel(row) {
    const r = row.activities;
    return new ActivityModel(
      r.id, r.name, r.description, r.duration, r.max_participants, 
      r.equipment_needed, r.category, r.created_at, r.updated_at
    );
  }

  static async getAll() {
    return this.query("SELECT * FROM activities").then(rows => rows.map(row => this.tableToModel(row)));
  }

  static async getById(id) {
    return this.query("SELECT * FROM activities WHERE id = ?", [id]).then(rows =>
      rows.length ? this.tableToModel(rows[0]) : Promise.reject("not found")
    );
  }

  static async create(a) {
    return this.query(
      `INSERT INTO activities (name, description, duration, max_participants, equipment_needed, category)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [a.name, a.description, a.duration, a.max_participants, a.equipment_needed, a.category]
    );
  }

  static async update(a) {
    return this.query(
      `UPDATE activities
       SET name=?, description=?, duration=?, max_participants=?, equipment_needed=?, 
       category=?, updated_at=NOW()
       WHERE id=?`,
      [a.name, a.description, a.duration, a.max_participants, a.equipment_needed, a.category, a.id]
    );
  }

  static async delete(id) {
    return this.query("DELETE FROM activities WHERE id=?", [id]).then(r => 
        r.affectedRows ? r : Promise.reject("not found"));
  }
}