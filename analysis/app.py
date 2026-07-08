from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# Points at the same SQLite file the Node backend already writes to.
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'server', 'crime_reports.db')

# ---- Adjust these four to match your real schema. Not sure what they're
# ---- called? Start this service and open GET /analysis/schema in a
# ---- browser - it lists every table and column in the database.
TABLE = "reports"
TYPE_COLUMN = "type"
LOCATION_COLUMN = "location"
STATUS_COLUMN = "status"


def get_connection():
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database not found at {DB_PATH}")
    return sqlite3.connect(DB_PATH)


def load_df():
    conn = get_connection()
    try:
        return pd.read_sql_query(f"SELECT * FROM {TABLE}", conn)
    finally:
        conn.close()


def counts_by(column):
    try:
        df = load_df()
        return df[column].value_counts().to_dict(), None
    except Exception as e:
        return None, str(e)


@app.route('/')
def health():
    # start.sh / start.js health-check this route to know the service is up.
    return jsonify({"status": "ok", "service": "analysis"})


@app.route('/analysis/schema')
def schema():
    """Lists every table and column in the database - use this to find the
    real table/column names if the endpoints below return an error."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cur.fetchall()]
        result = {}
        for t in tables:
            cur.execute(f"PRAGMA table_info({t})")
            result[t] = [col[1] for col in cur.fetchall()]
        return jsonify(result)
    finally:
        conn.close()


@app.route('/analysis/by-type')
def by_type():
    data, err = counts_by(TYPE_COLUMN)
    if err:
        return jsonify({"error": err, "hint": "check /analysis/schema for real table/column names"}), 500
    return jsonify(data)


@app.route('/analysis/by-location')
def by_location():
    data, err = counts_by(LOCATION_COLUMN)
    if err:
        return jsonify({"error": err, "hint": "check /analysis/schema for real table/column names"}), 500
    return jsonify(data)


@app.route('/analysis/by-status')
def by_status():
    data, err = counts_by(STATUS_COLUMN)
    if err:
        return jsonify({"error": err, "hint": "check /analysis/schema for real table/column names"}), 500
    return jsonify(data)


@app.route('/analysis/summary')
def summary():
    try:
        df = load_df()
        return jsonify({
            "total_reports": int(len(df)),
            "by_type": df[TYPE_COLUMN].value_counts().to_dict(),
            "by_status": df[STATUS_COLUMN].value_counts().to_dict(),
        })
    except Exception as e:
        return jsonify({"error": str(e), "hint": "check /analysis/schema for real table/column names"}), 500


if __name__ == '__main__':
    app.run(port=5002, debug=True)
