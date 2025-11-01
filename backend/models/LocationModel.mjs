import { DatabaseModel } from "./DatabaseModel.mjs";

export class LocationModel extends DatabaseModel {
  constructor(id, name, address, phone, email, capacity, facilities, opening_hours, created_at, updated_at) {
    super();
    this.id = id;
    this.name = name;
    this.address = address;
    this.phone = phone;
    this.email = email;
    this.capacity = capacity;
    this.facilities = facilities;
    this.opening_hours = opening_hours;
  }

  static tableToModel(row) {
    const r = row.locations;
    return new LocationModel(
      r.id, r.name, r.address, r.phone, r.email, r.capacity, r.facilities, r.opening_hours, r.created_at, r.updated_at
    );
  }

  static async getAll() {
    return this.query("SELECT * FROM locations").then(rows => rows.map(row => this.tableToModel(row)));
  }

  static async getById(id) {
    return this.query("SELECT * FROM locations WHERE id = ?", [id]).then(rows =>
      rows.length ? this.tableToModel(rows[0]) : Promise.reject("not found")
    );
  }

  static async create(loc) {
    return this.query(
      `INSERT INTO locations (name, address, phone, email, capacity, facilities, opening_hours)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [loc.name, loc.address, loc.phone, loc.email, loc.capacity, loc.facilities, loc.opening_hours]
    );
  }

  static async update(loc) {
    return this.query(
      `UPDATE locations
       SET name=?, address=?, phone=?, email=?, capacity=?, facilities=?, opening_hours=?
       WHERE id=?`,
      [loc.name, loc.address, loc.phone, loc.email, loc.capacity, loc.facilities, loc.opening_hours, loc.id]
    );
  }

  static async delete(id) {
    return this.query("DELETE FROM locations WHERE id=?", [id]).then(r => r.affectedRows ?
      r : Promise.reject("not found"));
  }
}
