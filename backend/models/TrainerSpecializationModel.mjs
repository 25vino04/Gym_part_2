import { DatabaseModel } from "./DatabaseModel.mjs";

export class TrainerSpecializationModel extends DatabaseModel {
  constructor(id, trainer_id, activity_id) {
    super();
    this.id = id;
    this.trainer_id = trainer_id;
    this.activity_id = activity_id;
  }

  static tableToModel(row) {
    const r = row.trainer_specializations;
    return new TrainerSpecializationModel(r.id, r.trainer_id, r.activity_id);
  }

  static async getAll() {
    return this.query("SELECT * FROM trainer_specializations").then(rows => 
        rows.map(row => this.tableToModel(row)));
  }

  static async getByTrainer(trainer_id) {
    return this.query("SELECT * FROM trainer_specializations WHERE trainer_id=?", [trainer_id])
      .then(rows => rows.map(row => this.tableToModel(row)));
  }

  static async create(ts) {
    return this.query(
      `INSERT INTO trainer_specializations (trainer_id, activity_id) VALUES (?, ?)`,
      [ts.trainer_id, ts.activity_id]
    );
  }

  static async delete(id) {
    return this.query("DELETE FROM trainer_specializations WHERE id=?", [id]).then(r => 
        r.affectedRows ? r : Promise.reject("not found"));
  }
}